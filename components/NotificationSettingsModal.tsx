import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Bell, MessageSquare, Package } from 'lucide-react-native';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({ visible, onClose }: NotificationSettingsModalProps) {
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [marketplaceNotifications, setMarketplaceNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

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
        onValueChange={onValueChange}
        trackColor={{ false: '#cbd5e0', true: '#68d391' }}
        thumbColor={value ? '#38a169' : '#f7fafc'}
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
});
