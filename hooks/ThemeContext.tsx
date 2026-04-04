import React, { createContext, useContext, useMemo } from 'react';
import { useTheme, ThemeMode } from './useTheme';
import { Colors } from '../constants/colors';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof Colors.dark;
  weekStart: 0 | 1;
  setWeekStart: (day: 0 | 1) => void;
  baseRate: number;
  setBaseRate: (rate: number) => void;
  overtimeRate: number;
  setOvertimeRate: (rate: number) => void;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  notificationHour: number;
  setNotificationHour: (hour: number) => void;
  preShiftAlarm: boolean;
  setPreShiftAlarm: (enabled: boolean) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: true,
  colors: Colors.dark,
  weekStart: 0,
  setWeekStart: () => {},
  baseRate: 0,
  setBaseRate: () => {},
  overtimeRate: 0,
  setOvertimeRate: () => {},
  currencyCode: 'USD',
  setCurrencyCode: () => {},
  notificationsEnabled: false,
  setNotificationsEnabled: () => {},
  notificationHour: 20,
  setNotificationHour: () => {},
  preShiftAlarm: false,
  setPreShiftAlarm: () => {},
  onboardingComplete: true,
  completeOnboarding: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const value = useMemo(() => theme, [
    theme.themeMode, theme.isDark, theme.colors,
    theme.weekStart, theme.baseRate, theme.overtimeRate,
    theme.currencyCode, theme.notificationsEnabled, theme.notificationHour,
    theme.preShiftAlarm, theme.onboardingComplete,
    theme.setThemeMode, theme.setWeekStart, theme.setBaseRate,
    theme.setOvertimeRate, theme.setCurrencyCode, theme.setNotificationsEnabled,
    theme.setNotificationHour, theme.setPreShiftAlarm, theme.completeOnboarding,
  ]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppSettings() {
  return useContext(ThemeContext);
}
