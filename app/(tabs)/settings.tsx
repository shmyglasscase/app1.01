import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { User, Bell, Palette, HelpCircle, Shield, LogOut, ChevronRight, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal';
import { ThemeSettingsModal } from '@/components/ThemeSettingsModal';
import { HelpCenterModal } from '@/components/HelpCenterModal';
import { LegalDocumentModal } from '@/components/LegalDocumentModal';
import { TERMS_AND_CONDITIONS } from '@/constants/terms';
import { PRIVACY_POLICY } from '@/constants/privacy';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#a0aec0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileStatus}>Active Member</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsList}>
          <SettingItem
            icon={<User size={20} color="#38a169" />}
            title="Profile"
            subtitle="Edit your personal information"
            onPress={() => setProfileModalVisible(true)}
          />
          <SettingItem
            icon={<Bell size={20} color="#38a169" />}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => setNotificationsModalVisible(true)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsList}>
          <SettingItem
            icon={<Palette size={20} color="#38a169" />}
            title="Theme"
            subtitle="Light mode"
            onPress={() => setThemeModalVisible(true)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <View style={styles.settingsList}>
          <SettingItem
            icon={<HelpCircle size={20} color="#38a169" />}
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => setHelpModalVisible(true)}
          />
          <SettingItem
            icon={<FileText size={20} color="#38a169" />}
            title="Terms & Conditions"
            subtitle="View our terms and conditions"
            onPress={() => setTermsModalVisible(true)}
          />
          <SettingItem
            icon={<Shield size={20} color="#38a169" />}
            title="Privacy Policy"
            subtitle="View our privacy policy"
            onPress={() => setPrivacyModalVisible(true)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#e53e3e" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MyGlassCase v1.0.0</Text>
      </View>

      <ProfileSettingsModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
      <NotificationSettingsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
      <ThemeSettingsModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
      <HelpCenterModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
      <LegalDocumentModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        title="Terms & Conditions"
        content={TERMS_AND_CONDITIONS}
      />
      <LegalDocumentModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38a169',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    color: '#718096',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  settingsList: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#a0aec0',
  },
});
