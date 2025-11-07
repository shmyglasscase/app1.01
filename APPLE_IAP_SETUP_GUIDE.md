# Apple In-App Purchase Setup Guide

## Overview

MyGlassCase uses Apple's In-App Purchase system to manage subscriptions with a 3-day free trial. This guide walks you through setting up subscriptions in App Store Connect and configuring your app.

## Current Implementation Status

✅ Database tables created for subscription tracking
✅ Edge function for receipt verification implemented
✅ Frontend UI components for paywall and management complete
✅ Subscription hooks and utilities ready
✅ Auto-start 3-day trial on signup
⚠️ **Needs App Store Connect configuration**

## Prerequisites

- Active Apple Developer Program membership ($99/year)
- Xcode installed (for iOS builds)
- EAS CLI installed (for building the app)

## Part 1: App Store Connect Configuration

### Step 1: Create Your App Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in app information:
   - **Platform**: iOS
   - **Name**: MyGlassCase
   - **Primary Language**: English
   - **Bundle ID**: com.myglasscase.app
   - **SKU**: myglasscase-ios-001
   - **User Access**: Full Access

### Step 2: Create Subscription Group

1. In your app page, go to **"Subscriptions"** tab
2. Click **"Create"** to create a new subscription group
3. Fill in details:
   - **Reference Name**: MyGlassCase Premium
   - **Group Display Name** (App Store): Premium Membership
   - Submit

### Step 3: Create Subscription Product

1. Within your subscription group, click **"Create Subscription"**
2. Fill in subscription details:

   **Reference Name**: Premium Monthly

   **Product ID**: `com.myglasscase.app.premium.monthly`
   ⚠️ **IMPORTANT**: This must match the ID in your code

   **Subscription Duration**: 1 Month (30 Days)

   **Subscription Price**:
   - Select pricing tier (e.g., $9.99/month)
   - Set prices for all territories

3. Click **"Save"**

### Step 4: Configure Free Trial

1. In the subscription product settings, find **"Free Trial Duration"**
2. Select **"3 Days"**
3. Enable **"Offer automatically"** - this ensures new subscribers get the trial
4. Save changes

### Step 5: Localization

1. Add localized information for the subscription:
   - **Subscription Display Name**: Premium Membership
   - **Description**: Unlock unlimited items, market analysis, and premium features
2. Add for each language you support
3. Save

### Step 6: Review Information

1. Add **"Subscription Review Information"**:
   - Screenshots showing subscription benefits
   - Notes for App Review explaining the subscription
2. Submit for review

## Part 2: Get Shared Secret

