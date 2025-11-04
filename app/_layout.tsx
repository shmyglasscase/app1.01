import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { setupNotificationListeners, removeNotificationListeners } from '@/lib/notifications';
import type { Subscription } from 'expo-notifications';

export default function RootLayout() {
  useFrameworkReady();
  const notificationListenersRef = useRef<{
    notificationListener: Subscription;
    responseListener: Subscription;
  } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('useNativeDriver')
        ) {
          return;
        }
        originalWarn(...args);
      };
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      notificationListenersRef.current = setupNotificationListeners();
    }

    return () => {
      if (notificationListenersRef.current) {
        removeNotificationListeners(notificationListenersRef.current);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
