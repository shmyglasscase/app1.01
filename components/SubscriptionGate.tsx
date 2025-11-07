import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionPaywallModal } from './SubscriptionPaywallModal';

interface SubscriptionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  showPaywall?: boolean;
}

export function SubscriptionGate({
  children,
  fallback,
  showPaywall = true,
}: SubscriptionGateProps) {
  const { hasAccess, loading } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (loading) {
    return <View />;
  }

  if (!hasAccess) {
    if (showPaywall) {
      return (
        <>
          {fallback}
          <SubscriptionPaywallModal
            visible={!paywallVisible}
            onClose={() => setPaywallVisible(false)}
            onSubscribed={() => setPaywallVisible(false)}
          />
        </>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
