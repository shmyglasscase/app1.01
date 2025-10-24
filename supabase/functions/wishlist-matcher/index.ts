import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WishlistItem {
  id: string;
  user_id: string;
  item_name: string;
  category?: string;
  manufacturer?: string;
  pattern?: string;
  description?: string;
}

interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  asking_price?: number;
}

interface MatchDetails {
  name_score: number;
  category_score: number;
  manufacturer_score: number;
  pattern_score: number;
  description_score: number;
}

function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, similarity);
}

function calculateMatchScore(
  wishlistItem: WishlistItem,
  listing: MarketplaceListing
): { score: number; details: MatchDetails } {
  const nameScore = calculateSimilarity(wishlistItem.item_name, listing.title);
  
  const categoryScore = wishlistItem.category && listing.category
    ? calculateSimilarity(wishlistItem.category, listing.category)
    : 0;
  
  const manufacturerScore = wishlistItem.manufacturer
    ? calculateSimilarity(
        wishlistItem.manufacturer,
        `${listing.title} ${listing.description || ''}`
      )
    : 0;
  
  const patternScore = wishlistItem.pattern
    ? calculateSimilarity(
        wishlistItem.pattern,
        `${listing.title} ${listing.description || ''}`
      )
    : 0;
  
  const descriptionScore =
    wishlistItem.description && listing.description
      ? calculateSimilarity(wishlistItem.description, listing.description)
      : 0;

  const weightedScore =
    nameScore * 0.5 +
    categoryScore * 0.2 +
    manufacturerScore * 0.15 +
    patternScore * 0.1 +
    descriptionScore * 0.05;

  return {
    score: Math.round(weightedScore),
    details: {
      name_score: Math.round(nameScore),
      category_score: Math.round(categoryScore),
      manufacturer_score: Math.round(manufacturerScore),
      pattern_score: Math.round(patternScore),
      description_score: Math.round(descriptionScore),
    },
  };
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

    const { mode, wishlistItemId, marketplaceListingId } = await req.json();

    if (mode === 'match_listing') {
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', marketplaceListingId)
        .eq('listing_status', 'active')
        .single();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: 'Listing not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: wishlistItems } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('status', 'active')
        .neq('user_id', listing.user_id);

      const matches = [];

      for (const item of wishlistItems || []) {
        const { score, details } = calculateMatchScore(item, listing);
        
        if (score >= 80) {
          const { error: insertError } = await supabase
            .from('wishlist_matches')
            .upsert(
              {
                wishlist_item_id: item.id,
                marketplace_listing_id: listing.id,
                match_score: score,
                match_details: details,
                match_status: 'new',
              },
              { onConflict: 'wishlist_item_id,marketplace_listing_id' }
            );

          if (!insertError) {
            const { data: matchRecord } = await supabase
              .from('wishlist_matches')
              .select('id')
              .eq('wishlist_item_id', item.id)
              .eq('marketplace_listing_id', listing.id)
              .maybeSingle();

            if (matchRecord) {
              const { data: existingNotification } = await supabase
                .from('user_notifications')
                .select('id')
                .eq('user_id', item.user_id)
                .eq('type', 'wishlist_match')
                .eq('related_id', matchRecord.id)
                .maybeSingle();

              if (!existingNotification) {
                await supabase.from('user_notifications').insert({
                  user_id: item.user_id,
                  type: 'wishlist_match',
                  title: 'New Match Found!',
                  message: `We found a ${score}% match for "${item.item_name}"`,
                  related_id: matchRecord.id,
                  is_read: false,
                });
              }
            }

            matches.push({ wishlistItemId: item.id, score, details });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, matchesCreated: matches.length, matches }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (mode === 'match_wishlist') {
      const { data: wishlistItem } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', wishlistItemId)
        .single();

      if (!wishlistItem) {
        return new Response(
          JSON.stringify({ error: 'Wishlist item not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('listing_status', 'active')
        .neq('user_id', wishlistItem.user_id);

      const matches = [];

      for (const listing of listings || []) {
        const { score, details } = calculateMatchScore(wishlistItem, listing);

        if (score >= 80) {
          const { error: insertError } = await supabase
            .from('wishlist_matches')
            .upsert(
              {
                wishlist_item_id: wishlistItem.id,
                marketplace_listing_id: listing.id,
                match_score: score,
                match_details: details,
                match_status: 'new',
              },
              { onConflict: 'wishlist_item_id,marketplace_listing_id' }
            );

          if (!insertError) {
            const { data: matchRecord } = await supabase
              .from('wishlist_matches')
              .select('id')
              .eq('wishlist_item_id', wishlistItem.id)
              .eq('marketplace_listing_id', listing.id)
              .maybeSingle();

            if (matchRecord) {
              const { data: existingNotification } = await supabase
                .from('user_notifications')
                .select('id')
                .eq('user_id', wishlistItem.user_id)
                .eq('type', 'wishlist_match')
                .eq('related_id', matchRecord.id)
                .maybeSingle();

              if (!existingNotification) {
                await supabase.from('user_notifications').insert({
                  user_id: wishlistItem.user_id,
                  type: 'wishlist_match',
                  title: 'New Match Found!',
                  message: `We found a ${score}% match for "${wishlistItem.item_name}"`,
                  related_id: matchRecord.id,
                  is_read: false,
                });
              }
            }

            matches.push({ marketplaceListingId: listing.id, score, details });
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, matchesCreated: matches.length, matches }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});