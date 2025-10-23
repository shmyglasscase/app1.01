import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useMatchProcessor() {
  const { user } = useAuth();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const processJobs = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const { data: jobs } = await supabase
          .from('pending_match_jobs')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5);

        if (!jobs || jobs.length === 0) {
          processingRef.current = false;
          return;
        }

        for (const job of jobs) {
          await supabase
            .from('pending_match_jobs')
            .update({ status: 'processing' })
            .eq('id', job.id);

          try {
            const authToken = (await supabase.auth.getSession()).data.session
              ?.access_token;

            if (!authToken) continue;

            const response = await fetch(
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wishlist-matcher`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  mode: job.job_type === 'match_listing' ? 'match_listing' : 'match_wishlist',
                  marketplaceListingId:
                    job.job_type === 'match_listing' ? job.reference_id : undefined,
                  wishlistItemId:
                    job.job_type === 'match_wishlist' ? job.reference_id : undefined,
                }),
              }
            );

            if (response.ok) {
              await supabase
                .from('pending_match_jobs')
                .update({
                  status: 'completed',
                  processed_at: new Date().toISOString(),
                })
                .eq('id', job.id);
            } else {
              const error = await response.text();
              await supabase
                .from('pending_match_jobs')
                .update({
                  status: 'failed',
                  error_message: error,
                  processed_at: new Date().toISOString(),
                })
                .eq('id', job.id);
            }
          } catch (error) {
            await supabase
              .from('pending_match_jobs')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                processed_at: new Date().toISOString(),
              })
              .eq('id', job.id);
          }
        }
      } catch (error) {
        console.error('Error processing match jobs:', error);
      } finally {
        processingRef.current = false;
      }
    };

    processJobs();
    const interval = setInterval(processJobs, 30000);

    const subscription = supabase
      .channel('pending_match_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_match_jobs',
        },
        () => {
          processJobs();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [user]);
}
