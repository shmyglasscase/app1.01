/*
  # Enable Realtime on Pending Match Jobs Table
  
  1. Purpose
    - Enable Realtime broadcasting on pending_match_jobs table for instant processing
    - This ensures that when new jobs are created, the processor is immediately notified
    - Also enables realtime on wishlist_matches for instant match notifications
  
  2. Changes
    - Enable Realtime replication for pending_match_jobs table
    - Enable Realtime replication for wishlist_matches table
    - Enable Realtime replication for user_notifications table
  
  3. Important Notes
    - This is critical for the background job processor to work properly
    - Without this, the processor relies only on the 30-second polling interval
    - Realtime updates ensure jobs are processed within seconds of creation
*/

-- Enable Realtime for pending_match_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE pending_match_jobs;

-- Enable Realtime for wishlist_matches table
ALTER PUBLICATION supabase_realtime ADD TABLE wishlist_matches;

-- Enable Realtime for user_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;

-- Enable Realtime for conversations table (if not already enabled)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable Realtime for messages table (if not already enabled)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
