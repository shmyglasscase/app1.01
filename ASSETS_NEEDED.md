# Required Assets for App Store Submission

Before submitting MyGlassCase to the Apple App Store and Google Play Store, you need to create the following assets and place them in the `assets/images/` directory.

## Critical Assets (App Won't Build Without These)

### 1. App Icon - `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with no transparency for iOS (Android supports transparency)
- **Purpose**: Main application icon
- **Requirements**:
  - Must be square
  - iOS adds rounded corners automatically (don't include them)
  - Should be recognizable at small sizes (down to 20x20)
  - High resolution and crisp
  - Use your brand colors (primary: #38a169 green)

### 2. Adaptive Icon - `adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Android adaptive icon foreground
- **Requirements**:
  - Center your icon in the safe zone (middle 66% of the canvas)
  - Outer 33% may be cropped on some devices
  - Background color is white (#ffffff) as configured
  - Must work on both light and dark backgrounds

### 3. Splash Screen - `splash.png`
- **Size**: 2048x2048 pixels (or larger)
- **Format**: PNG
- **Purpose**: Displayed while app is loading
- **Requirements**:
  - White background (#ffffff)
  - Center your logo/branding
  - Keep important content in the center
  - Will be cropped to fit various screen ratios

### 4. Notification Icon - `notification-icon.png`
- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Purpose**: Android notification tray icon
- **Requirements**:
  - Simple, flat, monochrome icon
  - White icon on transparent background
  - Android will colorize it to #38a169 (configured)
  - Avoid fine details

### 5. Favicon - `favicon.png`
- **Size**: 48x48 pixels
- **Format**: PNG or ICO
- **Purpose**: Web browser tab icon
- **Requirements**:
  - Simple version of your icon
  - Must be recognizable at tiny size
  - Square format

## App Store Listing Assets (Create These for Submission)

### iOS App Store Screenshots
Required for various device sizes:
- **iPhone 6.7"** (1290x2796 pixels) - iPhone 15 Pro Max
- **iPhone 6.5"** (1242x2688 pixels) - iPhone 11 Pro Max, XS Max
- **iPhone 5.5"** (1242x2208 pixels) - iPhone 8 Plus
- **iPad Pro 12.9"** (2048x2732 pixels)

### Google Play Store Screenshots
Required:
- **Phone** - At least 2 screenshots (1080x1920 to 1080x2400 pixels)
- **7-inch Tablet** - Optional but recommended
- **10-inch Tablet** - Optional but recommended

### Feature Graphic (Google Play)
- **Size**: 1024x500 pixels
- **Format**: PNG or JPEG
- **Purpose**: Featured prominently in the Play Store
- **Requirements**:
  - Landscape orientation
  - Showcase your app's best features
  - Include app name/logo
  - High quality and professional

## Design Guidelines

### Brand Colors
- **Primary**: #38a169 (Green) - Main brand color
- **Background**: #ffffff (White)
- **Text**: #2d3748 (Dark Gray)
- **Accent**: Use complementary colors from your current design

### Icon Design Tips
1. **Keep it simple**: Icons should be recognizable even at 20x20 pixels
2. **Avoid text**: Text becomes unreadable at small sizes
3. **Use solid shapes**: Better visibility than outlines
4. **Test on backgrounds**: View on both light and dark backgrounds
5. **Be unique**: Stand out from competitors while staying professional

### Creating Your Assets

#### Recommended Tools
- **Professional**: Adobe Illustrator, Photoshop, Sketch, Figma
- **Free**: Canva, GIMP, Inkscape
- **Icon Generators**: MakeAppIcon.com, AppIcon.co

#### Quick Start Template
For a simple icon, you could:
1. Create a 1024x1024 canvas
2. Add a rounded square (iOS style) in your primary green (#38a169)
3. Place a white glass/case icon or "MGC" text in the center
4. Export at various sizes as needed

## File Placement

Place all assets in: `/assets/images/`

```
assets/
└── images/
    ├── icon.png              (1024x1024)
    ├── adaptive-icon.png     (1024x1024)
    ├── splash.png            (2048x2048)
    ├── notification-icon.png (96x96)
    └── favicon.png           (48x48)
```

## Next Steps After Adding Assets

1. **Verify Assets**: Make sure all files are in place and properly named
2. **Test Build**: Run `npm run build:ios` and `npm run build:android`
3. **Preview**: Check how icons look on actual devices using Expo Go
4. **Iterate**: Adjust colors, sizing, or design as needed
5. **Submit**: Once satisfied, proceed with app store submission

## Current Status

⚠️ **Assets are currently missing!** The app.json file references these assets, but they don't exist yet. You must create and add them before building for production.

For now, you can test the app in Expo Go without these assets, but production builds will fail without them.

## Questions?

If you need help creating these assets, consider:
- Hiring a designer on Fiverr, Upwork, or 99designs
- Using app icon generator services
- Creating simple placeholders for testing (but not for production!)
