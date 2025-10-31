/*
  # Update Wishlist Items - Add Photo Support and Remove eBay Search Term

  1. Changes
    - Add `photo_url` column to store wishlist item photos
    - Remove `ebay_search_term` column (no longer needed)

  2. Details
    - photo_url: text field to store image URLs
    - Safely drops ebay_search_term if it exists

  3. Notes
    - Using conditional column operations to avoid errors if already applied
*/

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE wishlist_items ADD COLUMN photo_url text;
  END IF;
END $$;

-- Remove ebay_search_term column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_items' AND column_name = 'ebay_search_term'
  ) THEN
    ALTER TABLE wishlist_items DROP COLUMN ebay_search_term;
  END IF;
END $$;
