import { format, addDays, startOfDay } from 'date-fns';
import { ShiftType } from '../constants/shifts';

// Lazy-load expo-notifications to avoid crashing in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
      Notifications!.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      return null;
    }
  }
  return Notifications;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleShiftReminder(
  shiftData: Record<string, string>,
  allShifts: ShiftType[],
  notificationHour: number,
) {
  const N = await getNotifications();
  if (!N) return;

  await N.cancelAllScheduledNotificationsAsync();

  const today = startOfDay(new Date());

  for (let i = 0; i < 14; i++) {
    const targetDate = addDays(today, i + 1);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const code = shiftData[dateStr];
    if (!code) continue;

    const shift = allShifts.find((s) => s.code === code);
    if (!shift) continue;

    const triggerDate = addDays(today, i);
    triggerDate.setHours(notificationHour, 0, 0, 0);

    if (triggerDate <= new Date()) continue;

    const body = shift.startTime
      ? `${shift.label} shift at ${shift.startTime}`
      : `${shift.label} - Day Off`;

    await N.scheduleNotificationAsync({
      content: {
        title: `Tomorrow: ${shift.label}`,
        body,
        data: { date: dateStr },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function cancelAllReminders() {
  const N = await getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
