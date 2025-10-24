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
        const { data: jobs, error: fetchError } = await supabase
          .from('pending_match_jobs')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5);

        if (fetchError) {
          console.error('Error fetching pending jobs:', fetchError);
          processingRef.current = false;
          return;
        }

        if (!jobs || jobs.length === 0) {
          processingRef.current = false;
          return;
        }

        console.log(`Processing ${jobs.length} pending match jobs`);

        for (const job of jobs) {
          console.log(`Starting job ${job.id}: ${job.job_type} for ${job.reference_id}`);

          await supabase
            .from('pending_match_jobs')
            .update({ status: 'processing' })
            .eq('id', job.id);

          try {
            const authToken = (await supabase.auth.getSession()).data.session
              ?.access_token;

            if (!authToken) {
              console.error(`No auth token available for job ${job.id}`);
              continue;
            }

            const requestBody = {
              mode: job.job_type === 'match_listing' ? 'match_listing' : 'match_wishlist',
              marketplaceListingId:
                job.job_type === 'match_listing' ? job.reference_id : undefined,
              wishlistItemId:
                job.job_type === 'match_wishlist' ? job.reference_id : undefined,
            };

            console.log(`Calling Edge Function for job ${job.id}:`, requestBody);

            const response = await fetch(
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/wishlist-matcher`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              }
            );

            const responseText = await response.text();
            console.log(`Edge Function response for job ${job.id}:`, {
              status: response.status,
              ok: response.ok,
              body: responseText,
            });

            if (response.ok) {
              const result = JSON.parse(responseText);
              console.log(`Job ${job.id} completed successfully. Matches created: ${result.matchesCreated}`);

              await supabase
                .from('pending_match_jobs')
                .update({
                  status: 'completed',
                  processed_at: new Date().toISOString(),
                })
                .eq('id', job.id);
            } else {
              console.error(`Job ${job.id} failed with status ${response.status}:`, responseText);

              await supabase
                .from('pending_match_jobs')
                .update({
                  status: 'failed',
                  error_message: responseText,
                  processed_at: new Date().toISOString(),
                })
                .eq('id', job.id);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Exception processing job ${job.id}:`, error);

            await supabase
              .from('pending_match_jobs')
              .update({
                status: 'failed',
                error_message: errorMessage,
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
