# Market Analysis Backend Integration Guide

## Overview
The frontend UI for Market Analysis is complete and functional. This guide explains what your backend engineer needs to implement to integrate real eBay data.

## Current Status
✅ Database tables created (`ebay_market_data` and `market_analysis_cache`)
✅ Frontend UI components built
✅ Edge Function placeholder created with mock data
✅ Data fetching hooks implemented
✅ All TypeScript types defined

## What Your Backend Engineer Needs to Do

### 1. Replace Mock Data in Edge Function

**File to modify:** `supabase/functions/get-market-analysis/index.ts`

**Current behavior:** Lines 114-156 generate 3 mock eBay listings based on the inventory item

**What to implement:**
- Integrate with eBay Finding API (or your preferred eBay API)
- Search for recently sold items matching the inventory item details
- Use these search criteria:
  - Item name
  - Manufacturer (if available)
  - Pattern (if available)
  - Category (if available)
  - Condition (filter results by similar condition)

**Search strategy:**
```javascript
// Build search query from inventory item
const searchQuery = [
  inventoryItem.name,
  inventoryItem.manufacturer,
  inventoryItem.pattern
].filter(Boolean).join(' ');

// Query eBay API for completed/sold listings
// Filter by condition if specified
// Sort by sold date (most recent first)
// Limit to 1-3 results
```

### 2. Map eBay Response to Database Schema

**Required fields for `ebay_market_data` table:**
```typescript
{
  id: uuid,                      // Auto-generated
  inventory_item_id: uuid,       // From request
  ebay_item_id: string,          // eBay's unique item ID
  title: string,                 // eBay listing title
  sold_price: number,            // Final sale price
  sold_date: timestamptz,        // When item sold
  condition: string,             // Item condition
  listing_url: string,           // Link to eBay listing
  image_url: string,             // Main product image
  seller_info: jsonb,            // Seller details (username, rating, etc.)
  shipping_cost: number,         // Shipping price
  created_at: timestamptz        // Auto-generated
}
```

### 3. Calculate Analysis Statistics

After fetching eBay data, calculate these statistics:

```javascript
const prices = ebayListings.map(l => l.sold_price);
const analysisData = {
  average_price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
  min_price: Math.min(...prices),
  max_price: Math.max(...prices),
  sample_size: ebayListings.length,
  trending: calculateTrend(ebayListings), // 'up' | 'down' | 'stable'
  listings: ebayListings
};
```

### 4. Cache Management

The caching logic is already implemented in the Edge Function:
- First checks for valid cached data (not expired)
- If cache miss or force refresh, fetches new data
- Stores results in `market_analysis_cache` table
- Cache expires after 24 hours

**You only need to ensure the eBay API call succeeds and returns properly formatted data.**

## Testing the Integration

### 1. Mock Data Testing (Currently Works)
- Open any inventory item in the app
- Click to expand "Market Analysis" section
- You'll see 3 mock listings with prices based on the item's current value

### 2. Real Data Testing (After Implementation)
- Replace the mock data section in the Edge Function
- Test with various inventory items:
  - Common items (should find multiple matches)
  - Rare items (may find 0-1 matches)
  - Items without complete details (test graceful degradation)

### 3. Edge Cases to Handle
- No eBay results found → Return empty array, UI shows "No market data available"
- eBay API rate limits → Implement rate limiting and retry logic
- Malformed eBay responses → Add error handling
- Missing image URLs → UI has placeholder support

## API Configuration

### Environment Variables
All Supabase environment variables are automatically available in Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

You'll need to add:
- `EBAY_APP_ID` or equivalent eBay API credentials
- Configure these in Supabase Dashboard → Edge Functions → Secrets

### eBay API Recommendations
- Use eBay Finding API for sold listings search
- Use "findCompletedItems" call
- Filter by:
  - Keywords (item name + manufacturer + pattern)
  - Sold items only
  - Sold within last 90 days
  - Same category if available
- Sort by sold date descending
- Limit to 3-5 results

## Response Format Expected by Frontend

```typescript
{
  average_price: number,
  min_price: number,
  max_price: number,
  sample_size: number,
  trending?: 'up' | 'down' | 'stable',
  listings: [
    {
      id: string,
      inventory_item_id: string,
      ebay_item_id: string,
      title: string,
      sold_price: number,
      sold_date: string, // ISO 8601 format
      condition?: string,
      listing_url?: string,
      image_url?: string,
      seller_info?: object,
      shipping_cost?: number,
      created_at: string
    }
  ],
  cached: boolean,
  last_updated: string
}
```

## Deployment Steps

1. Implement eBay API integration in Edge Function
2. Add eBay API credentials to Supabase secrets
3. Deploy Edge Function using Supabase CLI or dashboard
4. Test with sample inventory items
5. Monitor error logs in Supabase dashboard

## Database Schema Reference

Run this migration to create the tables (already in codebase):
```
supabase/migrations/20251024180000_create_market_analysis_tables.sql
```

Tables created:
- `ebay_market_data` - Stores individual eBay sold listings
- `market_analysis_cache` - Caches computed analysis results

## Support

If you have questions about:
- Frontend UI behavior → Check `components/MarketAnalysisSection.tsx`
- Data fetching logic → Check `hooks/useMarketAnalysis.ts`
- Edge Function structure → Check `supabase/functions/get-market-analysis/index.ts`
- Type definitions → Check `types/database.ts`

The frontend is fully functional with mock data, so you can focus entirely on the eBay API integration!
