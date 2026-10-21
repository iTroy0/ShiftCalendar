import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SettingsProvider, useAppSettings } from '../hooks/SettingsContext';
import { ShiftProvider, useShifts } from '../hooks/ShiftContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Onboarding } from '../components/Onboarding';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler';
import { useBackgroundSync } from '../hooks/useBackgroundSync';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell() {
  const { isDark, colors, loaded, onboardingComplete } = useAppSettings();
  const { loading } = useShifts();
  const ready = loaded && !loading;

  useDeepLinkHandler();
  useBackgroundSync();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    }
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // The native splash stays up until settings and data are loaded, so there's no theme flash.
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {onboardingComplete ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      ) : (
        <Onboarding />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SettingsProvider>
          <ShiftProvider>
            <BottomSheetModalProvider>
              <AppShell />
            </BottomSheetModalProvider>
          </ShiftProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
