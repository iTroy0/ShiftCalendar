import { format, addDays, startOfDay, set } from 'date-fns';
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

    const triggerDate = set(addDays(today, i), { hours: notificationHour, minutes: 0, seconds: 0, milliseconds: 0 });

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

const ALARM_CHANNEL_ID = 'pre-shift-alarm';

async function ensureAlarmChannel() {
  const N = await getNotifications();
  if (!N) return;

  const Platform = require('react-native').Platform;
  if (Platform.OS !== 'android') return;

  await N.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Pre-Shift Alarm',
    description: 'Alarm 1 hour before your shift starts',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    sound: 'alarm.mp3',
  });
}

export async function schedulePreShiftAlarms(
  shiftData: Record<string, string>,
  allShifts: ShiftType[],
) {
  const N = await getNotifications();
  if (!N) return;

  await ensureAlarmChannel();

  const today = startOfDay(new Date());

  for (let i = 0; i < 14; i++) {
    const targetDate = addDays(today, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const code = shiftData[dateStr];
    if (!code) continue;

    const shift = allShifts.find((s) => s.code === code);
    if (!shift || !shift.startTime) continue;

    const [hours, minutes] = shift.startTime.split(':').map(Number);
    // 1 hour before shift start
    let alarmHour = hours - 1;
    let alarmMin = minutes;
    if (alarmHour < 0) alarmHour = 23;

    const triggerDate = set(targetDate, { hours: alarmHour, minutes: alarmMin, seconds: 0, milliseconds: 0 });
    if (triggerDate <= new Date()) continue;

    await N.scheduleNotificationAsync({
      content: {
        title: `⏰ ${shift.label} in 1 hour`,
        body: `Your ${shift.label} shift starts at ${shift.startTime} — time to get ready!`,
        data: { date: dateStr },
        sound: 'alarm.mp3',
        priority: N.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: ALARM_CHANNEL_ID,
      },
    });
  }
}

export async function cancelAllReminders() {
  const N = await getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
