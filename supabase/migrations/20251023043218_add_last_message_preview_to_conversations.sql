/*
  # Add Last Message Preview to Conversations

  1. Changes
    - Add `last_message_preview` column to `conversations` table to store the text of the last message
    - Add `last_message_sender_id` column to `conversations` table to identify who sent the last message
    
  2. Purpose
    - Display actual last message content in the conversations list
    - Show who sent the last message (You vs. other user's name)
    - Improve user experience by showing real message previews instead of hardcoded text
    
  3. Implementation
    - Add new columns with default values
    - Create function to update last message fields
    - Create triggers to automatically update these fields when messages are inserted, updated, or deleted
    - Backfill existing conversations with their actual last messages
*/

-- Add new columns to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_preview text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_sender_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_sender_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for last_message_sender_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_last_message_sender_id_fkey'
  ) THEN
    ALTER TABLE conversations 
      ADD CONSTRAINT conversations_last_message_sender_id_fkey 
      FOREIGN KEY (last_message_sender_id) 
      REFERENCES profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Function to update last message fields in conversations table
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
DECLARE
  v_last_message RECORD;
BEGIN
  -- Get the most recent non-deleted message for this conversation
  SELECT message_text, sender_id, created_at
  INTO v_last_message
  FROM messages
  WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id)
    AND is_deleted = false
  ORDER BY created_at DESC
  LIMIT 1;

  -- Update the conversation with last message info
  IF FOUND THEN
    UPDATE conversations
    SET 
      last_message_preview = v_last_message.message_text,
      last_message_sender_id = v_last_message.sender_id,
      last_message_at = v_last_message.created_at
    WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  ELSE
    -- No messages left, clear the preview
    UPDATE conversations
    SET 
      last_message_preview = '',
      last_message_sender_id = NULL,
      last_message_at = now()
    WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for INSERT, UPDATE, and DELETE on messages
DROP TRIGGER IF EXISTS update_conversation_last_message_on_insert ON messages;
CREATE TRIGGER update_conversation_last_message_on_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

DROP TRIGGER IF EXISTS update_conversation_last_message_on_update ON messages;
CREATE TRIGGER update_conversation_last_message_on_update
  AFTER UPDATE ON messages
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted OR OLD.message_text IS DISTINCT FROM NEW.message_text)
  EXECUTE FUNCTION update_conversation_last_message();

DROP TRIGGER IF EXISTS update_conversation_last_message_on_delete ON messages;
CREATE TRIGGER update_conversation_last_message_on_delete
  AFTER DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Backfill existing conversations with their last messages
UPDATE conversations c
SET 
  last_message_preview = COALESCE(m.message_text, ''),
  last_message_sender_id = m.sender_id
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    message_text,
    sender_id
  FROM messages
  WHERE is_deleted = false
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id;