import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38a169',
    });
  }

  if (Platform.OS === 'web') {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  return token;
}

export async function savePushTokenToDatabase(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    messages_notifications?: boolean;
    offers_notifications?: boolean;
    marketplace_notifications?: boolean;
    email_notifications?: boolean;
  }
) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error };
  }
}

export async function getNotificationPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('messages_notifications, offers_notifications, marketplace_notifications, email_notifications')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;

    if (data?.type === 'message' && data?.conversationId) {
      console.log('Navigate to conversation:', data.conversationId);
    } else if (data?.type === 'wishlist_match' && data?.itemId) {
      console.log('Navigate to wishlist match:', data.itemId);
    } else if (data?.type === 'marketplace' && data?.listingId) {
      console.log('Navigate to marketplace listing:', data.listingId);
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

export function removeNotificationListeners(listeners: {
  notificationListener: Notifications.Subscription;
  responseListener: Notifications.Subscription;
}) {
  listeners.notificationListener.remove();
  listeners.responseListener.remove();
}

export async function schedulePushNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}
