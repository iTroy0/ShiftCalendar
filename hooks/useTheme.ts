import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { DEFAULT_CURRENCY } from '../constants/currencies';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme_mode';
const WEEK_START_KEY = 'week_start';
const BASE_RATE_KEY = 'base_rate';
const OT_RATE_KEY = 'overtime_rate';
const NOTIF_ENABLED_KEY = 'notif_enabled';
const NOTIF_HOUR_KEY = 'notif_hour';
const CURRENCY_KEY = 'currency_code';
const PRE_SHIFT_ALARM_KEY = 'pre_shift_alarm';
const ONBOARDING_KEY = 'onboarding_complete';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [weekStart, setWeekStartState] = useState<0 | 1>(0);
  const [baseRate, setBaseRateState] = useState(0);
  const [overtimeRate, setOvertimeRateState] = useState(0);
  const [notificationsEnabled, setNotifEnabledState] = useState(false);
  const [notificationHour, setNotifHourState] = useState(20); // 8 PM default
  const [preShiftAlarm, setPreShiftAlarmState] = useState(false);
  const [currencyCode, setCurrencyCodeState] = useState(DEFAULT_CURRENCY);
  const [onboardingComplete, setOnboardingCompleteState] = useState(true); // default true to not flash

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(WEEK_START_KEY),
      AsyncStorage.getItem(BASE_RATE_KEY),
      AsyncStorage.getItem(OT_RATE_KEY),
      AsyncStorage.getItem(NOTIF_ENABLED_KEY),
      AsyncStorage.getItem(NOTIF_HOUR_KEY),
      AsyncStorage.getItem(PRE_SHIFT_ALARM_KEY),
      AsyncStorage.getItem(CURRENCY_KEY),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]).then(([theme, week, base, rate, notif, notifHr, preAlarm, currency, onboard]) => {
      if (theme === 'light' || theme === 'dark' || theme === 'system') setThemeModeState(theme);
      if (week === '0' || week === '1') setWeekStartState(Number(week) as 0 | 1);
      if (base) setBaseRateState(parseFloat(base) || 0);
      if (rate) setOvertimeRateState(parseFloat(rate) || 0);
      if (notif === 'true') setNotifEnabledState(true);
      if (notifHr) setNotifHourState(parseInt(notifHr, 10) || 20);
      if (preAlarm === 'true') setPreShiftAlarmState(true);
      if (currency) setCurrencyCodeState(currency);
      if (onboard === null) setOnboardingCompleteState(false); // first launch
    }).catch(console.error);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(console.error);
  }, []);

  const setWeekStart = useCallback((day: 0 | 1) => {
    setWeekStartState(day);
    AsyncStorage.setItem(WEEK_START_KEY, String(day)).catch(console.error);
  }, []);

  const setBaseRate = useCallback((rate: number) => {
    setBaseRateState(rate);
    AsyncStorage.setItem(BASE_RATE_KEY, String(rate)).catch(console.error);
  }, []);

  const setOvertimeRate = useCallback((rate: number) => {
    setOvertimeRateState(rate);
    AsyncStorage.setItem(OT_RATE_KEY, String(rate)).catch(console.error);
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setNotifEnabledState(enabled);
    AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled)).catch(console.error);
  }, []);

  const setNotificationHour = useCallback((hour: number) => {
    setNotifHourState(hour);
    AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour)).catch(console.error);
  }, []);

  const setPreShiftAlarm = useCallback((enabled: boolean) => {
    setPreShiftAlarmState(enabled);
    AsyncStorage.setItem(PRE_SHIFT_ALARM_KEY, String(enabled)).catch(console.error);
  }, []);

  const setCurrencyCode = useCallback((code: string) => {
    setCurrencyCodeState(code);
    AsyncStorage.setItem(CURRENCY_KEY, code).catch(console.error);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleteState(true);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(console.error);
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = isDark ? Colors.dark : Colors.light;

  return {
    themeMode, setThemeMode,
    isDark, colors,
    weekStart, setWeekStart,
    baseRate, setBaseRate,
    overtimeRate, setOvertimeRate,
    currencyCode, setCurrencyCode,
    notificationsEnabled, setNotificationsEnabled,
    notificationHour, setNotificationHour,
    preShiftAlarm, setPreShiftAlarm,
    onboardingComplete, completeOnboarding,
  };
}
