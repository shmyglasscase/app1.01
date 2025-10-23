/*
  # Add Unread Count Triggers and Functions

  1. Database Functions
    - `update_unread_counts()` - Trigger function to automatically update unread counts
    - `get_user_total_unread_count(user_id)` - Function to get total unread count for a user
  
  2. Triggers
    - Trigger on messages table to update unread counts on insert
    - Trigger on messages table to update unread counts when is_read changes
  
  3. Purpose
    - Automatically maintain accurate unread counts in conversations
    - Enable efficient querying of total unread count across all conversations
    - Support real-time badge updates on Messages tab
*/

-- Create function to update unread counts when messages are inserted or marked as read
CREATE OR REPLACE FUNCTION update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT: increment unread count for the recipient
  IF (TG_OP = 'INSERT') THEN
    UPDATE conversations
    SET 
      unread_count_user1 = CASE 
        WHEN NEW.sender_id = user2_id THEN unread_count_user1 + 1 
        ELSE unread_count_user1 
      END,
      unread_count_user2 = CASE 
        WHEN NEW.sender_id = user1_id THEN unread_count_user2 + 1 
        ELSE unread_count_user2 
      END,
      last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
  END IF;

  -- For UPDATE: decrement unread count when message is marked as read
  IF (TG_OP = 'UPDATE' AND OLD.is_read = false AND NEW.is_read = true) THEN
    UPDATE conversations
    SET 
      unread_count_user1 = CASE 
        WHEN NEW.sender_id = user2_id AND unread_count_user1 > 0 THEN unread_count_user1 - 1 
        ELSE unread_count_user1 
      END,
      unread_count_user2 = CASE 
        WHEN NEW.sender_id = user1_id AND unread_count_user2 > 0 THEN unread_count_user2 - 1 
        ELSE unread_count_user2 
      END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop triggers if they exist and create new ones
DROP TRIGGER IF EXISTS trigger_update_unread_on_insert ON messages;
CREATE TRIGGER trigger_update_unread_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_counts();

DROP TRIGGER IF EXISTS trigger_update_unread_on_read ON messages;
CREATE TRIGGER trigger_update_unread_on_read
  AFTER UPDATE OF is_read ON messages
  FOR EACH ROW
  WHEN (OLD.is_read = false AND NEW.is_read = true)
  EXECUTE FUNCTION update_unread_counts();

-- Function to get total unread count for a user across all conversations
CREATE OR REPLACE FUNCTION get_user_total_unread_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  total_count integer;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN user1_id = p_user_id THEN unread_count_user1
        WHEN user2_id = p_user_id THEN unread_count_user2
        ELSE 0
      END
    ), 0)
  INTO total_count
  FROM conversations
  WHERE user1_id = p_user_id OR user2_id = p_user_id;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize unread counts for any existing conversations
UPDATE conversations c
SET 
  unread_count_user1 = (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id 
      AND m.sender_id = c.user2_id 
      AND m.is_read = false
      AND m.is_deleted = false
  ),
  unread_count_user2 = (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id 
      AND m.sender_id = c.user1_id 
      AND m.is_read = false
      AND m.is_deleted = false
  );