import { ShiftType, isWorkingShift, getShiftHours, shiftName } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { TimeFormat, formatTime, formatTimeRange, formatHours, formatMinutesAsDuration, parseHHMM } from './time';
import { addDaysToKey, fromDateKey, toDateKey } from './dates';
import { t } from '../i18n';

export const HORIZON_DAYS = 14;

export interface NotificationPlanInput {
  shifts: Record<string, string>;
  leave: Record<string, string>;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  reminders: boolean;
  reminderHour: number;
  alarms: boolean;
  alarmLeadMinutes: number;
  timeFormat: TimeFormat;
  now?: Date;
  days?: number;
}

export interface PlannedNotification {
  id: string;
  kind: 'reminder' | 'alarm';
  trigger: Date;
  dayKey: string;
  title: string;
  body: string;
}

/** Pure scheduling plan: which notifications should exist for the coming days. */
export function planNotifications(input: NotificationPlanInput): PlannedNotification[] {
  const now = input.now ?? new Date();
  const days = input.days ?? HORIZON_DAYS;
  const todayKey = toDateKey(now);
  const shiftMap = new Map(input.allShifts.map((s) => [s.code, s]));
  const leaveMap = new Map(input.leaveTypes.map((t) => [t.id, t]));
  const plan: PlannedNotification[] = [];

  for (let i = 0; i <= days; i++) {
    const dayKey = addDaysToKey(todayKey, i);
    const day = fromDateKey(dayKey);
    const shift = input.shifts[dayKey] ? shiftMap.get(input.shifts[dayKey]) : undefined;
    const leave = input.leave[dayKey] ? leaveMap.get(input.leave[dayKey]) : undefined;

    if (input.reminders && (shift || leave)) {
      const trigger = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1, input.reminderHour, 0, 0, 0);
      if (trigger > now) {
        let title: string;
        let body: string;
        if (leave) {
          title = t('Tomorrow: {shift}', { shift: t(leave.label) });
          body = t('Enjoy your time off.');
        } else if (shift && isWorkingShift(shift)) {
          title = t('Tomorrow: {shift}', { shift: shiftName(shift) });
          body = `${formatTimeRange(shift.startTime, shift.endTime, input.timeFormat)} · ${formatHours(getShiftHours(shift))}`;
        } else {
          title = t('Tomorrow: {shift}', { shift: shiftName(shift!) });
          body = t('Day off — enjoy it!');
        }
        plan.push({ id: `sc-reminder-${dayKey}`, kind: 'reminder', trigger, dayKey, title, body });
      }
    }

    if (input.alarms && shift && isWorkingShift(shift)) {
      const [h, m] = parseHHMM(shift.startTime)!;
      // Date normalizes negative minutes, so early shifts alarm on the previous evening.
      const trigger = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m - input.alarmLeadMinutes, 0, 0);
      if (trigger > now) {
        plan.push({
          id: `sc-alarm-${dayKey}`,
          kind: 'alarm',
          trigger,
          dayKey,
          title: t('⏰ {shift} in {duration}', { shift: shiftName(shift), duration: formatMinutesAsDuration(input.alarmLeadMinutes) }),
          body: t('Your {shift} shift starts at {time} — time to get ready!', {
            shift: shiftName(shift),
            time: formatTime(shift.startTime, input.timeFormat),
          }),
        });
      }
    }
  }
  return plan.sort((a, b) => a.trigger.getTime() - b.trigger.getTime());
}
