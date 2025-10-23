/*
  # Create Wishlist Matching System

  1. New Tables
    - `wishlist_matches`
      - `id` (uuid, primary key)
      - `wishlist_item_id` (uuid, foreign key to wishlist_items)
      - `marketplace_listing_id` (uuid, foreign key to marketplace_listings)
      - `match_score` (numeric, 0-100 representing similarity percentage)
      - `match_status` (text, values: 'new', 'viewed', 'dismissed', 'interested')
      - `match_details` (jsonb, stores which fields matched and their individual scores)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `match_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `wishlist_match_id` (uuid, foreign key to wishlist_matches)
      - `notification_sent_at` (timestamp)
      - `notification_read_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to read their own matches and notifications
    - Add policies for system to create matches and notifications

  3. Indexes
    - Index on wishlist_item_id and marketplace_listing_id for fast lookups
    - Index on match_score for filtering high-quality matches
    - Index on match_status for filtering by status
    - Index on user_id for notification queries
*/

-- Create wishlist_matches table
CREATE TABLE IF NOT EXISTS wishlist_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id uuid NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  marketplace_listing_id uuid NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  match_score numeric NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_status text NOT NULL DEFAULT 'new' CHECK (match_status IN ('new', 'viewed', 'dismissed', 'interested')),
  match_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wishlist_item_id, marketplace_listing_id)
);

-- Create match_notifications table
CREATE TABLE IF NOT EXISTS match_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wishlist_match_id uuid NOT NULL REFERENCES wishlist_matches(id) ON DELETE CASCADE,
  notification_sent_at timestamptz DEFAULT now(),
  notification_read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_wishlist_item ON wishlist_matches(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_marketplace_listing ON wishlist_matches(marketplace_listing_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_score ON wishlist_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_matches_status ON wishlist_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_match_notifications_user ON match_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_match ON match_notifications(wishlist_match_id);

-- Enable RLS
ALTER TABLE wishlist_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist_matches
CREATE POLICY "Users can view matches for their own wishlist items"
  ON wishlist_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_items
      WHERE wishlist_items.id = wishlist_matches.wishlist_item_id
      AND wishlist_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update match status for their own matches"
  ON wishlist_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_items
      WHERE wishlist_items.id = wishlist_matches.wishlist_item_id
      AND wishlist_items.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlist_items
      WHERE wishlist_items.id = wishlist_matches.wishlist_item_id
      AND wishlist_items.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert matches"
  ON wishlist_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for match_notifications
CREATE POLICY "Users can view their own match notifications"
  ON match_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own match notifications"
  ON match_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert match notifications"
  ON match_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_wishlist_matches_timestamp
  BEFORE UPDATE ON wishlist_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_matches_updated_at();
