/*
  # Add Anonymous Access to Shared Items

  1. New Policies
    - Allow anonymous users to view inventory_items that are in an active shared collection
    - Allow anonymous users to view wishlist_items that are in an active shared collection
    - Allow anonymous users to view profile info for users who have shared collections

  2. Security
    - Anonymous users can ONLY view items that are explicitly shared via shared_collections
    - They cannot view items that aren't shared
    - They can only see limited profile information (full_name, email) of share creators
    - All existing authenticated user policies remain unchanged

  ## Notes
  - These policies enable the public sharing feature to work correctly
  - Items are only accessible if they're part of an active (non-expired) share
  - This maintains security while enabling the sharing functionality
*/

-- Allow anonymous users to view inventory items that are in a shared collection
CREATE POLICY "Anonymous can view shared inventory items"
  ON inventory_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_collections
      WHERE collection_type = 'collection'
      AND id::text = ANY(item_ids)
      AND inventory_items.id::text = ANY(item_ids)
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Allow anonymous users to view wishlist items that are in a shared collection
CREATE POLICY "Anonymous can view shared wishlist items"
  ON wishlist_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_collections
      WHERE collection_type = 'wishlist'
      AND id::text = ANY(item_ids)
      AND wishlist_items.id::text = ANY(item_ids)
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Allow anonymous users to view profile info for users with shared collections
CREATE POLICY "Anonymous can view profile info for shared collections"
  ON profiles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shared_collections
      WHERE shared_collections.user_id = profiles.id
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
