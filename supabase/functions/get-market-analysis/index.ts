import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MarketAnalysisRequest {
  inventoryItemId: string;
  forceRefresh?: boolean;
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

    const { inventoryItemId, forceRefresh } = await req.json() as MarketAnalysisRequest;

    if (!inventoryItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing inventoryItemId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: inventoryItem, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (itemError || !inventoryItem) {
      return new Response(
        JSON.stringify({ error: 'Inventory item not found or unauthorized' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!forceRefresh) {
      const { data: cachedAnalysis } = await supabase
        .from('market_analysis_cache')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedAnalysis) {
        const result = {
          ...cachedAnalysis.analysis_data,
          cached: true,
          last_updated: cachedAnalysis.last_updated,
        };

        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log(`Fetching market analysis for item: ${inventoryItem.name}`);

    const mockListings = [
      {
        id: crypto.randomUUID(),
        inventory_item_id: inventoryItemId,
        ebay_item_id: 'mock-123',
        title: `${inventoryItem.name} - Similar Item`,
        sold_price: inventoryItem.current_value ? inventoryItem.current_value * 0.95 : 50.00,
        sold_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        condition: inventoryItem.condition || 'Good',
        listing_url: 'https://ebay.com/itm/mock-123',
        image_url: inventoryItem.photo_url || null,
        seller_info: { username: 'seller123', rating: 98.5 },
        shipping_cost: 8.99,
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        inventory_item_id: inventoryItemId,
        ebay_item_id: 'mock-456',
        title: `${inventoryItem.name} - Comparable`,
        sold_price: inventoryItem.current_value ? inventoryItem.current_value * 1.05 : 55.00,
        sold_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        condition: inventoryItem.condition || 'Very Good',
        listing_url: 'https://ebay.com/itm/mock-456',
        image_url: inventoryItem.photo_url || null,
        seller_info: { username: 'dealer456', rating: 99.2 },
        shipping_cost: 12.50,
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        inventory_item_id: inventoryItemId,
        ebay_item_id: 'mock-789',
        title: `${inventoryItem.name} - Like Yours`,
        sold_price: inventoryItem.current_value ? inventoryItem.current_value * 1.02 : 52.50,
        sold_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        condition: inventoryItem.condition || 'Excellent',
        listing_url: 'https://ebay.com/itm/mock-789',
        image_url: inventoryItem.photo_url || null,
        seller_info: { username: 'collector789', rating: 100.0 },
        shipping_cost: 10.00,
        created_at: new Date().toISOString(),
      },
    ];

    const prices = mockListings.map(l => l.sold_price);
    const average_price = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const min_price = Math.min(...prices);
    const max_price = Math.max(...prices);

    const analysisData = {
      average_price,
      min_price,
      max_price,
      sample_size: mockListings.length,
      trending: 'stable' as const,
      listings: mockListings,
    };

    await supabase
      .from('market_analysis_cache')
      .upsert({
        inventory_item_id: inventoryItemId,
        analysis_data: analysisData,
        last_updated: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'inventory_item_id' });

    const result = {
      ...analysisData,
      cached: false,
      last_updated: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Market analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
