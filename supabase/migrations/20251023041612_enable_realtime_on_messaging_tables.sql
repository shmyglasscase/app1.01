/*
  # Enable Realtime on Messaging Tables

  1. Purpose
    - Enable Realtime broadcasting on conversations table for instant notification updates
    - Enable Realtime broadcasting on messages table for instant message delivery
    - This ensures that changes to unread counts are immediately propagated to all connected clients

  2. Changes
    - Enable Realtime replication for conversations table
    - Enable Realtime replication for messages table

  ## Notes
  - This is critical for real-time notifications and messaging to work properly
  - Without this, clients won't receive instant updates when data changes
*/

-- Enable Realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;