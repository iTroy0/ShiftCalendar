import React, { createContext, useContext } from 'react';
import { useTheme, ThemeMode } from './useTheme';
import { Colors } from '../constants/colors';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof Colors.dark;
  weekStart: 0 | 1;
  setWeekStart: (day: 0 | 1) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: true,
  colors: Colors.dark,
  weekStart: 1,
  setWeekStart: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
