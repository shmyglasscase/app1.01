import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchFilters {
  categories?: string[];
  subcategories?: string[];
  conditions?: string[];
  listingTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
}

export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  search_query: string | null;
  filters_applied: SearchFilters;
  results_count: number;
  created_at: string;
}

export function useSearchHistory() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const trackSearch = useCallback(
    async (searchQuery: string | null, filters: SearchFilters, resultsCount: number) => {
      if (!user) return;

      try {
        setIsSaving(true);

        const { error } = await supabase.from('user_search_history').insert({
          user_id: user.id,
          search_query: searchQuery,
          filters_applied: filters,
          results_count: resultsCount,
        });

        if (error) throw error;
      } catch (err) {
        console.error('Error tracking search:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  const getRecentSearches = useCallback(
    async (limit: number = 10): Promise<SearchHistoryEntry[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('user_search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return data || [];
      } catch (err) {
        console.error('Error fetching search history:', err);
        return [];
      }
    },
    [user]
  );

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  }, [user]);

  return {
    trackSearch,
    getRecentSearches,
    clearHistory,
    isSaving,
  };
}
