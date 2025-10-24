/*
  # Remove Unused Database Tables

  1. Tables Being Removed
    - `inventory` - Legacy table replaced by inventory_items
    - `inventory_photos` - Photos now stored in photo_url field of inventory_items
    - `ebay_listings` - eBay integration not implemented
    - `ebay_credentials` - eBay integration not implemented
    - `found_listings` - Replaced by wishlist_matches table
    - `match_notifications` - Notifications now in user_notifications table
    - `stripe_orders` - Stripe payment integration not active
    - `stripe_subscriptions` - Stripe payment integration not active
    - `stripe_customers` - Stripe payment integration not active

  2. Important Notes
    - These tables are not referenced in the current application code
    - Removing them will clean up the database schema
    - If needed in the future, they can be recreated via new migrations
    
  3. Safety
    - Using DROP TABLE IF EXISTS to prevent errors if tables don't exist
    - CASCADE to remove dependent objects if any exist
*/

-- Drop unused legacy inventory tables
DROP TABLE IF EXISTS inventory_photos CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;

-- Drop eBay integration tables (not implemented)
DROP TABLE IF EXISTS ebay_listings CASCADE;
DROP TABLE IF EXISTS ebay_credentials CASCADE;

-- Drop old wishlist/matching tables (replaced by new system)
DROP TABLE IF EXISTS found_listings CASCADE;
DROP TABLE IF EXISTS match_notifications CASCADE;

-- Drop Stripe tables (payment integration not active)
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
