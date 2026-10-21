import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ThemeColors } from '../constants/colors';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import { STANDARD_WORK_HOURS } from '../constants/leaveTypes';
import { WeekStart } from '../utils/dates';
import { TimeFormat } from '../utils/time';
import { setHapticsEnabled } from '../utils/haptics';
import { runMigrations } from '../utils/migrations';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  themeMode: ThemeMode;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
  baseRate: number;
  overtimeRate: number;
  paidLeaveHours: number;
  currencyCode: string;
  notificationsEnabled: boolean;
  notificationHour: number;
  preShiftAlarm: boolean;
  alarmLeadMinutes: number;
  primaryCalendarId: string;
  hapticsEnabled: boolean;
  showShiftTimes: boolean;
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  weekStart: 0,
  timeFormat: '24h',
  baseRate: 0,
  overtimeRate: 0,
  paidLeaveHours: STANDARD_WORK_HOURS,
  currencyCode: DEFAULT_CURRENCY,
  notificationsEnabled: false,
  notificationHour: 20,
  preShiftAlarm: false,
  alarmLeadMinutes: 60,
  primaryCalendarId: 'default',
  hapticsEnabled: true,
  showShiftTimes: true,
  onboardingComplete: false,
};

/** Storage keys (the older ones are unchanged so existing preferences carry over). */
export const SETTINGS_KEYS: Record<keyof Settings, string> = {
  themeMode: 'theme_mode',
  weekStart: 'week_start',
  timeFormat: 'time_format',
  baseRate: 'base_rate',
  overtimeRate: 'overtime_rate',
  paidLeaveHours: 'paid_leave_hours',
  currencyCode: 'currency_code',
  notificationsEnabled: 'notif_enabled',
  notificationHour: 'notif_hour',
  preShiftAlarm: 'pre_shift_alarm',
  alarmLeadMinutes: 'alarm_lead_minutes',
  primaryCalendarId: 'primary_calendar',
  hapticsEnabled: 'haptics_enabled',
  showShiftTimes: 'show_shift_times',
  onboardingComplete: 'onboarding_complete',
};

function parseNumber(raw: string, min: number, max: number, fallback: number) {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function parseSettings(raw: Map<string, string | null>): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  const get = (k: keyof Settings) => raw.get(SETTINGS_KEYS[k]) ?? null;

  const theme = get('themeMode');
  if (theme === 'light' || theme === 'dark' || theme === 'system') s.themeMode = theme;
  const week = get('weekStart');
  if (week === '0' || week === '1' || week === '6') s.weekStart = Number(week) as WeekStart;
  const tf = get('timeFormat');
  if (tf === '12h' || tf === '24h') s.timeFormat = tf;
  const base = get('baseRate');
  if (base) s.baseRate = parseNumber(base, 0, 1e7, 0);
  const ot = get('overtimeRate');
  if (ot) s.overtimeRate = parseNumber(ot, 0, 1e7, 0);
  const leaveHours = get('paidLeaveHours');
  if (leaveHours) s.paidLeaveHours = parseNumber(leaveHours, 0, 24, STANDARD_WORK_HOURS);
  const currency = get('currencyCode');
  if (currency) s.currencyCode = currency;
  s.notificationsEnabled = get('notificationsEnabled') === 'true';
  const hour = get('notificationHour');
  if (hour) s.notificationHour = Math.round(parseNumber(hour, 0, 23, 20));
  s.preShiftAlarm = get('preShiftAlarm') === 'true';
  const lead = get('alarmLeadMinutes');
  if (lead) s.alarmLeadMinutes = Math.round(parseNumber(lead, 5, 720, 60));
  const primary = get('primaryCalendarId');
  if (primary) s.primaryCalendarId = primary;
  s.hapticsEnabled = get('hapticsEnabled') !== 'false';
  s.showShiftTimes = get('showShiftTimes') !== 'false';
  // Any stored value (older versions wrote 'true') means onboarding was seen.
  s.onboardingComplete = get('onboardingComplete') !== null;
  return s;
}

export function useSettings() {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const settingsRef = useRef(settings);

  const reloadSettings = useCallback(async () => {
    try {
      await runMigrations();
      const keys = Object.values(SETTINGS_KEYS);
      const pairs = await AsyncStorage.multiGet(keys);
      const next = parseSettings(new Map(pairs));
      settingsRef.current = next;
      setSettings(next);
      setHapticsEnabled(next.hapticsEnabled);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (settingsRef.current[key] === value) return;
    const next = { ...settingsRef.current, [key]: value };
    settingsRef.current = next;
    setSettings(next);
    if (key === 'hapticsEnabled') setHapticsEnabled(value as boolean);
    AsyncStorage.setItem(SETTINGS_KEYS[key], String(value)).catch(console.error);
  }, []);

  const completeOnboarding = useCallback(() => updateSetting('onboardingComplete', true), [updateSetting]);

  const isDark = settings.themeMode === 'system' ? systemScheme !== 'light' : settings.themeMode === 'dark';
  const colors: ThemeColors = isDark ? Colors.dark : Colors.light;

  return useMemo(
    () => ({ ...settings, loaded, isDark, colors, updateSetting, completeOnboarding, reloadSettings }),
    [settings, loaded, isDark, colors, updateSetting, completeOnboarding, reloadSettings]
  );
}

export type SettingsApi = ReturnType<typeof useSettings>;
