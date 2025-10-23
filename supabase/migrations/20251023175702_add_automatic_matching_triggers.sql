/*
  # Add Automatic Matching Triggers

  1. Functions
    - `trigger_marketplace_listing_match` - Triggers matching when a new marketplace listing is created
    - `trigger_wishlist_item_match` - Triggers matching when a new wishlist item is created

  2. Triggers
    - After insert on marketplace_listings, call wishlist-matcher Edge Function
    - After insert on wishlist_items, call wishlist-matcher Edge Function

  Note: Since we cannot directly call Edge Functions from database triggers,
  we'll create a helper table that the application can poll or subscribe to.
  This is a workaround for the limitation of calling external services from triggers.

  3. New Table
    - `pending_match_jobs` - Stores pending matching jobs to be processed
*/

-- Create pending match jobs table
CREATE TABLE IF NOT EXISTS pending_match_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('match_listing', 'match_wishlist')),
  reference_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_pending_match_jobs_status ON pending_match_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pending_match_jobs_created ON pending_match_jobs(created_at);

-- Enable RLS
ALTER TABLE pending_match_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pending jobs
CREATE POLICY "Authenticated users can view pending match jobs"
  ON pending_match_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to manage jobs
CREATE POLICY "System can manage pending match jobs"
  ON pending_match_jobs FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Function to create match job for new marketplace listing
CREATE OR REPLACE FUNCTION create_match_job_for_listing()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_match_jobs (job_type, reference_id)
  VALUES ('match_listing', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create match job for new wishlist item
CREATE OR REPLACE FUNCTION create_match_job_for_wishlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_match_jobs (job_type, reference_id)
  VALUES ('match_wishlist', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on marketplace_listings
DROP TRIGGER IF EXISTS trigger_match_new_listing ON marketplace_listings;
CREATE TRIGGER trigger_match_new_listing
  AFTER INSERT ON marketplace_listings
  FOR EACH ROW
  WHEN (NEW.listing_status = 'active')
  EXECUTE FUNCTION create_match_job_for_listing();

-- Trigger on wishlist_items
DROP TRIGGER IF EXISTS trigger_match_new_wishlist_item ON wishlist_items;
CREATE TRIGGER trigger_match_new_wishlist_item
  AFTER INSERT ON wishlist_items
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION create_match_job_for_wishlist();
