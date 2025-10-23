import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from '@/types/database';
import { ConversationDetailScreen } from '@/components/ConversationDetailScreen';
import { SwipeableConversation } from '@/components/SwipeableConversation';
import { useLocalSearchParams } from 'expo-router';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationId, conversations]);

  const loadConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:user1_id(id, full_name, email),
        user2:user2_id(id, full_name, email),
        listing:listing_id(id, title, photo_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      setConversations(data);
    }
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.user1_id === user?.id ? item.user2 : item.user1;
    const unreadCount = item.user1_id === user?.id ? item.unread_count_user1 : item.unread_count_user2;
    const hasUnread = unreadCount > 0;

    return (
      <SwipeableConversation
        conversation={item}
        otherUser={otherUser}
        unreadCount={unreadCount}
        hasUnread={hasUnread}
        formatTime={formatTime}
        onPress={() => setSelectedConversation(item)}
        onDelete={() => loadConversations()}
      />
    );
  };

  if (selectedConversation) {
    return (
      <ConversationDetailScreen
        conversation={selectedConversation}
        onBack={() => {
          setSelectedConversation(null);
          loadConversations();
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageSquare size={64} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a conversation by contacting a seller
            </Text>
          </View>
        }
      />
    </GestureHandlerRootView>
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
    paddingBottom: 16,
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
  list: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
  },
});
