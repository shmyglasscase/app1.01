import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, Bell, MessageSquare, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  updateNotificationPreferences,
  getNotificationPreferences,
  registerForPushNotificationsAsync,
  savePushTokenToDatabase
} from '@/lib/notifications';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ visible, onClose }: NotificationSettingsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [marketplaceNotifications, setMarketplaceNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadPreferences();
    }
  }, [visible, user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const prefs = await getNotificationPreferences(user.id);
      if (prefs) {
        setMessageNotifications(prefs.messages_notifications ?? true);
        setOfferNotifications(prefs.offers_notifications ?? true);
        setMarketplaceNotifications(prefs.marketplace_notifications ?? true);
        setEmailNotifications(prefs.email_notifications ?? false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const result = await updateNotificationPreferences(user.id, {
        messages_notifications: messageNotifications,
        offers_notifications: offerNotifications,
        marketplace_notifications: marketplaceNotifications,
        email_notifications: emailNotifications,
      });

      if (result.success) {
        if (Platform.OS !== 'web') {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await savePushTokenToDatabase(user.id, token);
            setHasPermission(true);
          }
        }

        if (Platform.OS === 'web') {
          alert('Settings saved successfully!');
        } else {
          Alert.alert('Success', 'Notification settings saved successfully!');
        }
        onClose();
      } else {
        if (Platform.OS === 'web') {
          alert('Failed to save settings. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to save settings. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      if (Platform.OS === 'web') {
        alert('An error occurred while saving settings.');
      } else {
        Alert.alert('Error', 'An error occurred while saving settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (
    currentValue: boolean,
    setter: (value: boolean) => void
  ) => {
    const newValue = !currentValue;
    setter(newValue);

    if (newValue && Platform.OS !== 'web' && !hasPermission) {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        if (Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos') {
          alert('Please enable notifications in your device settings.');
        } else {
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in your device settings to receive push notifications.'
          );
        }
        setter(false);
      } else {
        setHasPermission(true);
        if (user) {
          await savePushTokenToDatabase(user.id, token);
        }
      }
    }
  };

  const NotificationItem = ({
    icon,
    title,
    description,
    value,
    onValueChange,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => handleToggle(value, onValueChange)}
        trackColor={{ false: '#cbd5e0', true: '#68d391' }}
        thumbColor={value ? '#38a169' : '#f7fafc'}
        disabled={loading || saving}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38a169" />
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Push Notifications</Text>
                <View style={styles.notificationsList}>
                  <NotificationItem
                    icon={<MessageSquare size={20} color="#38a169" />}
                    title="Messages"
                    description="Get notified when you receive new messages"
                    value={messageNotifications}
                    onValueChange={setMessageNotifications}
                  />
                  <NotificationItem
                    icon={<Package size={20} color="#38a169" />}
                    title="Offers"
                    description="Notifications about trade offers you receive"
                    value={offerNotifications}
                    onValueChange={setOfferNotifications}
                  />
                  <NotificationItem
                    icon={<Bell size={20} color="#38a169" />}
                    title="Marketplace Activity"
                    description="Updates on items you're interested in"
                    value={marketplaceNotifications}
                    onValueChange={setMarketplaceNotifications}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Email Notifications</Text>
                <View style={styles.notificationsList}>
                  <NotificationItem
                    icon={<Bell size={20} color="#38a169" />}
                    title="Email Digest"
                    description="Receive weekly summaries via email"
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  You can always change these settings later. Push notifications require device
                  permissions.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 60,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  notificationsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#38a169',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
