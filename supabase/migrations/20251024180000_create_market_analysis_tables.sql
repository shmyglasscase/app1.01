/*
  # Create Market Analysis Tables

  1. New Tables
    - `ebay_market_data`
      - `id` (uuid, primary key)
      - `inventory_item_id` (uuid, foreign key to inventory_items)
      - `ebay_item_id` (text, unique eBay listing identifier)
      - `title` (text, listing title)
      - `sold_price` (numeric, final sale price)
      - `sold_date` (timestamptz, date item sold)
      - `condition` (text, item condition)
      - `listing_url` (text, link to eBay listing)
      - `image_url` (text, thumbnail image)
      - `seller_info` (jsonb, seller details)
      - `shipping_cost` (numeric, shipping price)
      - `created_at` (timestamptz)

    - `market_analysis_cache`
      - `id` (uuid, primary key)
      - `inventory_item_id` (uuid, foreign key to inventory_items, unique)
      - `analysis_data` (jsonb, computed statistics)
      - `last_updated` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only view market data for their own inventory items
    - System can insert and update data

  3. Indexes
    - Index on inventory_item_id for fast lookups
    - Index on sold_date for time-based queries
    - Index on expires_at for cache management

  4. Important Notes
    - ebay_market_data stores individual sold listings
    - market_analysis_cache stores aggregated analysis results
    - Cache expires after 24 hours to keep data fresh
    - Seller info stored as JSONB for flexibility
*/

-- Create ebay_market_data table
CREATE TABLE IF NOT EXISTS ebay_market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  ebay_item_id text NOT NULL,
  title text NOT NULL,
  sold_price numeric NOT NULL,
  sold_date timestamptz NOT NULL,
  condition text DEFAULT '',
  listing_url text DEFAULT '',
  image_url text,
  seller_info jsonb DEFAULT '{}'::jsonb,
  shipping_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ebay_item_id)
);

-- Create market_analysis_cache table
CREATE TABLE IF NOT EXISTS market_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(inventory_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ebay_market_data_inventory_item ON ebay_market_data(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_ebay_market_data_sold_date ON ebay_market_data(sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_analysis_cache_inventory_item ON market_analysis_cache(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_market_analysis_cache_expires ON market_analysis_cache(expires_at);

-- Enable RLS
ALTER TABLE ebay_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ebay_market_data
CREATE POLICY "Users can view market data for their own items"
  ON ebay_market_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = ebay_market_data.inventory_item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert market data"
  ON ebay_market_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update market data"
  ON ebay_market_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for market_analysis_cache
CREATE POLICY "Users can view analysis cache for their own items"
  ON market_analysis_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = market_analysis_cache.inventory_item_id
      AND inventory_items.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analysis cache"
  ON market_analysis_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update analysis cache"
  ON market_analysis_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_market_analysis()
RETURNS void AS $$
BEGIN
  DELETE FROM market_analysis_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
