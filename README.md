# ShiftCalendar

A modern, offline-first shift scheduling app for shift workers. Track morning, afternoon, night, and off shifts on a clean monthly calendar. Built with React Native + Expo.

## Features

- **Monthly Calendar** — Color-coded shift badges on each day with smooth swipe navigation
- **Quick Assign** — Tap any day to assign a shift from a bottom sheet
- **Repeat Patterns** — Select a date range and apply a repeating shift pattern
- **Custom Shifts** — Create your own shift types with custom names, colors, icons, and times
- **Multi-Calendar** — Manage separate calendars (e.g. My Shifts, Team A, Team B)
- **Stats Dashboard** — Monthly breakdown of shift counts, working days, hours, and overtime
- **Overtime Tracking** — Log overtime hours per day with automatic totals
- **Day Notes** — Add notes to any day
- **Modern Time Picker** — Scroll-wheel style hour/minute picker for shift times
- **Dark / Light / System Theme** — Full dark mode support
- **Configurable Week Start** — Sunday or Monday
- **Haptic Feedback** — Tactile response on interactions
- **Offline & Private** — All data stored locally via AsyncStorage. No account, no server, no tracking.

## Screenshots

<p align="center">
  <img src="screenshots/calendar.png" width="250" alt="Calendar" />
  <img src="screenshots/stats.png" width="250" alt="Stats" />
  <img src="screenshots/settings.png" width="250" alt="Settings" />
</p>

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone (for development)

### Installation

```bash
git clone https://github.com/iTroy0/ShiftCalendar.git
cd ShiftCalendar
npm install
```

### Development

```bash
# Start the Expo dev server
npx expo start

# Run on Android (with Expo Go or dev client)
npx expo start --android

# Run on iOS
npx expo start --ios
```

## Building

### Cloud Build (EAS)

No local SDK required. Builds compile on Expo's servers.

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Preview APK (testing / internal distribution)
eas build --platform android --profile preview

# Production APK
eas build --platform android --profile production

# iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

EAS provides a download link when the build completes.

### Local Build

Requires [Android SDK](https://developer.android.com/studio) for Android or [Xcode](https://developer.apple.com/xcode/) for iOS.

```bash
# 1. Generate native project
npx expo prebuild --platform android

# 2. Create local.properties (Android only)
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 3. Build
cd android

# Debug APK
./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Alternatively, use EAS for local builds:

```bash
eas build --platform android --profile preview --local
```

### Build Profiles

Configured in [`eas.json`](eas.json):

| Profile      | Output | Use Case                    |
|-------------|--------|-----------------------------|
| `preview`    | APK    | Testing on physical devices |
| `production` | APK    | Release builds              |

## Project Structure

```
ShiftCalendar/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   └── (tabs)/
│       ├── index.tsx         # Calendar screen
│       ├── stats.tsx         # Stats screen
│       └── settings.tsx      # Settings screen
├── components/
│   ├── CalendarDay.tsx       # Individual day cell
│   ├── CalendarSwitcher.tsx  # Multi-calendar tabs
│   ├── DaySheet.tsx          # Day edit bottom sheet
│   ├── MonthHeader.tsx       # Month navigation header
│   ├── RepeatSheet.tsx       # Pattern repeat bottom sheet
│   ├── ShiftButton.tsx       # Shift selector button
│   ├── ShiftEditor.tsx       # Create/edit shift form
│   ├── TimePicker.tsx        # Scroll-wheel time picker
│   └── Toast.tsx             # Notification toast
├── hooks/
│   ├── ShiftContext.tsx       # Shift data React context
│   ├── ThemeContext.tsx       # Theme React context
│   ├── useShiftData.ts       # Data persistence logic
│   └── useTheme.ts           # Theme preferences
├── constants/
│   ├── shifts.ts             # Shift definitions & defaults
│   └── colors.ts             # Color palettes
└── assets/                   # App icons & splash
```

## Tech Stack

- **Framework** — React Native + Expo SDK 55
- **Language** — TypeScript
- **Routing** — expo-router (file-based)
- **Calendar** — react-native-calendars
- **Animations** — react-native-reanimated
- **Gestures** — react-native-gesture-handler
- **Bottom Sheets** — @gorhom/bottom-sheet
- **Storage** — @react-native-async-storage/async-storage
- **Haptics** — expo-haptics

## License

MIT

## Author

Made by **Troy**
