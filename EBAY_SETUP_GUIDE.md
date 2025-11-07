# eBay API Setup Guide for Market Analysis

## Overview

The Market Analysis feature in MyGlassCase uses eBay's Finding API to fetch real market data for your collectibles. This guide will walk you through setting up your eBay Developer account and configuring the API credentials.

## Current Status

✅ Frontend UI is complete and functional
✅ Backend edge function is implemented
✅ Database tables are created
✅ Similarity matching algorithm is ready
⚠️ **Needs eBay API credentials to function**

## Step 1: Create an eBay Developer Account

1. Visit [eBay Developers Program](https://developer.ebay.com/)
2. Click **"Join Now"** or **"Sign In"**
3. Use your existing eBay account or create a new one
4. Accept the eBay Developers Program License Agreement

## Step 2: Create an Application

1. Once logged in, go to **"My Account"** → **"Application Access Keys"**
2. Click **"Create an Application Key Set"**
3. Choose **"Production"** environment (or Sandbox for testing)
4. Fill in the application details:
   - **Application Title**: MyGlassCase Market Analysis
   - **Application Type**: Web Application
   - **Description**: Market analysis feature for collectibles valuation
5. Submit the application

## Step 3: Get Your App ID

1. After creating the application, you'll see your credentials:
   - **App ID (Client ID)** - This is what you need
   - **Cert ID (Client Secret)** - Not needed for Finding API
   - **Dev ID** - Not needed for Finding API

2. Copy your **App ID** - it looks like this:
   ```
   MyGlass-MyGlassC-PRD-a1234567-12345678
   ```

## Step 4: Configure Supabase Environment Variable

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Click on **"Secrets"** or **"Environment Variables"**
4. Add a new secret:
   - **Key**: `EBAY_APP_ID`
   - **Value**: Your eBay App ID from Step 3
5. Save the secret

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase secrets set EBAY_APP_ID="your-ebay-app-id-here"
```

## Step 5: Verify the Setup

1. Open the MyGlassCase app
2. Navigate to an item in your collection
3. Open the item details
4. Expand the **"Market Analysis"** section
5. You should see real eBay data instead of empty results

## How It Works

When you expand Market Analysis:

1. The app calls the `get-market-analysis` edge function
2. The function uses your eBay App ID to search for similar items
3. It queries eBay's completed/sold listings from the last 90 days
4. Results are scored by similarity (name, manufacturer, pattern, condition)
5. Top 5 matches (30%+ similarity) are returned
6. Data is cached for 24 hours to reduce API calls
7. Price statistics are calculated automatically

## API Usage Limits

### eBay Finding API Limits:
- **5,000 calls per day** (Free tier)
- **Rate limit**: 5,000 calls per day
- **Commercial use**: May require upgrading to paid tier

### MyGlassCase Optimizations:
- Results are cached for 24 hours per item
- Only fetches when user explicitly requests analysis
- Similarity filtering reduces irrelevant results
- Top 5 results only to minimize data transfer

## Troubleshooting

### No Results Appearing

1. **Check Environment Variable**:
   - Verify `EBAY_APP_ID` is set correctly in Supabase
   - No extra spaces or quotes
   - Correct App ID from eBay Developers

2. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions → get-market-analysis
   - Look for error messages in logs
   - Common errors:
     - "EBAY_APP_ID not configured" → Add the secret
     - "eBay API error: 401" → Invalid App ID
     - "No eBay results found" → Item name may be too generic

3. **Test with a Well-Known Item**:
   - Try with a popular collectible (e.g., "Waterford Crystal Vase")
   - Should return multiple results
   - If still no results, check API credentials

### Rate Limit Exceeded

If you hit the 5,000 calls/day limit:
- Results are cached, so most users won't hit this
- Consider upgrading to eBay's commercial tier
- Implement user-level rate limiting if needed

### API Returns Irrelevant Items

The similarity algorithm may need tuning:
- Edit `supabase/functions/get-market-analysis/index.ts`
- Adjust `MINIMUM_SIMILARITY` threshold (currently 30%)
- Modify scoring weights in `calculateSimilarity()` function

## Advanced Configuration

### Using Sandbox Environment (Testing)

1. Create a Sandbox application in eBay Developers
2. Get the Sandbox App ID
3. Modify the edge function to use sandbox endpoint:
   ```typescript
   const baseUrl = 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';
   ```

### Adding More Search Filters

Edit the edge function to add filters:
- Price range filters
- Category-specific searches
- Seller rating minimums
- Shipping location filters

See eBay Finding API documentation for all available filters.

## Resources

- [eBay Finding API Documentation](https://developer.ebay.com/devzone/finding/Concepts/FindingAPIGuide.html)
- [eBay Developer Program](https://developer.ebay.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Support

If you encounter issues:

1. Check the edge function logs in Supabase Dashboard
2. Verify your eBay App ID is active and not expired
3. Test with a well-known collectible item
4. Review the `get-market-analysis/index.ts` code for any errors

## Next Steps

After setting up eBay API:

1. ✅ Market Analysis will show real pricing data
2. Consider adding more data sources (Etsy, 1stDibs, etc.)
3. Implement price trend tracking over time
4. Add price alerts for wishlist items
5. Export market reports for insurance purposes

Your Market Analysis feature is now ready to provide accurate, real-time market valuations for your collectibles!
