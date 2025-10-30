/*
  # Create Intelligent Category System

  ## Overview
  Creates a crowd-sourced, fuzzy-matching category system that learns from user behavior.
  When 2+ unique users use similar category names, they automatically become popular categories
  available for filtering and autocomplete suggestions.

  ## New Tables

  ### 1. `category_usage_tracking`
  Logs every instance of a category being used in marketplace listings
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `marketplace_listing_id` (uuid, references marketplace_listings)
  - `category_raw` (text) - exact text user entered
  - `category_normalized` (text) - normalized for fuzzy matching
  - `category_type` (text) - 'category' or 'subcategory'
  - `created_at` (timestamptz)

  ### 2. `popular_categories`
  Stores categories that have met the 2-user threshold
  - `id` (uuid, primary key)
  - `category_normalized` (text, unique) - canonical name
  - `category_display` (text) - most common display variation
  - `category_type` (text) - 'category' or 'subcategory'
  - `unique_user_count` (integer) - unique users who used this
  - `total_usage_count` (integer) - total times used
  - `is_active` (boolean) - whether to show in filters (>= 2 users)
  - `first_seen_at` (timestamptz)
  - `last_used_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `category_groups`
  Groups similar category variations using fuzzy matching
  - `id` (uuid, primary key)
  - `canonical_category_id` (uuid, references popular_categories)
  - `category_variation` (text) - variation that fuzzy matches
  - `similarity_score` (numeric) - similarity (0-1)
  - `created_at` (timestamptz)

  ### 4. `user_search_history`
  Tracks search patterns and filter usage for analytics
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `search_query` (text)
  - `filters_applied` (jsonb) - all filter selections
  - `results_count` (integer)
  - `created_at` (timestamptz)

  ## Performance Indexes
  - Indexes on marketplace_listings for filtering
  - Indexes on normalized categories for fast lookups
  - Composite indexes for common query patterns

  ## Security
  - RLS enabled on all tables
  - Users can read popular categories
  - Only authenticated users can track searches
  - Category tracking happens automatically via triggers
*/

-- Create category_usage_tracking table
CREATE TABLE IF NOT EXISTS category_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marketplace_listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  category_raw text NOT NULL,
  category_normalized text NOT NULL,
  category_type text NOT NULL CHECK (category_type IN ('category', 'subcategory')),
  created_at timestamptz DEFAULT now()
);

-- Create popular_categories table
CREATE TABLE IF NOT EXISTS popular_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_normalized text NOT NULL UNIQUE,
  category_display text NOT NULL,
  category_type text NOT NULL CHECK (category_type IN ('category', 'subcategory')),
  unique_user_count integer DEFAULT 0,
  total_usage_count integer DEFAULT 0,
  is_active boolean DEFAULT false,
  first_seen_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create category_groups table
CREATE TABLE IF NOT EXISTS category_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_category_id uuid NOT NULL REFERENCES popular_categories(id) ON DELETE CASCADE,
  category_variation text NOT NULL,
  similarity_score numeric(3,2) DEFAULT 1.0 CHECK (similarity_score >= 0 AND similarity_score <= 1),
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_category_id, category_variation)
);

-- Create user_search_history table
CREATE TABLE IF NOT EXISTS user_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  search_query text,
  filters_applied jsonb DEFAULT '{}'::jsonb,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_category_usage_user_id ON category_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_category_usage_normalized ON category_usage_tracking(category_normalized);
CREATE INDEX IF NOT EXISTS idx_category_usage_type ON category_usage_tracking(category_type);
CREATE INDEX IF NOT EXISTS idx_category_usage_created_at ON category_usage_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_popular_categories_normalized ON popular_categories(category_normalized);
CREATE INDEX IF NOT EXISTS idx_popular_categories_active ON popular_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_popular_categories_type ON popular_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_popular_categories_user_count ON popular_categories(unique_user_count DESC);

CREATE INDEX IF NOT EXISTS idx_category_groups_canonical ON category_groups(canonical_category_id);
CREATE INDEX IF NOT EXISTS idx_category_groups_variation ON category_groups(category_variation);

CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_created_at ON user_search_history(created_at DESC);

