/*
  # Create Wishlist Items Table

  1. New Tables
    - `wishlist_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `item_name` (text, required)
      - `category` (text)
      - `subcategory` (text)
      - `manufacturer` (text)
      - `pattern` (text)
      - `desired_price_max` (numeric)
      - `description` (text)
      - `ebay_search_term` (text)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on wishlist_items table
    - Add policies for users to manage their own wishlist items

  3. Indexes
    - Index on user_id for efficient user queries
    - Index on status for filtering active items
*/

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text DEFAULT ''::text,
  subcategory text DEFAULT ''::text,
  manufacturer text DEFAULT ''::text,
  pattern text DEFAULT ''::text,
  desired_price_max numeric,
  description text DEFAULT ''::text,
  ebay_search_term text DEFAULT ''::text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'found')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);

-- Enable RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wishlist items"
  ON wishlist_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wishlist items"
  ON wishlist_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wishlist items"
  ON wishlist_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own wishlist items"
  ON wishlist_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_wishlist_items_timestamp
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_items_updated_at();
