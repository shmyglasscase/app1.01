# Wishlist Matching System

## Overview

The wishlist matching system automatically detects when marketplace listings are similar to user wishlist items and notifies users of potential matches. The system uses a fuzzy matching algorithm with an 80% similarity threshold.

## How It Works

### 1. Automatic Match Detection

When a user creates:
- **New Marketplace Listing**: The system checks all active wishlist items from other users
- **New Wishlist Item**: The system checks all active marketplace listings from other users

Database triggers automatically create pending match jobs that are processed in the background.

### 2. Fuzzy Matching Algorithm

The matching algorithm (in the `wishlist-matcher` Edge Function) calculates similarity using:

- **Name/Title** (50% weight): Main item name comparison
- **Category** (20% weight): Category matching
- **Manufacturer** (15% weight): Manufacturer comparison
- **Pattern** (10% weight): Pattern matching
- **Description** (5% weight): Description similarity

**Match Threshold**: 80% or higher creates a match record

**Similarity Calculation**: Uses Levenshtein distance algorithm for text comparison

### 3. Match Notifications

When a match is found:
1. A record is created in `wishlist_matches` table
2. A notification is inserted into `user_notifications` table
3. User receives notification with match percentage
4. Match appears in the wishlist item details

### 4. User Interface Features

#### Wishlist Item Cards
- Display match count badges on items that have matches
- Badge shows number of potential matches (e.g., "3 matches")
- Green color indicates active matches

#### Wishlist Item Details
- **Potential Matches Section**: Expandable section showing all matches
- **Match Cards**: Each match displays:
  - Match score percentage (color-coded)
  - Listing title and image
  - Price
  - Category
  - "New" badge for unviewed matches
- **Actions**:
  - Tap to view full listing details
  - Dismiss individual matches
  - Automatically marks as "viewed" when opened

#### Match Status Types
- `new`: Just discovered, not yet viewed
- `viewed`: User has seen the match
- `dismissed`: User has dismissed the match
- `interested`: User marked interest (future feature)

### 5. Background Processing

The `useMatchProcessor` hook runs in the background:
- Polls every 30 seconds for pending match jobs
- Processes up to 5 jobs at a time
- Calls the Edge Function to calculate matches
- Updates job status (pending → processing → completed/failed)
- Listens for realtime database changes to process new jobs immediately

## Database Tables

### `wishlist_matches`
Stores all match records with scores and details
- `id`: Unique match ID
- `wishlist_item_id`: Reference to wishlist item
- `marketplace_listing_id`: Reference to marketplace listing
- `match_score`: Similarity percentage (0-100)
- `match_status`: Status of the match
- `match_details`: JSON with individual field scores

### `pending_match_jobs`
Queue for processing new items
- `id`: Job ID
- `job_type`: 'match_listing' or 'match_wishlist'
- `reference_id`: ID of the item to match
- `status`: 'pending', 'processing', 'completed', 'failed'

### `user_notifications`
User notifications for all types including wishlist matches
- Supports notification type: `wishlist_match`

## Edge Function: wishlist-matcher

**Location**: `supabase/functions/wishlist-matcher`

**Modes**:
1. `match_listing`: Match a marketplace listing against all wishlist items
2. `match_wishlist`: Match a wishlist item against all marketplace listings

**Authentication**: Requires valid JWT token

**Returns**: List of matches created with scores and details

## Security

### Row Level Security (RLS)
- Users can only view matches for their own wishlist items
- Users can update match status for their own matches
- System can create matches for any user (authenticated)

### Data Privacy
- Users never see who created the marketplace listing in the match
- Only relevant listing information is displayed
- Match calculations happen server-side

## Performance Optimizations

1. **Indexes**:
   - wishlist_item_id, marketplace_listing_id
   - match_score (descending for top matches)
   - match_status (for filtering)

2. **Realtime Subscriptions**:
   - Listen for new match jobs
   - Update match counts automatically
   - Refresh matches when data changes

3. **Batch Processing**:
   - Process multiple jobs in parallel
   - Limit processing to prevent overload
   - Automatic retry on failure

## Usage Example

### User Flow
1. User adds "Fire-King Jadite Mixing Bowl" to wishlist
2. Database trigger creates a pending match job
3. Background processor picks up the job
4. Edge Function calculates matches against active listings
5. Finds "Vintage Fire King Jadeite Mixing Bowl Set" with 92% match
6. Creates match record and notification
7. User sees notification: "New Match Found! We found a 92% match for..."
8. User opens wishlist item and sees match in "Potential Matches" section
9. User taps match to view full listing details
10. User can contact seller or dismiss the match

## Future Enhancements

- Price range matching
- Location-based matching
- User preferences for match sensitivity
- Email notifications for high-quality matches
- Match history and analytics
- Machine learning for improved matching accuracy
