# MyGlassCase - App Store Deployment Checklist

## 🎉 Congratulations!

Your MyGlassCase app is now feature-complete with subscriptions and market analysis. This checklist will guide you through deploying to the Apple App Store.

## ✅ Pre-Deployment Checklist

### 1. Required Assets
- [ ] App icon (1024x1024) - Add to `assets/images/icon.png`
- [ ] Splash screen (2048x2048) - Add to `assets/images/splash.png`
- [ ] Adaptive icon (1024x1024) - Add to `assets/images/adaptive-icon.png`
- [ ] Notification icon (96x96) - Add to `assets/images/notification-icon.png`
- [ ] Favicon (48x48) - Add to `assets/images/favicon.png`

**See `ASSETS_NEEDED.md` for design specifications**

### 2. Apple Developer Account
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Team ID available
- [ ] App Store Connect access configured

### 3. App Store Connect Setup
- [ ] App listing created
- [ ] Bundle ID configured: `com.myglasscase.app`
- [ ] App name reserved: MyGlassCase
- [ ] Primary language set
- [ ] Age rating completed

### 4. Subscription Configuration (CRITICAL)
- [ ] Subscription group created in App Store Connect
- [ ] Product created: Premium Monthly (`com.myglasscase.app.premium.monthly`)
- [ ] Price set: $9.99/month
- [ ] 3-day free trial configured
- [ ] Subscription localization completed
- [ ] App-Specific Shared Secret generated
- [ ] Shared secret added to Supabase as `APPLE_SHARED_SECRET`

**See `APPLE_IAP_SETUP_GUIDE.md` for detailed instructions**

### 5. eBay Integration (OPTIONAL but RECOMMENDED)
- [ ] eBay Developer account created
- [ ] Application created
- [ ] App ID (Client ID) obtained
- [ ] App ID added to Supabase as `EBAY_APP_ID`

**See `EBAY_SETUP_GUIDE.md` for detailed instructions**

### 6. Supabase Configuration
- [ ] Database migrations applied (automatic)
- [ ] RLS policies active and tested
- [ ] Edge functions deployed (automatic)
- [ ] Environment variables configured:
  - `APPLE_SHARED_SECRET` (for subscriptions)
  - `EBAY_APP_ID` (for market analysis)
- [ ] Supabase on paid plan (required for production)

### 7. Testing
- [ ] Sign up flow tested
- [ ] Free trial starts automatically
- [ ] Items can be added to collection
- [ ] Photos upload correctly
- [ ] Marketplace browsing works
- [ ] Messaging functions properly
- [ ] Wishlist matching tested
- [ ] Market analysis shows data (if eBay configured)
- [ ] Subscription paywall appears after trial
- [ ] Purchase flow tested in Sandbox
- [ ] Subscription management works
- [ ] Cancel subscription functions
- [ ] Restore purchases works

### 8. App Store Requirements
- [ ] Privacy policy URL configured
- [ ] Terms of service URL configured
- [ ] App description written
- [ ] Keywords selected
- [ ] Screenshots prepared (iPhone and iPad)
- [ ] App preview video (optional but recommended)
- [ ] Support URL or email provided
- [ ] Demo account credentials for reviewers

## 🏗️ Build Process

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure Build

```bash
eas build:configure
```

This creates `eas.json` with build configuration.

### Step 4: Build for iOS

```bash
# Production build
eas build --platform ios --profile production

# Or for testing
eas build --platform ios --profile development
```

Build typically takes 10-20 minutes.

### Step 5: Submit to TestFlight (Optional but Recommended)

```bash
eas submit --platform ios
```

This uploads your build to TestFlight for beta testing.

### Step 6: Test in TestFlight

- [ ] Install from TestFlight
- [ ] Test all critical flows
- [ ] Verify subscription works in Sandbox
- [ ] Check for crashes or bugs

### Step 7: Submit for App Review

1. Go to App Store Connect
2. Select your app
3. Go to "iOS App" section
4. Click "Prepare for Submission"
5. Fill in all required information:
   - Version number: 1.0.0
   - What's new: Initial release
   - Promotional text (optional)
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Screenshots (required)
6. Add build from TestFlight
7. Complete App Review Information:
   - Demo account username and password
   - Review notes (see template below)
   - Contact information
8. Submit for Review

## 📝 App Review Notes Template

```
MyGlassCase is a collectibles management app with premium subscription features.

SUBSCRIPTION DETAILS:
- Free 3-day trial automatically starts on signup
- Trial converts to $9.99/month subscription if not cancelled
- Users can manage subscription in Settings → Subscription
- Premium features include unlimited items, market analysis, and enhanced matching

DEMO ACCOUNT:
Username: reviewer@myglasscase.com
Password: [provide password]

The demo account has sample data and an active premium subscription for testing all features.

TESTING NOTES:
1. Sign up creates a new account with automatic 3-day trial
2. Market Analysis requires eBay API key (configured in our backend)
3. All payment processing uses Apple's In-App Purchase system
4. Subscription can be cancelled at any time without penalty

Please contact us at [your email] if you have any questions.
```