1. In App Store Connect, go to your app
2. Navigate to **"Subscriptions"** → **"App-Specific Shared Secret"**
3. Click **"Generate"** if not already generated
4. Copy the shared secret (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Configure in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Key**: `APPLE_SHARED_SECRET`
   - **Value**: Your shared secret from above
4. Save

## Part 3: Sandbox Testing

### Create Sandbox Test Users

1. In App Store Connect, go to **"Users and Access"**
2. Click **"Sandbox Testers"**
3. Click **"+"** to add tester
4. Fill in details:
   - Email (must be unique, not used in App Store)
   - Password
   - Country/Region
5. Save - you'll receive a verification email

### Test Subscription Flow

1. Build your app for testing (TestFlight or Simulator)
2. Sign out of any App Store accounts on device
3. Launch the app and create an account
4. When prompted for subscription, use sandbox tester credentials
5. Complete purchase - **you won't be charged**
6. Verify trial starts and shows correct expiration

### Testing Tips

- Sandbox trials expire in real-time (3 days = 3 days)
- You can speed up renewals by:
  - 3 minutes for monthly (instead of 30 days)
  - Enable this in Sandbox environment
- Cancel and restore purchases to test those flows
- Check subscription status in Settings → Subscription

## Part 4: Build and Deploy

### Update Product IDs (if needed)

If you used a different Product ID in App Store Connect, update:

**File**: `lib/subscriptions.ts`
```typescript
export const SUBSCRIPTION_PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.myglasscase.app.premium.monthly', // Your Product ID
} as const;
```

### Build iOS App

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios
```

### Submit to TestFlight

```bash
eas submit --platform ios
```

## Part 5: App Review Preparation

### Required for Approval

1. **Demo Account**:
   - Provide a test account in App Review Information
   - Should have some sample data
   - Should NOT require payment to test core features

2. **Review Notes**:
   ```
   This app uses auto-renewable subscriptions with a 3-day free trial.

   Premium features include:
   - Unlimited item storage
   - Market analysis with eBay pricing
   - Priority marketplace listings
   - Wishlist matching notifications

   Free trial starts automatically on signup and converts to paid subscription
   after 3 days unless cancelled. Users can manage subscription in Settings.
   ```

3. **Screenshots**:
   - Include subscription selection screen
   - Show premium features in action
   - Display subscription management screen

### Common Rejection Reasons (and How to Avoid)

1. **"Free trial not clear"**
   - ✅ Solution: We display trial info prominently in paywall
   - Show "3-day free trial" clearly
   - Explain auto-renewal

2. **"Subscription doesn't work"**
   - ✅ Solution: Test thoroughly in Sandbox
   - Provide test account
   - Record video of subscription flow

3. **"Core features locked"**
   - ✅ Solution: Free tier exists (limited items)
   - Premium enhances experience, doesn't gate basic usage

## Part 6: Production Launch

### Before Launch Checklist

- [ ] Subscription products are approved in App Store Connect
- [ ] Shared secret configured in Supabase
- [ ] Tested complete subscription flow in Sandbox
- [ ] Tested trial expiration and renewal
- [ ] Tested subscription cancellation
- [ ] Tested restore purchases
- [ ] Receipt verification working correctly
- [ ] App approved by App Review

### Go Live

1. Set app status to **"Ready for Sale"**
2. Subscription becomes active automatically
3. Monitor initial purchases closely
4. Check receipt verification logs in Supabase

## Part 7: Monitoring and Maintenance

### Track Subscription Metrics

1. **App Store Connect Analytics**:
   - Active subscriptions
   - Free trial conversions
   - Churn rate
   - Revenue

2. **Supabase Dashboard**:
   - Query subscriptions table
   - Check trial → paid conversion rate
   - Monitor cancellations

### Handle Server Notifications

Apple sends notifications for subscription events:
- Renewals
- Cancellations
- Billing issues
- Refunds

These are handled by the `verify-subscription` edge function automatically.

## Troubleshooting

### "Cannot connect to iTunes Store"

- Using real device, not simulator (for production)
- Signed in with correct Apple ID
- App has correct bundle identifier
- In-App Purchases enabled in app capabilities

### Trial Not Starting

- Check if `start_user_trial()` is called on signup
- Verify database has subscriptions table
- Check AuthContext for trial initialization
- Check edge function logs

### Receipt Verification Failing

- Confirm `APPLE_SHARED_SECRET` is set correctly
- Check edge function logs for specific errors
- Verify receipt format from Apple
- Try both production and sandbox URLs

### Subscription Not Showing in Settings

- Refresh subscription status manually
- Check if subscription record exists in database
- Verify RLS policies allow user to read their subscription
- Check useSubscription hook for errors

## Resources

- [Apple In-App Purchase Documentation](https://developer.apple.com/in-app-purchase/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Expo In-App Purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Receipt Validation Guide](https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Introduction.html)

## Support

For issues with:
- **App Store Connect**: Contact Apple Developer Support
- **Supabase**: Check edge function logs and database
- **App Code**: Review implementation in this project

## Pricing Recommendations

### Suggested Pricing Tiers

**Starter** (Current): $9.99/month
- Good entry point for most users
- Competitive with similar apps
- High perceived value with trial

**Alternative Tiers** (Future):
- **Monthly**: $9.99/month
- **Annual**: $89.99/year (save $30)
- **Lifetime**: $199.99 (one-time)

### Promotional Offers

Consider creating promotional offers in App Store Connect:
- First month at $4.99 for returning users
- Annual subscription at 20% off
- Win-back offers for cancelled subscriptions

---

Your app is now configured for Apple In-App Purchases with a 3-day free trial! 🎉
