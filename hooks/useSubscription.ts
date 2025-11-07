import { useState, useEffect, useCallback } from 'react';
import {
  checkSubscriptionStatus,
  initializeIAP,
  startFreeTrial,
  SubscriptionInfo,
} from '@/lib/subscriptions';
import { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    hasAccess: false,
    status: 'none',
    daysRemaining: 0,
    isTrial: false,
  });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionInfo({
        hasAccess: false,
        status: 'none',
        daysRemaining: 0,
        isTrial: false,
      });
      setLoading(false);
      return;
    }

    try {
      const info = await checkSubscriptionStatus();
      setSubscriptionInfo(info);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const initializeTrial = useCallback(async () => {
    if (!user) return false;

    try {
      const success = await startFreeTrial();
      if (success) {
        await refreshSubscription();
      }
      return success;
    } catch (error) {
      console.error('Failed to initialize trial:', error);
      return false;
    }
  }, [user, refreshSubscription]);

  useEffect(() => {
    const initialize = async () => {
      const success = await initializeIAP();
      setInitialized(success);
      await refreshSubscription();
    };

    initialize();
  }, [refreshSubscription]);

  return {
    subscriptionInfo,
    loading,
    initialized,
    hasAccess: subscriptionInfo.hasAccess,
    isTrialActive: subscriptionInfo.isTrial && subscriptionInfo.hasAccess,
    isSubscribed: subscriptionInfo.status === 'active',
    daysRemaining: subscriptionInfo.daysRemaining,
    refreshSubscription,
    initializeTrial,
  };
}
