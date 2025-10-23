/*
  # Add Message Editing and Deletion Support

  1. Changes to messages table
    - Add `edited_at` (timestamptz) - timestamp when message was last edited
    - Add `is_deleted` (boolean) - soft delete flag
    - Add `deleted_at` (timestamptz) - timestamp when message was deleted
    - Add `original_text` (text) - stores original text for edit history
  
  2. Purpose
    - Enable users to edit their sent messages
    - Allow users to delete messages (soft delete)
    - Track message modification history
    - Maintain data integrity while providing edit/delete functionality
*/

-- Add columns for message editing and deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN edited_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'original_text'
  ) THEN
    ALTER TABLE messages ADD COLUMN original_text text;
  END IF;
END $$;