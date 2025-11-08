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

interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  manufacturer?: string;
  pattern?: string;
  category?: string;
  condition?: string;
  year_manufactured?: number;
  current_value?: number;
  photo_url?: string;
}

interface EbayListing {
  itemId: string;
  title: string;
  sellingStatus: {
    convertedCurrentPrice: {
      value: number;
    };
  };
  listingInfo: {
    endTime: string;
  };
  condition?: {
    conditionDisplayName: string;
  };
  viewItemURL: string;
  galleryURL?: string;
  sellerInfo?: {
    sellerUserName: string;
    feedbackScore: number;
  };
  shippingInfo?: {
    shippingServiceCost?: {
      value: number;
    };
  };
}

interface ScoredListing {
  listing: EbayListing;
  similarityScore: number;
}

function calculateSimilarity(inventoryItem: InventoryItem, ebayTitle: string, ebayCondition?: string): number {
  let score = 0;
  const title = ebayTitle.toLowerCase();
  const itemName = inventoryItem.name.toLowerCase();

  const nameWords = itemName.split(/\s+/).filter(w => w.length > 2);
  const titleWords = title.split(/\s+/);

  let matchedWords = 0;
  for (const word of nameWords) {
    if (titleWords.some(tw => tw.includes(word) || word.includes(tw))) {
      matchedWords++;
    }
  }
  const nameMatchRatio = nameWords.length > 0 ? matchedWords / nameWords.length : 0;
  score += nameMatchRatio * 50;

  if (inventoryItem.manufacturer) {
    const manufacturer = inventoryItem.manufacturer.toLowerCase();
    if (title.includes(manufacturer)) {
      score += 20;
    } else {
      const manuWords = manufacturer.split(/\s+/);
      if (manuWords.some(w => title.includes(w) && w.length > 2)) {
        score += 10;
      }
    }
  }

  if (inventoryItem.pattern) {
    const pattern = inventoryItem.pattern.toLowerCase();
    if (title.includes(pattern)) {
      score += 15;
    } else {
      const patternWords = pattern.split(/\s+/);
      if (patternWords.some(w => title.includes(w) && w.length > 2)) {
        score += 7;
      }
    }
  }

  if (inventoryItem.condition && ebayCondition) {
    const itemCond = inventoryItem.condition.toLowerCase();
    const ebayCond = ebayCondition.toLowerCase();
    if (itemCond === ebayCond) {
      score += 10;
    } else if (
      (itemCond.includes('new') && ebayCond.includes('new')) ||
      (itemCond.includes('excellent') && ebayCond.includes('like new')) ||
      (itemCond.includes('good') && ebayCond.includes('good')) ||
      (itemCond.includes('used') && ebayCond.includes('used'))
    ) {
      score += 5;
    }
  }

  if (inventoryItem.category) {
    const category = inventoryItem.category.toLowerCase();
    if (title.includes(category)) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

async function searchEbayListings(inventoryItem: InventoryItem): Promise<ScoredListing[]> {
  const ebayAppId = Deno.env.get('EBAY_APP_ID');

  if (!ebayAppId) {
    console.warn('EBAY_APP_ID not configured, using mock data');
    return [];
  }

  try {
    const searchTerms = [
      inventoryItem.name,
      inventoryItem.manufacturer,
      inventoryItem.pattern,
    ].filter(Boolean).join(' ').trim();

    if (!searchTerms) {
      console.warn('No valid search terms provided for inventory item');
      return [];
    }

    const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const formattedDate = ninetyDaysAgo.toISOString();

    const queryParams: Record<string, string> = {
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': ebayAppId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'keywords': searchTerms,
      'paginationInput.entriesPerPage': '25',
      'sortOrder': 'EndTimeSoonest',
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'itemFilter(1).name': 'EndTimeFrom',
      'itemFilter(1).value': formattedDate,
    };

    if (inventoryItem.condition) {
      const conditionMap: Record<string, string> = {
        'new': '1000',
        'like new': '1500',
        'excellent': '2000',
        'very good': '2500',
        'good': '3000',
        'used': '3000',
        'acceptable': '4000',
      };
      const conditionValue = conditionMap[inventoryItem.condition.toLowerCase()];
      if (conditionValue) {
        queryParams['itemFilter(2).name'] = 'Condition';
        queryParams['itemFilter(2).value'] = conditionValue;
      }
    }

    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `${baseUrl}?${queryString}`;

    console.log(`Searching eBay for: "${searchTerms}"`);
    console.log(`eBay URL: ${url.replace(ebayAppId, 'REDACTED')}`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log(`eBay API status: ${response.status}`);
    console.log(`eBay API response preview: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error(`eBay API error ${response.status}: Full response:`, responseText);

      if (response.status === 500) {
        try {
          const errorData = JSON.parse(responseText);
          const errorMessage = errorData?.errorMessage?.[0]?.error?.[0]?.message?.[0];
          const errorId = errorData?.errorMessage?.[0]?.error?.[0]?.errorId?.[0];
          console.warn(`eBay error ${errorId}: ${errorMessage}`);
        } catch (e) {
          console.error('Could not parse eBay error response');
        }
        console.warn('eBay API error 500 (likely rate limit), returning empty results');
        return [];
      }

      throw new Error(`eBay API error: ${response.status}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse eBay response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid JSON response from eBay API');
    }

    const searchResult = data.findCompletedItemsResponse?.[0];

    if (!searchResult?.searchResult?.[0]?.item) {
      console.log('No eBay results found');
      return [];
    }

    const items: EbayListing[] = searchResult.searchResult[0].item;

    const scoredListings: ScoredListing[] = items.map((listing: EbayListing) => {
      const similarityScore = calculateSimilarity(
        inventoryItem,
        listing.title,
        listing.condition?.conditionDisplayName
      );
      return { listing, similarityScore };
    });

    scoredListings.sort((a, b) => b.similarityScore - a.similarityScore);

    const MINIMUM_SIMILARITY = 30;
    const topMatches = scoredListings.filter(sl => sl.similarityScore >= MINIMUM_SIMILARITY).slice(0, 5);

    console.log(`Found ${items.length} eBay listings, ${topMatches.length} after similarity filtering`);

    return topMatches;
  } catch (error) {
    console.error('eBay API error:', error);
    return [];
  }
}

function calculateTrend(listings: ScoredListing[]): 'up' | 'down' | 'stable' {
  if (listings.length < 3) return 'stable';

  const sortedByDate = [...listings].sort((a, b) => {
    const dateA = new Date(a.listing.listingInfo.endTime).getTime();
    const dateB = new Date(b.listing.listingInfo.endTime).getTime();
    return dateA - dateB;
  });

  const midpoint = Math.floor(sortedByDate.length / 2);
  const olderHalf = sortedByDate.slice(0, midpoint);
  const newerHalf = sortedByDate.slice(midpoint);

  const avgOlder = olderHalf.reduce((sum, l) => sum + l.listing.sellingStatus.convertedCurrentPrice.value, 0) / olderHalf.length;
  const avgNewer = newerHalf.reduce((sum, l) => sum + l.listing.sellingStatus.convertedCurrentPrice.value, 0) / newerHalf.length;

  const percentChange = ((avgNewer - avgOlder) / avgOlder) * 100;

  if (percentChange > 10) return 'up';
  if (percentChange < -10) return 'down';
  return 'stable';
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

    const { data: cachedAnalysis } = await supabase
      .from('market_analysis_cache')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .maybeSingle();

    if (cachedAnalysis && !forceRefresh) {
      const isExpired = new Date(cachedAnalysis.expires_at) < new Date();

      if (!isExpired) {
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

    const scoredListings = await searchEbayListings(inventoryItem);

    if (scoredListings.length === 0) {
      if (cachedAnalysis) {
        console.log('Using stale cache due to eBay API unavailability');
        const result = {
          ...cachedAnalysis.analysis_data,
          cached: true,
          stale: true,
          last_updated: cachedAnalysis.last_updated,
          message: 'Using cached data (eBay API temporarily unavailable)',
        };

        return new Response(
          JSON.stringify(result),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const emptyResult = {
        average_price: 0,
        min_price: 0,
        max_price: 0,
        sample_size: 0,
        trending: 'stable' as const,
        listings: [],
        cached: false,
        last_updated: new Date().toISOString(),
        message: 'No market data available at this time',
      };

      return new Response(
        JSON.stringify(emptyResult),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const formattedListings = scoredListings.map(sl => ({
      id: crypto.randomUUID(),
      inventory_item_id: inventoryItemId,
      ebay_item_id: sl.listing.itemId[0],
      title: sl.listing.title[0],
      sold_price: sl.listing.sellingStatus[0].convertedCurrentPrice[0].value,
      sold_date: sl.listing.listingInfo[0].endTime[0],
      condition: sl.listing.condition?.[0]?.conditionDisplayName?.[0] || '',
      listing_url: sl.listing.viewItemURL[0],
      image_url: sl.listing.galleryURL?.[0] || null,
      seller_info: {
        username: sl.listing.sellerInfo?.[0]?.sellerUserName?.[0] || '',
        rating: sl.listing.sellerInfo?.[0]?.feedbackScore?.[0] || 0,
      },
      shipping_cost: sl.listing.shippingInfo?.[0]?.shippingServiceCost?.[0]?.value || 0,
      created_at: new Date().toISOString(),
    }));

    const prices = formattedListings.map(l => l.sold_price);
    const average_price = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const min_price = Math.min(...prices);
    const max_price = Math.max(...prices);
    const trending = calculateTrend(scoredListings);

    const analysisData = {
      average_price,
      min_price,
      max_price,
      sample_size: formattedListings.length,
      trending,
      listings: formattedListings,
    };

    for (const listing of formattedListings) {
      await supabase
        .from('ebay_market_data')
        .upsert(listing, { onConflict: 'ebay_item_id' });
    }

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