## 🚨 Common Rejection Reasons and Solutions

### 1. "Subscription terms not clear"
**Solution**: Already implemented
- Paywall shows "3-day free trial" prominently
- Terms explain auto-renewal clearly
- Subscription management accessible in Settings

### 2. "Demo account doesn't work"
**Solution**:
- Create a permanent test account
- Add sample data (10+ items)
- Activate premium subscription manually in database
- Test login before submitting

### 3. "Subscription flow doesn't work"
**Solution**:
- Test entire flow in Sandbox before submission
- Provide clear testing instructions
- Record video of working subscription flow
- Include in review notes

### 4. "App crashes on launch"
**Solution**:
- Test on actual devices, not just simulator
- Check for missing assets
- Review crash logs in TestFlight
- Test with different iOS versions

### 5. "Core features locked behind paywall"
**Solution**: Already implemented
- Free tier allows basic functionality (limited items)
- Premium enhances experience
- Clear value proposition for subscription

## 📱 Post-Launch Checklist

### Immediate (Day 1)
- [ ] Monitor crash reports in App Store Connect
- [ ] Check subscription purchases are processing
- [ ] Verify receipt verification working
- [ ] Review user feedback
- [ ] Monitor Supabase logs for errors

### First Week
- [ ] Track subscription metrics
- [ ] Monitor trial→paid conversion rate
- [ ] Check eBay API usage (if enabled)
- [ ] Respond to user reviews
- [ ] Fix critical bugs immediately

### First Month
- [ ] Analyze user retention
- [ ] Review subscription churn
- [ ] Optimize market analysis accuracy
- [ ] Plan feature updates
- [ ] Consider promotional offers

## 📊 Success Metrics

### Key Performance Indicators
- **Downloads**: Track in App Store Connect
- **Trial Starts**: Query subscriptions table
- **Conversion Rate**: Trial→Paid (target 15-25%)
- **Churn Rate**: Monthly cancellations (target <5%)
- **Average Revenue Per User**: ~$9.99 if subscribed
- **Market Analysis Usage**: Check cache table

### Analytics Queries

```sql
-- Total active users
SELECT COUNT(*) FROM profiles;

-- Active subscriptions
SELECT COUNT(*) FROM subscriptions WHERE status IN ('trial', 'active');

-- Conversion rate
SELECT
  COUNT(CASE WHEN status = 'active' THEN 1 END)::float /
  NULLIF(COUNT(CASE WHEN status IN ('trial', 'expired', 'cancelled') THEN 1 END), 0) * 100
  as conversion_percentage
FROM subscriptions;

-- Market analysis usage (last 30 days)
SELECT COUNT(*) FROM market_analysis_cache
WHERE created_at > now() - interval '30 days';
```

## 🆘 Support Resources

### If You Need Help

**App Store Issues**:
- Apple Developer Support: https://developer.apple.com/support/
- App Store Connect Help: https://help.apple.com/app-store-connect/

**Technical Issues**:
- Expo Documentation: https://docs.expo.dev/
- Supabase Documentation: https://supabase.com/docs
- React Native Documentation: https://reactnative.dev/

**Implementation Questions**:
- Review `APPLE_IAP_SETUP_GUIDE.md`
- Review `EBAY_SETUP_GUIDE.md`
- Review `SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`
- Check edge function logs in Supabase Dashboard
- Review database RLS policies

## 🎯 Final Steps Before Submission

1. **Create All Required Assets** (see ASSETS_NEEDED.md)
2. **Configure Apple Developer Account**
3. **Set Up App Store Connect** (app listing + subscriptions)
4. **Add Environment Variables** to Supabase
5. **Test Complete User Journey** end-to-end
6. **Prepare Review Materials** (demo account, notes, screenshots)
7. **Build with EAS** (`eas build --platform ios`)
8. **Submit to TestFlight** (optional but recommended)
9. **Test in TestFlight** thoroughly
10. **Submit for App Review**

## ⏱️ Timeline Estimate

- **Asset Creation**: 2-4 hours
- **Apple Developer Setup**: 2-3 hours
- **App Store Connect Configuration**: 1-2 hours
- **Supabase Environment Variables**: 15 minutes
- **End-to-End Testing**: 2-3 hours
- **Build Process**: 20-30 minutes
- **TestFlight Testing**: 1-2 days
- **App Review**: 1-3 days (typically 24-48 hours)

**Total Time to Launch**: Approximately 1 week from start to App Store approval

## 🎉 You're Ready!

Everything is implemented and ready for deployment. Just follow this checklist step by step, and your app will be live in the App Store soon!

**Questions?** Review the detailed setup guides:
- `APPLE_IAP_SETUP_GUIDE.md` - Subscription setup
- `EBAY_SETUP_GUIDE.md` - Market analysis setup
- `SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md` - Technical overview
- `APP_STORE_READINESS.md` - General app store preparation

Good luck with your launch! 🚀
