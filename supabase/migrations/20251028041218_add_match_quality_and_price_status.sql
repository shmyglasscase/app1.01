/*
  # Add Match Quality and Price Status Fields

  1. Changes
    - Add `match_quality` column to `wishlist_matches` table
      - Values: 'excellent match', 'strong match', 'good match', 'fair match'
    - Add `price_status` column to `wishlist_matches` table
      - Values: 'within budget', 'over budget', 'under budget', 'no price set'
    
  2. Notes
    - These fields provide user-friendly labels for matches
    - match_quality is derived from match_score ranges
    - price_status compares listing price to wishlist item max_price
*/

-- Add match_quality column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_matches' AND column_name = 'match_quality'
  ) THEN
    ALTER TABLE wishlist_matches 
    ADD COLUMN match_quality text CHECK (match_quality IN ('excellent match', 'strong match', 'good match', 'fair match'));
  END IF;
END $$;

-- Add price_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlist_matches' AND column_name = 'price_status'
  ) THEN
    ALTER TABLE wishlist_matches 
    ADD COLUMN price_status text CHECK (price_status IN ('within budget', 'over budget', 'under budget', 'no price set'));
  END IF;
END $$;
