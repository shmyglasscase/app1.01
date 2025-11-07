import {
  connectAsync,
  IAPItemDetails,
  InAppPurchase,
  purchaseItemAsync,
  finishTransactionAsync,
  getPurchaseHistoryAsync,
} from 'expo-in-app-purchases';
import { supabase } from './supabase';

export const SUBSCRIPTION_PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.myglasscase.app.premium.monthly',
} as const;

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'refunded' | 'none';

export interface SubscriptionInfo {
  hasAccess: boolean;
  status: SubscriptionStatus;
  daysRemaining: number;
  isTrial: boolean;
}

export async function initializeIAP(): Promise<boolean> {
  try {
    await connectAsync();
    return true;
  } catch (error) {
    console.error('Failed to connect to IAP:', error);
    return false;
  }
}

export async function getProductDetails(): Promise<any[]> {
  try {
    const response = await (IAPItemDetails as any).getProductsAsync([
      SUBSCRIPTION_PRODUCT_IDS.PREMIUM_MONTHLY,
    ]);

    if (response?.results) {
      return response.results;
    }
    return [];
  } catch (error) {
    console.error('Failed to get product details:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<boolean> {
  try {
    await purchaseItemAsync(productId);
    return true;
  } catch (error) {
    console.error('Purchase failed:', error);
    return false;
  }
}

export async function handlePurchaseUpdate(purchase: InAppPurchase): Promise<void> {
  const { acknowledged, transactionReceipt, productId } = purchase;

  if (!acknowledged) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            receipt: transactionReceipt,
            productId,
            userId: user.id,
          }),
        }
      );

      if (response.ok) {
        await finishTransactionAsync(purchase, false);
      }
    } catch (error) {
      console.error('Failed to handle purchase update:', error);
    }
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const { results } = await getPurchaseHistoryAsync();

    if (results && results.length > 0) {
      const latestPurchase = results[0];
      await handlePurchaseUpdate(latestPurchase);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
}

export async function checkSubscriptionStatus(): Promise<SubscriptionInfo> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        hasAccess: false,
        status: 'none',
        daysRemaining: 0,
        isTrial: false,
      };
    }

    const { data, error } = await supabase.rpc('check_user_subscription_status', {
      check_user_id: user.id,
    });

    if (error || !data || data.length === 0) {
      return {
        hasAccess: false,
        status: 'none',
        daysRemaining: 0,
        isTrial: false,
      };
    }

    const result = data[0];
    return {
      hasAccess: result.has_access,
      status: result.status,
      daysRemaining: result.days_remaining,
      isTrial: result.is_trial,
    };
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return {
      hasAccess: false,
      status: 'none',
      daysRemaining: 0,
      isTrial: false,
    };
  }
}

export async function startFreeTrial(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('start_user_trial', {
      trial_user_id: user.id,
    });

    if (error) {
      console.error('Failed to start trial:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to start trial:', error);
    return false;
  }
}

export async function cancelSubscription(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}
