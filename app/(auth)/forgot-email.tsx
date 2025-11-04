import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ForgotEmailScreen() {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const router = useRouter();

  const handleSearchEmail = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .ilike('full_name', `%${fullName.trim()}%`)
        .maybeSingle();

      if (error) throw error;

      if (data && data.email) {
        const email = data.email;
        const maskedEmail = maskEmail(email);
        setFoundEmail(maskedEmail);
      } else {
        Alert.alert(
          'Not Found',
          'No account found with that name. Please try again or contact support for assistance.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', 'Unable to search for account. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    const visibleStart = localPart.slice(0, 2);
    const visibleEnd = localPart.slice(-1);
    return `${visibleStart}***${visibleEnd}@${domain}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <ArrowLeft size={24} color="#2d3748" />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Email?</Text>
        <Text style={styles.subtitle}>
          {foundEmail
            ? 'We found your account'
            : 'Enter your full name to find your account'
          }
        </Text>

        {!foundEmail ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSearchEmail}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Searching...' : 'Find My Email'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Can't remember your name?</Text>
              <Text style={styles.infoText}>
                If you're unable to find your account using your name, please contact our support team for assistance.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>Account Found!</Text>
              <Text style={styles.emailText}>{foundEmail}</Text>
              <Text style={styles.instructionText}>
                Your email address is shown above (partially masked for security).
              </Text>
              <Text style={styles.instructionText}>
                Use this email to sign in to your account.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Go to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setFoundEmail(null)}>
              <Text style={styles.linkText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  button: {
    height: 56,
    backgroundColor: '#38a169',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#38a169',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  successText: {
    fontSize: 20,
    color: '#166534',
    fontWeight: '700',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    color: '#15803d',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  instructionText: {
    fontSize: 14,
    color: '#15803d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
