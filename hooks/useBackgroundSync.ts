import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAppSettings } from './SettingsContext';
import { useShifts } from './ShiftContext';
import { syncNotifications } from '../utils/notifications';
import { refreshWidget } from '../utils/widget';
import { todayKey } from '../utils/dates';

const EMPTY: Record<string, string> = {};

/**
 * Keeps scheduled reminders/alarms and the home-screen widget in step with the user's
 * primary calendar. Runs at the app root so it works no matter which tab is open.
 */
export function useBackgroundSync() {
  const settings = useAppSettings();
  const { loading, calendars, getCalendarData, allShifts, leaveTypes } = useShifts();
  const [day, setDay] = useState(todayKey);

  const primary =
    calendars.find((c) => c.id === settings.primaryCalendarId) ?? calendars.find((c) => c.id === 'default') ?? calendars[0];
  const data = primary ? getCalendarData(primary.id) : undefined;
  const shifts = data?.shifts ?? EMPTY;
  const leave = data?.leave ?? EMPTY;
  const ready = !loading && settings.loaded;
  const {
    notificationsEnabled, notificationHour, preShiftAlarm, alarmLeadMinutes, timeFormat, weekStart, themeMode,
  } = settings;

  // Roll the scheduling window forward when the app returns to the foreground on a new day.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDay(todayKey());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      syncNotifications({
        shifts,
        leave,
        allShifts,
        leaveTypes,
        reminders: notificationsEnabled,
        reminderHour: notificationHour,
        alarms: preShiftAlarm,
        alarmLeadMinutes,
        timeFormat,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [
    ready, shifts, leave, allShifts, leaveTypes, day,
    notificationsEnabled, notificationHour, preShiftAlarm, alarmLeadMinutes, timeFormat,
  ]);

  useEffect(() => {
    if (!ready || !primary) return;
    const timer = setTimeout(() => {
      refreshWidget(
        { shifts, leave, allShifts, leaveTypes, weekStart, timeFormat, calendarName: primary.name },
        themeMode
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [ready, primary, shifts, leave, allShifts, leaveTypes, day, weekStart, timeFormat, themeMode]);
}
