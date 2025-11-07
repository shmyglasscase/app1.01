import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerifySubscriptionRequest {
  receipt: string;
  productId: string;
  userId: string;
}

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    in_app?: Array<{
      transaction_id: string;
      original_transaction_id: string;
      product_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      cancellation_date_ms?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    transaction_id: string;
    original_transaction_id: string;
    product_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    cancellation_date_ms?: string;
    is_trial_period?: string;
  }>;
}

async function verifyAppleReceipt(receipt: string, isProduction: boolean): Promise<AppleReceiptResponse> {
  const verifyUrl = isProduction
    ? 'https://buy.itunes.apple.com/verifyReceipt'
    : 'https://sandbox.itunes.apple.com/verifyReceipt';

  const appleSharedSecret = Deno.env.get('APPLE_SHARED_SECRET');

  const requestBody = {
    'receipt-data': receipt,
    'password': appleSharedSecret,
    'exclude-old-transactions': true,
  };

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Apple receipt verification failed: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { receipt, productId, userId } = await req.json() as VerifySubscriptionRequest;

    if (!receipt || !productId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let receiptData: AppleReceiptResponse;
    try {
      receiptData = await verifyAppleReceipt(receipt, true);
      
      if (receiptData.status === 21007) {
        receiptData = await verifyAppleReceipt(receipt, false);
      }
    } catch (error) {
      console.error('Receipt verification error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify receipt with Apple' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (receiptData.status !== 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid receipt', status: receiptData.status }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const latestReceiptInfo = receiptData.latest_receipt_info?.[0];
    if (!latestReceiptInfo) {
      return new Response(
        JSON.stringify({ error: 'No receipt info found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const expiresDate = latestReceiptInfo.expires_date_ms
      ? new Date(parseInt(latestReceiptInfo.expires_date_ms))
      : null;
    const purchaseDate = new Date(parseInt(latestReceiptInfo.purchase_date_ms));
    const isCancelled = !!latestReceiptInfo.cancellation_date_ms;
    const isTrial = latestReceiptInfo.is_trial_period === 'true';

    const subscriptionStatus = isCancelled
      ? 'cancelled'
      : expiresDate && expiresDate > new Date()
      ? 'active'
      : 'expired';

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        status: subscriptionStatus,
        subscription_tier: 'premium',
        apple_transaction_id: latestReceiptInfo.transaction_id,
        apple_original_transaction_id: latestReceiptInfo.original_transaction_id,
        apple_product_id: latestReceiptInfo.product_id,
        subscription_start: isTrial ? null : purchaseDate.toISOString(),
        subscription_end: expiresDate?.toISOString() || null,
        trial_start: isTrial ? purchaseDate.toISOString() : null,
        trial_end: isTrial && expiresDate ? expiresDate.toISOString() : null,
        auto_renew: !isCancelled,
        cancelled_at: isCancelled && latestReceiptInfo.cancellation_date_ms
          ? new Date(parseInt(latestReceiptInfo.cancellation_date_ms)).toISOString()
          : null,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('id', userId);

    return new Response(
      JSON.stringify({
        success: true,
        status: subscriptionStatus,
        expiresAt: expiresDate?.toISOString(),
        isTrial,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Subscription verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});