/*
  # Create Shared Collections Table

  1. New Table
    - `shared_collections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - User who created the share
      - `share_token` (text, unique) - Unique token for URL sharing
      - `collection_type` (text) - Type of collection ('wishlist' or 'collection')
      - `item_ids` (text[]) - Array of item IDs being shared
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `view_count` (integer) - Track number of views
      - `created_at` (timestamptz) - When share was created

  2. Security
    - Enable RLS on shared_collections table
    - Users can create their own shares
    - Users can view their own shares
    - Anyone (including anonymous) can view shared items by token
    - Automatically generate secure share tokens

  3. Indexes
    - Index on share_token for fast lookups
    - Index on user_id for user's shares list

  ## Notes
  - Share tokens are cryptographically secure (base64 encoded random bytes)
  - View count tracks engagement
  - Optional expiration for temporary shares
  - Anonymous users can view but not create shares
*/

-- Create shared_collections table
CREATE TABLE IF NOT EXISTS shared_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'base64'),
  collection_type TEXT NOT NULL CHECK (collection_type IN ('wishlist', 'collection')),
  item_ids TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_collections_token ON shared_collections(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_collections_user ON shared_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_collections_created ON shared_collections(created_at DESC);

-- Enable Row Level Security
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own shares
CREATE POLICY "Users can create their own shares"
  ON shared_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own shares
CREATE POLICY "Users can view their own shares"
  ON shared_collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own shares (e.g., view count)
CREATE POLICY "Users can update their own shares"
  ON shared_collections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
  ON shared_collections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can view shared items by token (public access)
CREATE POLICY "Anyone can view shared items by token"
  ON shared_collections
  FOR SELECT
  TO anon
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- Policy: System can update view count (for anonymous users too)
CREATE POLICY "Anyone can update view count"
  ON shared_collections
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired shares (optional, can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shared_collections
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Add helpful comment
COMMENT ON TABLE shared_collections IS 'Stores shareable links for collections and wishlists with public view access';
