import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme_mode';
const WEEK_START_KEY = 'week_start';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [weekStart, setWeekStartState] = useState<0 | 1>(1); // 0=Sunday, 1=Monday

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemeModeState(val);
      }
    });
    AsyncStorage.getItem(WEEK_START_KEY).then((val) => {
      if (val === '0' || val === '1') {
        setWeekStartState(Number(val) as 0 | 1);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(console.error);
  }, []);

  const setWeekStart = useCallback((day: 0 | 1) => {
    setWeekStartState(day);
    AsyncStorage.setItem(WEEK_START_KEY, String(day)).catch(console.error);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = isDark ? Colors.dark : Colors.light;

  return { themeMode, setThemeMode, isDark, colors, weekStart, setWeekStart };
}
