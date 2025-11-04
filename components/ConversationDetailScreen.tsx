import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { ArrowLeft, Send, Package, Pencil, Trash2, MoreVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, Message, MarketplaceListing } from '@/types/database';
import {
  getConversationChannel,
  getTypingChannel,
  AblyMessage,
  TypingEvent,
  MessageReadEvent,
  MessageEditEvent,
  MessageDeleteEvent,
} from '@/lib/ably';
import type { Types } from 'ably';
import { MarketplaceItemDetailsModal } from '@/components/MarketplaceItemDetailsModal';

interface ConversationDetailScreenProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ConversationDetailScreen({ conversation, onBack }: ConversationDetailScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationChannelRef = useRef<Types.RealtimeChannelCallbacks | null>(null);
  const typingChannelRef = useRef<Types.RealtimeChannelCallbacks | null>(null);

  const otherUser = conversation.user1_id === user?.id ? conversation.user2 : conversation.user1;

  const getDisplayName = () => {
    return conversation.listing?.users_name || otherUser?.full_name || otherUser?.email || 'Unknown User';
  };

  useEffect(() => {
    loadMessages();
    setupAblyChannels();

    return () => {
      cleanupAblyChannels();
    };
  }, [conversation.id, user?.id]);

  const setupAblyChannels = () => {
    const conversationChannel = getConversationChannel(conversation.id);
    const typingChannel = getTypingChannel(conversation.id);

    conversationChannel.subscribe('new-message', (message: Types.Message) => {
      const newMessage = message.data as AblyMessage;
      setMessages((prev) => [newMessage as Message, ...prev]);

      if (newMessage.sender_id !== user?.id) {
        markMessageAsRead(newMessage.id);
      }
    });

    conversationChannel.subscribe('message-read', (message: Types.Message) => {
      const readEvent = message.data as MessageReadEvent;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === readEvent.messageId
            ? { ...msg, is_read: true, read_at: readEvent.readAt }
            : msg
        )
      );
    });

    conversationChannel.subscribe('message-edited', (message: Types.Message) => {
      const editEvent = message.data as MessageEditEvent;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editEvent.messageId
            ? { ...msg, message_text: editEvent.newText, edited_at: editEvent.editedAt }
            : msg
        )
      );
    });

    conversationChannel.subscribe('message-deleted', (message: Types.Message) => {
      const deleteEvent = message.data as MessageDeleteEvent;
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== deleteEvent.messageId)
      );
    });

    typingChannel.subscribe('typing', (message: Types.Message) => {
      const typingEvent = message.data as TypingEvent;
      if (typingEvent.userId !== user?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (typingEvent.isTyping) {
            newSet.add(typingEvent.userName);
          } else {
            newSet.delete(typingEvent.userName);
          }
          return newSet;
        });
      }
    });

    conversationChannelRef.current = conversationChannel;
    typingChannelRef.current = typingChannel;
  };

  const cleanupAblyChannels = () => {
    if (conversationChannelRef.current) {
      conversationChannelRef.current.unsubscribe();
    }
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe();
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, full_name, email)
      `)
      .eq('conversation_id', conversation.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (data) {
      setMessages(data);

      const unreadMessages = data.filter(
        (msg) => msg.sender_id !== user?.id && !msg.is_read
      );

      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    const readAt = new Date().toISOString();
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: readAt })
      .eq('id', messageId);

    const conversationChannel = getConversationChannel(conversation.id);
    conversationChannel.publish('message-read', {
      messageId,
      userId: user?.id,
      readAt,
    } as MessageReadEvent);
  };

  const handleTyping = () => {
    const typingChannel = getTypingChannel(conversation.id);
    typingChannel.publish('typing', {
      userId: user?.id,
      userName: user?.user_metadata?.full_name || user?.email || 'User',
      isTyping: true,
    } as TypingEvent);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingChannel.publish('typing', {
        userId: user?.id,
        userName: user?.user_metadata?.full_name || user?.email || 'User',
        isTyping: false,
      } as TypingEvent);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !user) return;

    if (editingMessageId) {
      await editMessage(editingMessageId, messageText.trim());
      return;
    }

    setLoading(true);
    const messageToSend = messageText.trim();

    try {
      // Only include client-provided fields. Server should set defaults/timestamps and managed flags.
      const newMessage: Partial<Message> = {
        conversation_id: conversation.id,
        sender_id: user.id,
        message_text: messageToSend,
        is_read: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setLoading(false);
        return;
      }

      if (data) {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id);

        try {
          const conversationChannel = getConversationChannel(conversation.id);
          await conversationChannel.publish('new-message', data as AblyMessage);
        } catch (ablyError) {
          console.error('Ably publish error:', ablyError);
        }

        setMessageText('');
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (err) {
      console.error('Unexpected error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    const editedAt = new Date().toISOString();
    await supabase
      .from('messages')
      .update({ message_text: newText, edited_at: editedAt })
      .eq('id', messageId);

    const conversationChannel = getConversationChannel(conversation.id);
    conversationChannel.publish('message-edited', {
      messageId,
      newText,
      editedAt,
    } as MessageEditEvent);

    setEditingMessageId(null);
    setMessageText('');
    setSelectedMessageId(null);
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const deletedAt = new Date().toISOString();
          await supabase
            .from('messages')
            .update({ is_deleted: true, deleted_at: deletedAt })
            .eq('id', messageId);

          const conversationChannel = getConversationChannel(conversation.id);
          conversationChannel.publish('message-deleted', {
            messageId,
            deletedAt,
          } as MessageDeleteEvent);

          setSelectedMessageId(null);
        },
      },
    ]);
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setMessageText(message.message_text);
    setSelectedMessageId(null);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setMessageText('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <TouchableOpacity
        onLongPress={() => isOwnMessage && setSelectedMessageId(item.id)}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message_text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.created_at)}
              {item.edited_at && ' (edited)'}
            </Text>
            {isOwnMessage && (
              <Text style={styles.readReceipt}>
                {item.is_read ? 'Read' : 'Sent'}
              </Text>
            )}
          </View>
        </View>

        {selectedMessageId === item.id && (
          <Modal
            transparent
            visible={selectedMessageId === item.id}
            animationType="fade"
            onRequestClose={() => setSelectedMessageId(null)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setSelectedMessageId(null)}
            >
              <View style={styles.messageMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => startEditing(item)}
                >
                  <Pencil size={20} color="#2d3748" />
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => deleteMessage(item.id)}
                >
                  <Trash2 size={20} color="#e53e3e" />
                  <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#2d3748" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {getDisplayName()}
          </Text>
          {conversation.listing && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Re: {conversation.listing.title}
            </Text>
          )}
        </View>
      </View>

      {conversation.listing && (
        <TouchableOpacity
          style={styles.listingCard}
          onPress={() => setShowItemDetails(true)}
          activeOpacity={0.7}
        >
          <View style={styles.listingImageContainer}>
            {conversation.listing.photo_url ? (
              <Image
                source={{ uri: conversation.listing.photo_url }}
                style={styles.listingImage}
              />
            ) : (
              <View style={styles.listingImagePlaceholder}>
                <Package size={24} color="#cbd5e0" />
              </View>
            )}
          </View>
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {conversation.listing.title}
            </Text>
            {conversation.listing.asking_price && (
              <Text style={styles.listingPrice}>
                ${conversation.listing.asking_price.toFixed(2)}
              </Text>
            )}
            {conversation.listing.condition && (
              <Text style={styles.listingCondition}>{conversation.listing.condition}</Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      {typingUsers.size > 0 && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </Text>
        </View>
      )}

      {editingMessageId && (
        <View style={styles.editingBar}>
          <Pencil size={16} color="#718096" />
          <Text style={styles.editingText}>Editing message</Text>
          <TouchableOpacity onPress={cancelEditing}>
            <Text style={styles.cancelEdit}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          placeholderTextColor="#a0aec0"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading || !messageText.trim()}
        >
          <Send size={20} color={messageText.trim() ? '#fff' : '#cbd5e0'} />
        </TouchableOpacity>
      </View>

      <MarketplaceItemDetailsModal
        item={conversation.listing || null}
        visible={showItemDetails}
        onClose={() => setShowItemDetails(false)}
      />
    </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#38a169',
    marginTop: 2,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listingImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38a169',
    marginBottom: 2,
  },
  listingCondition: {
    fontSize: 12,
    color: '#718096',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#38a169',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#2d3748',
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#a0aec0',
  },
  readReceipt: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f7fafc',
  },
  typingText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  editingText: {
    flex: 1,
    fontSize: 14,
    color: '#718096',
  },
  cancelEdit: {
    fontSize: 14,
    color: '#38a169',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2d3748',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#38a169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f7fafc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2d3748',
  },
  deleteText: {
    color: '#e53e3e',
  },
});
