import Ably from 'ably';
import { AppState, AppStateStatus } from 'react-native';

let ablyClient: Ably.Realtime | null = null;
let appStateSubscription: any = null;

export const getAblyClient = (): Ably.Realtime => {
  if (!ablyClient) {
    const apiKey = process.env.EXPO_PUBLIC_ABLY_API_KEY;
    if (!apiKey) {
      throw new Error('Ably API key not found');
    }

    ablyClient = new Ably.Realtime({ 
      key: apiKey,
      // Retry connection settings
      disconnectedRetryTimeout: 15000, // 15 seconds
      suspendedRetryTimeout: 30000, // 30 seconds
      // Automatically recover connection and channel state
      recover: (lastConnectionDetails, cb) => {
        cb(true); // Always try to recover
      },
      // Keep connection alive
      closeOnUnload: false,
    });

    // Connection state monitoring
    ablyClient.connection.on('connected', () => {
      console.log('✅ Ably connected');
    });

    ablyClient.connection.on('connecting', () => {
      console.log('🔄 Ably connecting...');
    });

    ablyClient.connection.on('disconnected', () => {
      console.log('⚠️ Ably disconnected - will auto-retry');
    });

    ablyClient.connection.on('suspended', () => {
      console.log('⏸️ Ably suspended - will auto-retry');
    });

    ablyClient.connection.on('failed', (stateChange) => {
      console.error('❌ Ably connection failed:', stateChange.reason);
    });

    ablyClient.connection.on('closed', () => {
      console.log('🔒 Ably connection closed');
    });

    // Handle app state changes for mobile
    setupAppStateListener();
  }
  
  return ablyClient;
};

const setupAppStateListener = () => {
  // Clean up existing listener if any
  if (appStateSubscription) {
    appStateSubscription.remove();
  }

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
};

const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (!ablyClient) return;

  if (nextAppState === 'active') {
    // App came to foreground
    const state = ablyClient.connection.state;
    console.log(`📱 App active - Ably state: ${state}`);
    
    // Force reconnect if suspended or failed
    if (state === 'suspended' || state === 'failed' || state === 'closed') {
      console.log('🔌 Attempting to reconnect Ably...');
      ablyClient.connect();
    }
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    // App went to background - Ably will handle this automatically
    console.log('📱 App backgrounded - Ably will manage connection');
  }
};

export const getConversationChannel = (conversationId: string) => {
  const client = getAblyClient();
  return client.channels.get(`conversation:${conversationId}`);
};

export const getTypingChannel = (conversationId: string) => {
  const client = getAblyClient();
  return client.channels.get(`typing:${conversationId}`);
};

// Get current connection state
export const getConnectionState = (): string => {
  return ablyClient?.connection.state || 'not_initialized';
};

// Check if connected
export const isConnected = (): boolean => {
  return ablyClient?.connection.state === 'connected';
};

// Manually reconnect if needed
export const reconnect = () => {
  if (ablyClient) {
    console.log('🔄 Manual reconnect triggered');
    ablyClient.connect();
  }
};

// Clean up connection (call when user logs out)
export const closeAblyConnection = () => {
  if (ablyClient) {
    console.log('🔒 Closing Ably connection');
    
    // Remove app state listener
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
    
    // Close all channels
    Object.values(ablyClient.channels.all).forEach(channel => {
      channel.detach();
    });
    
    // Close connection
    ablyClient.close();
    ablyClient = null;
  }
};

// Subscribe to connection state changes
export const onConnectionStateChange = (
  callback: (stateChange: Ably.ConnectionStateChange) => void
) => {
  const client = getAblyClient();
  client.connection.on(callback);
  
  // Return cleanup function
  return () => {
    client.connection.off(callback);
  };
};

// Type definitions
export interface AblyMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  original_text?: string;
}

export interface TypingEvent {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessageReadEvent {
  messageId: string; 
  userId: string;
  readAt: string;
}

export interface MessageEditEvent {
  messageId: string;
  newText: string;
  editedAt: string;
}

export interface MessageDeleteEvent {
  messageId: string;
  deletedAt: string;
}

export interface ConversationDeleteEvent {
  conversationId: string;
  deletedAt: string;
}