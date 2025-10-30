import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { Conversation } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface SwipeableConversationProps {
  conversation: Conversation;
  otherUser: any;
  currentUserId: string;
  unreadCount: number;
  hasUnread: boolean;
  formatTime: (timestamp?: string) => string;
  onPress: () => void;
  onDelete: () => void;
}

export function SwipeableConversation({
  conversation,
  otherUser,
  currentUserId,
  unreadCount,
  hasUnread,
  formatTime,
  onPress,
  onDelete,
}: SwipeableConversationProps) {
  const getDisplayName = () => {
    return conversation.listing?.users_name || otherUser?.full_name || otherUser?.email || 'Unknown User';
  };

  const getDisplayInitial = () => {
    const name = getDisplayName();
    return name.charAt(0)?.toUpperCase() || '?';
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message_preview) {
      return 'Start a conversation';
    }

    const isCurrentUser = conversation.last_message_sender_id === currentUserId;
    const prefix = isCurrentUser ? 'You: ' : '';

    return prefix + conversation.last_message_preview;
  };
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
          <Trash2 size={24} color="#fff" />
        </Animated.View>
      </View>
    );
  };

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      Alert.alert(
        'Delete Conversation',
        'Are you sure you want to delete this conversation? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteConversation();
            },
          },
        ]
      );
    }
  };

  const deleteConversation = async () => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id);

    if (error) {
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    } else {
      onDelete();
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation();
          },
        },
      ]
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
            <Text style={styles.avatarText}>
              {getDisplayInitial()}
            </Text>
          </View>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.conversationNameUnread]}>
              {getDisplayName()}
            </Text>
            <View style={styles.timeAndBadgeContainer}>
              <Text style={[styles.conversationTime, hasUnread && styles.conversationTimeUnread]}>
                {formatTime(conversation.last_message_at)}
              </Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {conversation.listing && (
            <Text style={[styles.itemName, hasUnread && styles.itemNameUnread]} numberOfLines={1}>
              Re: {conversation.listing.title}
            </Text>
          )}
          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={2}>
            {getLastMessagePreview()}
          </Text>
        </View>
        {conversation.listing?.photo_url && (
          <Image
            source={{ uri: conversation.listing.photo_url }}
            style={styles.itemThumbnail}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  deleteAction: {
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationCardUnread: {
    backgroundColor: '#f0f9f4',
    borderLeftWidth: 4,
    borderLeftColor: '#38a169',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#38a169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: '#2f855a',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  conversationNameUnread: {
    fontWeight: '700',
    color: '#1a202c',
  },
  timeAndBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: '#a0aec0',
  },
  conversationTimeUnread: {
    color: '#38a169',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#38a169',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 14,
    color: '#38a169',
    marginBottom: 4,
  },
  itemNameUnread: {
    fontWeight: '600',
    color: '#2f855a',
  },
  lastMessage: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#4a5568',
  },
  itemThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
  },
});
