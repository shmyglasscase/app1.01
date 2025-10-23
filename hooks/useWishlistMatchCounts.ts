import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useWishlistMatchCounts(wishlistItemIds: string[]) {
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistItemIds.length === 0) {
      setMatchCounts({});
      setLoading(false);
      return;
    }

    loadMatchCounts();

    const subscription = supabase
      .channel('wishlist_matches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_matches',
        },
        () => {
          loadMatchCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [wishlistItemIds.join(',')]);

  const loadMatchCounts = async () => {
    if (wishlistItemIds.length === 0) return;

    const { data, error } = await supabase
      .from('wishlist_matches')
      .select('wishlist_item_id')
      .in('wishlist_item_id', wishlistItemIds)
      .neq('match_status', 'dismissed')
      .gte('match_score', 80);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((match) => {
        counts[match.wishlist_item_id] = (counts[match.wishlist_item_id] || 0) + 1;
      });
      setMatchCounts(counts);
    }
    setLoading(false);
  };

  return { matchCounts, loading };
}