-- Add indexes to marketplace_listings for enhanced filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_subcategory ON marketplace_listings(subcategory);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_condition ON marketplace_listings(condition);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_asking_price ON marketplace_listings(asking_price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_listing_type ON marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category_price ON marketplace_listings(category, asking_price);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_condition_price ON marketplace_listings(condition, asking_price);

-- Enable RLS on all new tables
ALTER TABLE category_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_usage_tracking
CREATE POLICY "Users can view all category usage"
  ON category_usage_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert category usage"
  ON category_usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for popular_categories
CREATE POLICY "Anyone can view active popular categories"
  ON popular_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "System can manage popular categories"
  ON popular_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for category_groups
CREATE POLICY "Anyone can view category groups"
  ON category_groups FOR SELECT
  USING (true);

CREATE POLICY "System can manage category groups"
  ON category_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_search_history
CREATE POLICY "Users can view own search history"
  ON user_search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON user_search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to normalize category names
CREATE OR REPLACE FUNCTION normalize_category(category_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Remove special characters, convert to lowercase, trim whitespace
  RETURN lower(trim(regexp_replace(category_text, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$;

-- Function to calculate Levenshtein distance for fuzzy matching
CREATE OR REPLACE FUNCTION levenshtein_distance(s1 text, s2 text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s1_len integer := length(s1);
  s2_len integer := length(s2);
  i integer;
  j integer;
  cost integer;
  d integer[][];
BEGIN
  -- Handle edge cases
  IF s1_len = 0 THEN RETURN s2_len; END IF;
  IF s2_len = 0 THEN RETURN s1_len; END IF;
  
  -- Initialize matrix
  FOR i IN 0..s1_len LOOP
    d[i][0] := i;
  END LOOP;
  
  FOR j IN 0..s2_len LOOP
    d[0][j] := j;
  END LOOP;
  
  -- Calculate distances
  FOR i IN 1..s1_len LOOP
    FOR j IN 1..s2_len LOOP
      IF substring(s1, i, 1) = substring(s2, j, 1) THEN
        cost := 0;
      ELSE
        cost := 1;
      END IF;
      
      d[i][j] := LEAST(
        d[i-1][j] + 1,      -- deletion
        d[i][j-1] + 1,      -- insertion
        d[i-1][j-1] + cost  -- substitution
      );
    END LOOP;
  END LOOP;
  
  RETURN d[s1_len][s2_len];
END;
$$;

-- Function to calculate similarity score (0-1, where 1 is exact match)
CREATE OR REPLACE FUNCTION category_similarity(cat1 text, cat2 text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  norm1 text := normalize_category(cat1);
  norm2 text := normalize_category(cat2);
  max_len integer;
  distance integer;
BEGIN
  -- Exact match after normalization
  IF norm1 = norm2 THEN
    RETURN 1.0;
  END IF;
  
  max_len := GREATEST(length(norm1), length(norm2));
  IF max_len = 0 THEN
    RETURN 0.0;
  END IF;
  
  distance := levenshtein_distance(norm1, norm2);
  
  -- Return similarity score (1 - distance/max_length)
  RETURN ROUND(1.0 - (distance::numeric / max_len::numeric), 2);
END;
$$;

-- Function to process and update popular categories
CREATE OR REPLACE FUNCTION process_category_usage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_cat text;
  existing_popular_id uuid;
  distinct_users integer;
BEGIN
  -- Normalize the category
  normalized_cat := normalize_category(NEW.category_raw);
  
  -- Check if this normalized category already exists in popular_categories
  SELECT id INTO existing_popular_id
  FROM popular_categories
  WHERE category_normalized = normalized_cat
    AND category_type = NEW.category_type;
  
  IF existing_popular_id IS NOT NULL THEN
    -- Update existing popular category
    -- Count distinct users for this normalized category
    SELECT COUNT(DISTINCT user_id) INTO distinct_users
    FROM category_usage_tracking
    WHERE category_normalized = normalized_cat
      AND category_type = NEW.category_type;
    
    UPDATE popular_categories
    SET 
      unique_user_count = distinct_users,
      total_usage_count = total_usage_count + 1,
      is_active = (distinct_users >= 2),
      last_used_at = now(),
      updated_at = now()
    WHERE id = existing_popular_id;
  ELSE
    -- Create new popular category entry
    INSERT INTO popular_categories (
      category_normalized,
      category_display,
      category_type,
      unique_user_count,
      total_usage_count,
      is_active
    )
    VALUES (
      normalized_cat,
      NEW.category_raw,
      NEW.category_type,
      1,
      1,
      false
    )
    ON CONFLICT (category_normalized) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically process categories when tracking entries are created
CREATE TRIGGER trigger_process_category_usage
  AFTER INSERT ON category_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION process_category_usage();

-- Function to track marketplace listing categories
CREATE OR REPLACE FUNCTION track_marketplace_listing_categories()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Track main category if present
  IF NEW.category IS NOT NULL AND NEW.category != '' THEN
    INSERT INTO category_usage_tracking (
      user_id,
      marketplace_listing_id,
      category_raw,
      category_normalized,
      category_type
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.category,
      normalize_category(NEW.category),
      'category'
    );
  END IF;
  
  -- Track subcategory if present
  IF NEW.subcategory IS NOT NULL AND NEW.subcategory != '' THEN
    INSERT INTO category_usage_tracking (
      user_id,
      marketplace_listing_id,
      category_raw,
      category_normalized,
      category_type
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      NEW.subcategory,
      normalize_category(NEW.subcategory),
      'subcategory'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically track categories when marketplace listings are created or updated
CREATE TRIGGER trigger_track_marketplace_categories
  AFTER INSERT OR UPDATE OF category, subcategory ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION track_marketplace_listing_categories();

-- Create materialized view for fast category statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS category_statistics AS
SELECT 
  pc.id,
  pc.category_normalized,
  pc.category_display,
  pc.category_type,
  pc.unique_user_count,
  pc.total_usage_count,
  pc.is_active,
  COUNT(DISTINCT ml.id) as active_listing_count,
  MAX(ml.created_at) as last_listing_created
FROM popular_categories pc
LEFT JOIN marketplace_listings ml ON (
  (pc.category_type = 'category' AND normalize_category(ml.category) = pc.category_normalized)
  OR
  (pc.category_type = 'subcategory' AND normalize_category(ml.subcategory) = pc.category_normalized)
)
WHERE pc.is_active = true
GROUP BY pc.id, pc.category_normalized, pc.category_display, pc.category_type, 
         pc.unique_user_count, pc.total_usage_count, pc.is_active;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_category_stats_type ON category_statistics(category_type);
CREATE INDEX IF NOT EXISTS idx_category_stats_listing_count ON category_statistics(active_listing_count DESC);

-- Function to refresh category statistics
CREATE OR REPLACE FUNCTION refresh_category_statistics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_statistics;
END;
$$;