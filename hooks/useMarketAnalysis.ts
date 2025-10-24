import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MarketAnalysisResult } from '@/types/database';

interface UseMarketAnalysisOptions {
  inventoryItemId: string | null;
  autoFetch?: boolean;
}

interface UseMarketAnalysisResult {
  data: MarketAnalysisResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMarketAnalysis({
  inventoryItemId,
  autoFetch = true,
}: UseMarketAnalysisOptions): UseMarketAnalysisResult {
  const [data, setData] = useState<MarketAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchMarketAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!inventoryItemId || fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const { data: session } = await supabase.auth.getSession();
        const authToken = session?.session?.access_token;

        if (!authToken) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-market-analysis`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inventoryItemId,
              forceRefresh,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch market analysis');
        }

        const result: MarketAnalysisResult = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Market analysis error:', err);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [inventoryItemId]
  );

  const refresh = useCallback(async () => {
    await fetchMarketAnalysis(true);
  }, [fetchMarketAnalysis]);

  useEffect(() => {
    if (autoFetch && inventoryItemId) {
      fetchMarketAnalysis(false);
    }
  }, [inventoryItemId, autoFetch, fetchMarketAnalysis]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
