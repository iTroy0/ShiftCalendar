import React, { useEffect, useCallback, useRef } from 'react';
import { Platform, View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { ThemeProvider, useAppTheme } from '../hooks/ThemeContext';
import { ShiftProvider, useShifts } from '../hooks/ShiftContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Onboarding } from '../components/Onboarding';
import { parseCSVContent, restoreBackupFromContent } from '../utils/exportImport';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark, colors, onboardingComplete, completeOnboarding } = useAppTheme();
  const { loading, allShifts, setShiftsBulk, setNote, setOvertime } = useShifts();
  const handledUrl = useRef<string | null>(null);

  // --- Handle incoming file URLs (deep links from "Open with") ---
  const handleIncomingURL = useCallback(async (url: string) => {
    if (!url) return;
    // Skip if we already handled this exact URL
    if (handledUrl.current === url) return;
    handledUrl.current = url;

    // Only handle file/content URIs
    if (!url.startsWith('file://') && !url.startsWith('content://')) return;

    try {
      const content = await readAsStringAsync(url);

      // Try JSON backup first
      try {
        const parsed = JSON.parse(content);
        if (parsed.data && typeof parsed.data === 'object' && parsed.version) {
          Alert.alert(
            'Restore Backup',
            'This looks like a ShiftCalendar backup. Restore all data from this file?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Restore',
                onPress: async () => {
                  try {
                    const result = await restoreBackupFromContent(content);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Restore Complete', `Restored ${result.keyCount} entries. Please restart the app for changes to take effect.`);
                  } catch (e: any) {
                    Alert.alert('Restore Failed', e.message || 'Invalid backup file');
                  }
                },
              },
            ]
          );
          return;
        }
      } catch {
        // Not valid JSON — try CSV below
      }

      // Try CSV import
      const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
      if (lines.length >= 2 && lines[0].toLowerCase().includes('date')) {
        const result = parseCSVContent(content, allShifts);
        if (result && result.rowCount > 0) {
          Alert.alert(
            'Import CSV',
            `Found ${result.rowCount} rows of shift data. Import into the active calendar?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Import',
                onPress: () => {
                  if (Object.keys(result.shiftEntries).length > 0) setShiftsBulk(result.shiftEntries);
                  Object.entries(result.noteEntries).forEach(([date, note]) => setNote(date, note));
                  Object.entries(result.overtimeEntries).forEach(([date, hours]) => setOvertime(date, hours));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Done', `Imported ${result.rowCount} days into the active calendar.`);
                },
              },
            ]
          );
          return;
        }
      }

      // Unrecognized file
      Alert.alert('Unknown File', 'This file does not appear to be a ShiftCalendar CSV or backup file.');
    } catch (e: any) {
      console.error('Failed to process incoming file:', e);
      Alert.alert('Error', 'Could not read the file. It may be in an unsupported format.');
    }
  }, [allShifts, setShiftsBulk, setNote, setOvertime]);

  useEffect(() => {
    if (loading) return; // Wait until data is loaded before handling URLs

    // Handle initial URL (app was cold-launched from a file)
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingURL(url);
    });

    // Handle URL while app is already running
    const sub = Linking.addEventListener('url', (event) => {
      handleIncomingURL(event.url);
    });

    return () => sub.remove();
  }, [loading, handleIncomingURL]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync(colors.background);
    }
  }, [colors.background]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={[splashStyles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[splashStyles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[splashStyles.iconText, { color: colors.primary }]}>SC</Text>
        </View>
        <Text style={[splashStyles.title, { color: colors.text }]}>ShiftCalendar</Text>
        <ActivityIndicator size="small" color={colors.primary} style={splashStyles.spinner} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Onboarding onComplete={completeOnboarding} colors={colors} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  spinner: {
    marginTop: 24,
  },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ShiftProvider>
          <InnerLayout />
        </ShiftProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
