/*
  # Fix Anonymous Access Policies for Shared Items

  1. Fix
    - Drop the incorrect policies that had wrong logic
    - Recreate policies with correct logic to check if item ID is in the item_ids array

  2. Correct Logic
    - Check if the current item's ID exists in ANY shared_collection's item_ids array
    - Only allow access if the share is not expired
    - Properly cast UUIDs to text for array comparison

  ## Notes
  - Previous migration had incorrect logic comparing shared_collection.id with item_ids
  - This correctly checks if item.id is IN the item_ids array
*/

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Anonymous can view shared inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Anonymous can view shared wishlist items" ON wishlist_items;

-- Recreate with correct logic for inventory items
CREATE POLICY "Anonymous can view shared inventory items"
  ON inventory_items
  FOR SELECT
  TO anon
  USING (
    id::text = ANY(
      SELECT unnest(item_ids) 
      FROM shared_collections 
      WHERE collection_type = 'collection'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Recreate with correct logic for wishlist items
CREATE POLICY "Anonymous can view shared wishlist items"
  ON wishlist_items
  FOR SELECT
  TO anon
  USING (
    id::text = ANY(
      SELECT unnest(item_ids) 
      FROM shared_collections 
      WHERE collection_type = 'wishlist'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
