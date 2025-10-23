import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Sun, Moon, Smartphone, Check } from 'lucide-react-native';

interface ThemeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ThemeSettingsModal({ visible, onClose }: ThemeSettingsModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light');

  const ThemeOption = ({
    icon,
    title,
    description,
    value,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value: 'light' | 'dark' | 'system';
  }) => {
    const isSelected = selectedTheme === value;

    return (
      <TouchableOpacity
        style={[styles.themeOption, isSelected && styles.themeOptionSelected]}
        onPress={() => setSelectedTheme(value)}
      >
        <View style={styles.themeIconContainer}>{icon}</View>
        <View style={styles.themeContent}>
          <Text style={styles.themeTitle}>{title}</Text>
          <Text style={styles.themeDescription}>{description}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Check size={20} color="#38a169" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Theme</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionDescription}>
              Choose how MyGlassCase looks to you. Select a single theme, or sync with your system
              settings.
            </Text>

            <View style={styles.themesList}>
              <ThemeOption
                icon={<Sun size={24} color="#38a169" />}
                title="Light"
                description="Classic bright appearance"
                value="light"
              />
              <ThemeOption
                icon={<Moon size={24} color="#38a169" />}
                title="Dark"
                description="Easy on the eyes in low light"
                value="dark"
              />
              <ThemeOption
                icon={<Smartphone size={24} color="#38a169" />}
                title="System"
                description="Automatically match your device"
                value="system"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Dark mode is coming soon! We're working hard to bring you a beautiful dark theme
                experience.
              </Text>
            </View>
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
    padding: 24,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 24,
    marginBottom: 24,
  },
  themesList: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  themeOptionSelected: {
    borderColor: '#38a169',
    backgroundColor: '#f0fff4',
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  themeContent: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: '#718096',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    textAlign: 'center',
  },
});
