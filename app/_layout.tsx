import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider, useAppTheme } from '../hooks/ThemeContext';
import { ShiftProvider } from '../hooks/ShiftContext';

function InnerLayout() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Hide the gesture/navigation bar
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync(colors.background);
    }
  }, [colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ShiftProvider>
        <InnerLayout />
      </ShiftProvider>
    </ThemeProvider>
  );
}
