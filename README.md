# MyGlassCase - Collectibles Management App

A modern, cross-platform mobile application for collectors to catalog, value, and trade antiques or collectibles. Built with Expo and React Native.

## Features

- **User Authentication** - Secure sign up and login with Supabase
- **Collection Management** - Add, edit, and organize your collectibles
- **Item Details** - View detailed information, timeline, and analytics
- **Exchange Marketplace** - Browse and list items for sale
- **Messaging** - Chat with buyers and sellers (Ably integration ready)
- **Wishlist** - Track items you want to add to your collection
- **Settings** - Manage your profile and preferences

## Tech Stack

- **Expo SDK 54** - Cross-platform mobile development
- **React Native** - Native mobile UI components
- **TypeScript** - Type-safe development
- **Supabase** - Authentication, database, and real-time features
- **Ably** - Real-time messaging (ready for integration)
- **Expo Router** - File-based navigation
- **Lucide React Native** - Modern icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo Go app on your mobile device (for testing)

### Installation

1. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Scan the QR code with Expo Go (iOS) or the Expo Go app (Android)

## Project Structure

```
├── app/                    # Application screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation screens
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth, etc.)
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── constants/             # App constants and theme
```

## Screens

### Authentication
- **Login** - Sign in with email and password
- **Sign Up** - Create a new account

### Main Tabs
- **Home** - Dashboard with collection statistics
- **Collection** - Grid view of your collectibles with filters
- **Exchange** - Marketplace for buying and selling
- **Messages** - Chat with other collectors
- **Wishlist** - Items you want to acquire
- **Settings** - Account and app preferences

## Database Schema

See `DATABASE_SETUP.md` for the complete database schema and setup instructions.

Main tables:
- `profiles` - User profiles
- `collectibles` - Items in collections/wishlists
- `item_timeline` - Event history for items
- `conversations` - Chat conversations
- `messages` - Individual messages

## Environment Variables

Required environment variables (in `.env`):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Design System

The app follows a clean, modern design with:
- **Primary Color**: Green (#38a169) - Used for main actions and branding
- **Accent Colors**: Blue, Pink, Yellow - Used for different item states
- **Typography**: System fonts with clear hierarchy
- **Spacing**: 8px grid system
- **Shadows**: Subtle elevation for cards and modals

## Features in Development

The following features are ready for integration:

1. **Image Upload** - Camera and gallery integration with Expo Image Picker
2. **Add/Edit Items** - Form to create and modify collectibles
3. **Real-time Messaging** - Ably integration for live chat
4. **Market Analysis** - Price trends and valuation tools
5. **Notifications** - Push notifications for messages and sales

## Building for Production

### iOS
```bash
npm run build:ios
```

### Android
```bash
npm run build:android
```

## Testing

Run TypeScript type checking:
```bash
npm run typecheck
```

## Contributing

This is a private project. For issues or feature requests, please contact the development team.

## License

Proprietary - All rights reserved
