import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PopularCategory {
  id: string;
  category_normalized: string;
  category_display: string;
  category_type: 'category' | 'subcategory';
  unique_user_count: number;
  total_usage_count: number;
  is_active: boolean;
  listing_count?: number;
}

export interface CategoryFilters {
  type?: 'category' | 'subcategory';
  minUsers?: number;
  limit?: number;
}

export function usePopularCategories(filters?: CategoryFilters) {
  const [categories, setCategories] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularCategories();
  }, [filters?.type, filters?.minUsers, filters?.limit]);

  const fetchPopularCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('popular_categories')
        .select('*')
        .eq('is_active', true)
        .order('unique_user_count', { ascending: false })
        .order('total_usage_count', { ascending: false });

      if (filters?.type) {
        query = query.eq('category_type', filters.type);
      }

      if (filters?.minUsers) {
        query = query.gte('unique_user_count', filters.minUsers);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
            .or(
              cat.category_type === 'category'
                ? `category.ilike.${cat.category_display}`
                : `subcategory.ilike.${cat.category_display}`
            );

          return {
            ...cat,
            listing_count: count || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error('Error fetching popular categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchPopularCategories();
  };

  return {
    categories,
    loading,
    error,
    refresh,
  };
}

export function useCategorySuggestions(searchText: string, type: 'category' | 'subcategory' = 'category') {
  const [suggestions, setSuggestions] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchText || searchText.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('popular_categories')
          .select('*')
          .eq('category_type', type)
          .eq('is_active', true)
          .ilike('category_display', `%${searchText}%`)
          .order('unique_user_count', { ascending: false })
          .limit(5);

        if (error) throw error;

        setSuggestions(data || []);
      } catch (err) {
        console.error('Error fetching category suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchText, type]);

  return {
    suggestions,
    loading,
  };
}

export function useDistinctFilterOptions() {
  const [conditions, setConditions] = useState<string[]>([]);
  const [listingTypes, setListingTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistinctOptions();
  }, []);

  const fetchDistinctOptions = async () => {
    try {
      setLoading(true);

      const { data: listings, error } = await supabase
        .from('marketplace_listings')
        .select('condition, listing_type');

      if (error) throw error;

      const uniqueConditions = Array.from(
        new Set(
          listings
            ?.map((l) => l.condition)
            .filter((c): c is string => c !== null && c !== '')
        )
      ).sort();

      const uniqueListingTypes = Array.from(
        new Set(
          listings
            ?.map((l) => l.listing_type)
            .filter((t): t is string => t !== null && t !== '')
        )
      ).sort();

      setConditions(uniqueConditions);
      setListingTypes(uniqueListingTypes);
    } catch (err) {
      console.error('Error fetching distinct filter options:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    conditions,
    listingTypes,
    loading,
  };
}
