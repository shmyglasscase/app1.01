import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Crown, Calendar, RefreshCw, XCircle } from 'lucide-react-native';
import { useSubscription } from '@/hooks/useSubscription';
import { cancelSubscription, restorePurchases } from '@/lib/subscriptions';

interface SubscriptionManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionManagementModal({
  visible,
  onClose,
}: SubscriptionManagementModalProps) {
  const {
    subscriptionInfo,
    loading,
    isTrialActive,
    isSubscribed,
    daysRemaining,
    refreshSubscription,
  } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const success = await cancelSubscription();
              if (success) {
                await refreshSubscription();
                Alert.alert(
                  'Subscription Cancelled',
                  'Your subscription has been cancelled. You will retain access until the end of your billing period.'
                );
              } else {
                Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        await refreshSubscription();
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'trial':
        return 'Free Trial';
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return '#2563eb';
      case 'active':
        return '#38a169';
      case 'expired':
        return '#e53e3e';
      case 'cancelled':
        return '#ed8936';
      default:
        return '#718096';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Subscription</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38a169" />
            </View>
          ) : (
            <>
              <View style={styles.statusCard}>
                <View style={styles.statusIconContainer}>
                  <Crown size={32} color={getStatusColor(subscriptionInfo.status)} />
                </View>
                <Text style={styles.statusTitle}>
                  {formatStatus(subscriptionInfo.status)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(subscriptionInfo.status)}15` },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(subscriptionInfo.status) }]}
                  >
                    {subscriptionInfo.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {subscriptionInfo.hasAccess && (
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Calendar size={20} color="#718096" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>
                        {isTrialActive ? 'Trial Ends In' : 'Renews In'}
                      </Text>
                      <Text style={styles.infoValue}>
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  </View>

                  {isTrialActive && (
                    <View style={styles.trialInfo}>
                      <Text style={styles.trialInfoText}>
                        Your trial will automatically convert to a paid subscription unless
                        cancelled.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actionsCard}>
                <Text style={styles.actionsTitle}>Manage Subscription</Text>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={refreshSubscription}
                  disabled={loading}
                >
                  <RefreshCw size={20} color="#38a169" />
                  <Text style={styles.actionButtonText}>Refresh Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleRestorePurchases}
                  disabled={restoring}
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color="#38a169" />
                  ) : (
                    <RefreshCw size={20} color="#38a169" />
                  )}
                  <Text style={styles.actionButtonText}>Restore Purchases</Text>
                </TouchableOpacity>

                {(isSubscribed || isTrialActive) && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <ActivityIndicator size="small" color="#e53e3e" />
                    ) : (
                      <XCircle size={20} color="#e53e3e" />
                    )}
                    <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>
                  For billing questions or to manage your subscription through the App Store,
                  please visit your Apple ID account settings.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
  },
  trialInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  trialInfoText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
  },
  actionsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
  },
  helpCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});
