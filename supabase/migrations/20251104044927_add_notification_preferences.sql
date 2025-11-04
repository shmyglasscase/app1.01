/*
  # Add Notification Preferences and Push Tokens

  1. Changes
    - Add push_token column to profiles table for storing device push notification tokens
    - Add notification preference columns for different notification types
    - Set default values for all notification preferences

  2. Columns Added
    - `push_token` (text, nullable) - Stores the Expo push notification token
    - `messages_notifications` (boolean, default true) - Enable/disable message notifications
    - `offers_notifications` (boolean, default true) - Enable/disable trade offer notifications
    - `marketplace_notifications` (boolean, default true) - Enable/disable marketplace activity notifications
    - `email_notifications` (boolean, default false) - Enable/disable email digest notifications

  3. Notes
    - Existing users will have notification preferences enabled by default (except email)
    - Push token is nullable as it may not be available on web or if permissions are denied
*/

-- Add push token column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_token text;
  END IF;
END $$;

-- Add notification preference columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'messages_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN messages_notifications boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'offers_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN offers_notifications boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketplace_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketplace_notifications boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_notifications boolean DEFAULT false;
  END IF;
END $$;

-- Create index on push_token for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;
