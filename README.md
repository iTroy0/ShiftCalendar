# ShiftCalendar

A clean, minimal Work Shift Calendar app built with React Native + Expo. Track and plan your work shifts (Morning, Afternoon, Night, OFF) on a monthly calendar.

## Features

- Monthly calendar view with colored shift badges
- Tap any day to assign a shift (Morning / Afternoon / Night / OFF)
- Swipe or tap arrows to navigate between months
- Repeat patterns across date ranges
- Multi-calendar support (My Shifts, A, B)
- Stats screen with monthly breakdown and estimated hours
- Shift distribution charts
- Overtime tracking (hours and days)
- Notes per day
- Light / Dark / System theme support
- Configurable week start (Sunday or Monday)
- Haptic feedback
- Data persists across app restarts via AsyncStorage

## Setup

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

## Building the App

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login
```

### Online Build (EAS Cloud)

Builds are compiled on Expo's servers. No local Android SDK or Xcode needed.

```bash
# Build a preview APK (for testing / internal distribution)
eas build --platform android --profile preview

# Build a production APK
eas build --platform android --profile production

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

After the build completes, EAS provides a download link. For Android, you get an `.apk` file you can install directly on your device.

### Local Build

Builds are compiled on your machine. Requires Android SDK (for Android) or Xcode (for iOS).

```bash
# Generate the native android project
npx expo prebuild --platform android

# Build a debug APK locally
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Build a release APK locally
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Or use EAS local builds (handles prebuild automatically)
eas build --platform android --profile preview --local
eas build --platform android --profile production --local
```

For iOS local builds:
```bash
npx expo prebuild --platform ios
cd ios && xcodebuild -workspace ShiftCalendar.xcworkspace -scheme ShiftCalendar -configuration Release
```

### Build Profiles

Build profiles are configured in `eas.json`:

| Profile      | Type | Distribution | Use Case                     |
|-------------|------|-------------|------------------------------|
| `preview`    | APK  | Internal    | Testing on physical devices  |
| `production` | APK  | Public      | Release builds               |

## Tech Stack

- React Native + Expo (SDK 55)
- TypeScript
- expo-router (file-based routing)
- react-native-calendars
- react-native-reanimated
- react-native-gesture-handler
- @gorhom/bottom-sheet
- react-native-paper
- AsyncStorage

## Developer

Made by **Troy**
