import React, { useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useAppSettings } from '../hooks/ThemeContext';
import { ShiftProvider, useShifts } from '../hooks/ShiftContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Onboarding } from '../components/Onboarding';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark, colors, onboardingComplete, completeOnboarding } = useAppSettings();
  const { loading, allShifts, setShiftsBulk, setNote, setOvertime } = useShifts();

  useDeepLinkHandler({ loading, allShifts, setShiftsBulk, setNote, setOvertime });

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
