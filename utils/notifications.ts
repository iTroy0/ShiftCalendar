import { Platform } from 'react-native';
import { toDateKey } from './dates';
import { NotificationPlanInput, PlannedNotification, planNotifications } from './notificationPlan';

export type { NotificationPlanInput, PlannedNotification } from './notificationPlan';

type NotificationsModule = typeof import('expo-notifications');

const REMINDER_CHANNEL_ID = 'shift-reminders';
const ALARM_CHANNEL_ID = 'pre-shift-alarm-v2';
const OLD_ALARM_CHANNEL_ID = 'pre-shift-alarm';

let cached: NotificationsModule | null | undefined;

// Loaded lazily so the app keeps working where the native module is unavailable (web, Expo Go).
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') return (cached = null);
  try {
    const mod: NotificationsModule = require('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cached = mod;
  } catch {
    cached = null;
  }
  return cached;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

async function ensureChannels(N: NotificationsModule, alarms: boolean) {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Shift reminders',
    description: 'Evening reminder about tomorrow’s shift',
    importance: N.AndroidImportance.DEFAULT,
  });
  if (!alarms) return;
  // Android won't update the sound of an existing channel, so the old one is removed.
  await N.deleteNotificationChannelAsync(OLD_ALARM_CHANNEL_ID).catch(() => {});
  await N.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Pre-shift alarm',
    description: 'Alarm before your shift starts',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    sound: 'alarm.mp3',
  });
}

async function schedule(N: NotificationsModule, item: PlannedNotification) {
  const isAlarm = item.kind === 'alarm';
  await N.scheduleNotificationAsync({
    identifier: item.id,
    content: {
      title: item.title,
      body: item.body,
      data: { date: item.dayKey },
      ...(isAlarm ? { sound: 'alarm.mp3', priority: N.AndroidNotificationPriority.MAX } : {}),
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: item.trigger,
      channelId: isAlarm ? ALARM_CHANNEL_ID : REMINDER_CHANNEL_ID,
    },
  });
}

async function cancelScheduled(N: NotificationsModule) {
  const scheduled = await N.getAllScheduledNotificationsAsync();
  // Keep a pending test notification; everything else (including untagged ones from older versions) goes.
  await Promise.all(
    scheduled
      .filter((n) => !n.identifier.startsWith('sc-test-'))
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier))
  );
}

async function runSync(input: NotificationPlanInput) {
  const N = getNotifications();
  if (!N) return;
  await cancelScheduled(N);
  if (!input.reminders && !input.alarms) return;
  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') return;
  await ensureChannels(N, input.alarms);
  for (const item of planNotifications(input)) {
    await schedule(N, item);
  }
}

let queue: Promise<void> = Promise.resolve();

/**
 * Replaces all scheduled notifications with a fresh plan. Calls are serialized so overlapping
 * syncs can never interleave their cancel/schedule steps and leave duplicates behind.
 */
export function syncNotifications(input: NotificationPlanInput): Promise<void> {
  queue = queue.then(() => runSync(input)).catch((e) => console.warn('Notification sync failed', e));
  return queue;
}

/** Fires a sample reminder or alarm a few seconds from now so users can check sound and permissions. */
export async function sendTestNotification(kind: 'reminder' | 'alarm'): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  if (!(await requestNotificationPermissions())) return false;
  await ensureChannels(N, kind === 'alarm');
  await schedule(N, {
    id: `sc-test-${kind}`,
    kind,
    trigger: new Date(Date.now() + 5000),
    dayKey: toDateKey(new Date()),
    title: kind === 'alarm' ? '⏰ Test alarm' : 'Test reminder',
    body: kind === 'alarm' ? 'This is how your pre-shift alarm will sound.' : 'Shift reminders are working.',
  });
  return true;
}
