import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Check, Sparkles } from 'lucide-react-native';
import { purchaseSubscription, SUBSCRIPTION_PRODUCT_IDS } from '@/lib/subscriptions';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

const FEATURES = [
  'Unlimited items in your collection',
  'Advanced market analysis with eBay pricing',
  'Priority listing in marketplace',
  'Wishlist matching notifications',
  'Export your collection data',
  'Ad-free experience',
  'Premium support',
];

export function SubscriptionPaywallModal({
  visible,
  onClose,
  onSubscribed,
}: SubscriptionPaywallModalProps) {
  const { initializeTrial, refreshSubscription, isTrialActive } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const success = await initializeTrial();
      if (success) {
        Alert.alert(
          'Trial Started!',
          'You now have 3 days of free access to all premium features.',
          [{ text: 'Get Started', onPress: () => { onSubscribed?.(); onClose(); } }]
        );
      } else {
        Alert.alert('Error', 'Failed to start trial. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setStartingTrial(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const success = await purchaseSubscription(SUBSCRIPTION_PRODUCT_IDS.PREMIUM_MONTHLY);
      if (success) {
        await refreshSubscription();
        Alert.alert(
          'Subscription Active!',
          'Thank you for subscribing to MyGlassCase Premium.',
          [{ text: 'Continue', onPress: () => { onSubscribed?.(); onClose(); } }]
        );
      } else {
        Alert.alert('Purchase Cancelled', 'The purchase was not completed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>MyGlassCase Premium</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Sparkles size={48} color="#38a169" />
            </View>
            <Text style={styles.heroTitle}>Unlock Premium Features</Text>
            <Text style={styles.heroSubtitle}>
              Get full access to all features and take your collecting to the next level
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Included</Text>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.checkIcon}>
                  <Check size={18} color="#38a169" strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingContainer}>
            <View style={styles.priceBox}>
              <Text style={styles.priceAmount}>$9.99</Text>
              <Text style={styles.priceInterval}>/month</Text>
            </View>
            <Text style={styles.trialText}>
              {isTrialActive ? 'Currently on free trial' : 'Includes 3-day free trial'}
            </Text>
          </View>

          {!isTrialActive && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.trialButton}
                onPress={handleStartTrial}
                disabled={startingTrial}
              >
                {startingTrial ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Sparkles size={20} color="#fff" />
                    <Text style={styles.trialButtonText}>Start Free Trial</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.orText}>or</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.subscribeButton, isTrialActive && styles.subscribeButtonFull]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#38a169" />
            ) : (
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            )}
          </TouchableOpacity>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              {isTrialActive
                ? 'Your trial will automatically convert to a paid subscription unless cancelled before it ends.'
                : 'Trial starts immediately. Cancel anytime in the first 3 days to avoid charges. Subscription auto-renews monthly until cancelled.'}
            </Text>
          </View>
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
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
  },
  pricingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    marginBottom: 24,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#38a169',
  },
  priceInterval: {
    fontSize: 18,
    color: '#718096',
    marginLeft: 4,
  },
  trialText: {
    fontSize: 14,
    color: '#718096',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trialButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38a169',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  trialButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  orText: {
    fontSize: 14,
    color: '#a0aec0',
    marginBottom: 16,
  },
  subscribeButton: {
    marginHorizontal: 20,
    backgroundColor: '#f7fafc',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38a169',
  },
  subscribeButtonFull: {
    backgroundColor: '#38a169',
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#38a169',
  },
  disclaimer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 18,
  },
});
