import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useWishlistNewMatchesCount() {
  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNewMatchesCount(0);
      setLoading(false);
      return;
    }

    loadNewMatchesCount();

    const subscription = supabase
      .channel('wishlist_new_matches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_matches',
        },
        () => {
          loadNewMatchesCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadNewMatchesCount = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wishlist_matches')
      .select(`
        wishlist_item_id,
        wishlist_items!inner(user_id)
      `)
      .eq('match_status', 'new')
      .eq('wishlist_items.user_id', user.id)
      .gte('match_score', 80);

    if (data) {
      const uniqueWishlistItemsWithNewMatches = new Set(
        data.map((match: any) => match.wishlist_item_id)
      );

      setNewMatchesCount(uniqueWishlistItemsWithNewMatches.size);
    }
    setLoading(false);
  };

  return { newMatchesCount, loading };
}
