/*
  # Fix Wishlist Items Insert Trigger Error

  ## Problem
  The `match_new_wishlist` trigger on the `wishlist_items` table is incorrectly
  using the `match_wishlist_items()` function, which was designed for the 
  `marketplace_listings` table. This function references `NEW.title` which doesn't 
  exist in `wishlist_items` (it should be `NEW.item_name`), causing insert failures.

  ## Solution
  Drop the incorrect trigger. The wishlist matching is already handled by the 
  `trigger_match_new_wishlist_item` trigger which creates a pending match job 
  that the Edge Function processes correctly.

  ## Changes
  - Drop the `match_new_wishlist` trigger from `wishlist_items` table
  - The `match_new_listing` trigger on `marketplace_listings` remains unchanged
    and continues to work correctly
*/

-- Drop the incorrect trigger from wishlist_items
DROP TRIGGER IF EXISTS match_new_wishlist ON wishlist_items;
