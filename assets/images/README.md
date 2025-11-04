# MyGlassCase App Assets

This directory contains the required assets for the MyGlassCase mobile application.

## Required Assets

### App Icon
- **File**: `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Main app icon for iOS and Android

### Adaptive Icon (Android)
- **File**: `adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground layer
- **Note**: The icon should be centered and use only the safe zone (middle 66%)

### Splash Screen
- **File**: `splash.png`
- **Size**: 2048x2048 pixels (or larger)
- **Format**: PNG
- **Usage**: Splash screen shown during app launch
- **Background**: White (#ffffff)

### Notification Icon (Android)
- **File**: `notification-icon.png`
- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Usage**: Icon shown in notification tray on Android
- **Note**: Should be a simple, monochrome icon

### Favicon (Web)
- **File**: `favicon.png`
- **Size**: 48x48 pixels (or 32x32)
- **Format**: PNG or ICO
- **Usage**: Browser tab icon for web version

## Design Guidelines

### Color Scheme
- **Primary Color**: Green (#38a169)
- **Background**: White (#ffffff)
- **Text**: Dark gray (#2d3748)

### Icon Design
- Use the MyGlassCase branding
- Should be recognizable at small sizes
- Avoid fine details that won't be visible when scaled down
- Use transparent backgrounds where appropriate
- Follow iOS and Android design guidelines

### Best Practices
1. Test icons on both light and dark backgrounds
2. Ensure icons are crisp and clear at all sizes
3. Use vector graphics when possible for scalability
4. Export at the highest required resolution
5. Optimize file sizes without losing quality

## Creating Assets

You can create these assets using:
- **Adobe Illustrator/Photoshop**: Professional design tools
- **Figma**: Free online design tool
- **Canva**: Simple online design tool
- **GIMP**: Free open-source image editor
- **Inkscape**: Free vector graphics editor

## App Store Requirements

### iOS App Store
- Icon must not include transparency
- Icon must not include rounded corners (iOS adds them)
- Must be high resolution and crisp

### Google Play Store
- Adaptive icon required for Android 8.0+
- Full-bleed icon for older Android versions
- Icon must be high quality and follow Material Design guidelines

## Placeholder Notice

The current setup references these asset files, but they need to be created and added to this directory before building the app for production.

For development, you can use placeholder images, but for app store submission, professional-quality assets are required.
