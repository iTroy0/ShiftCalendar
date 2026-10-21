import { ShiftType, isWorkingShift } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { readableTextColor } from '../utils/color';
import { WeekStart, addDaysToKey, fromDateKey, toDateKey, weekDays, weekIndexOf } from '../utils/dates';
import { TimeFormat, formatTimeRange, formatTime } from '../utils/time';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface WidgetDay {
  key: string;
  letter: string;
  dayNum: string;
  isToday: boolean;
  code: string;
  color: string;
  textColor: string;
}

export interface WidgetModel {
  title: string;
  headline: string;
  detail: string;
  days: WidgetDay[];
}

export interface WidgetInput {
  shifts: Record<string, string>;
  leave: Record<string, string>;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  weekStart: WeekStart;
  timeFormat: TimeFormat;
  calendarName: string;
  now?: Date;
}

export function buildWidgetModel(input: WidgetInput): WidgetModel {
  const now = input.now ?? new Date();
  const todayKey = toDateKey(now);
  const shiftMap = new Map(input.allShifts.map((s) => [s.code, s]));
  const leaveMap = new Map(input.leaveTypes.map((t) => [t.id, t]));

  const describe = (key: string) => {
    const leave = input.leave[key] ? leaveMap.get(input.leave[key]) : undefined;
    if (leave) return { code: leave.code, color: leave.color, label: leave.label, shift: undefined };
    const shift = input.shifts[key] ? shiftMap.get(input.shifts[key]) : undefined;
    if (shift) return { code: shift.code, color: shift.color, label: shift.label, shift };
    return null;
  };

  const days = weekDays(weekIndexOf(now, input.weekStart), input.weekStart).map((key) => {
    const d = fromDateKey(key);
    const info = describe(key);
    return {
      key,
      letter: LETTERS[d.getDay()],
      dayNum: String(d.getDate()),
      isToday: key === todayKey,
      code: info?.code ?? '',
      color: info?.color ?? '',
      textColor: info ? readableTextColor(info.color) : '',
    };
  });

  let headline = 'Nothing scheduled today';
  let detail = '';
  const today = describe(todayKey);
  if (today) {
    headline = `Today · ${today.label}`;
    detail = today.shift && isWorkingShift(today.shift)
      ? formatTimeRange(today.shift.startTime, today.shift.endTime, input.timeFormat)
      : 'Day off';
  }
  // Point to the next working shift so the widget always answers "when do I work next?"
  for (let i = 1; i <= 14; i++) {
    const key = addDaysToKey(todayKey, i);
    const info = describe(key);
    if (info?.shift && isWorkingShift(info.shift)) {
      const when = i === 1 ? 'Tomorrow' : SHORT_DAYS[fromDateKey(key).getDay()];
      const next = `Next: ${info.label} · ${when} ${formatTime(info.shift.startTime, input.timeFormat)}`;
      if (!today || !(today.shift && isWorkingShift(today.shift))) detail = detail ? `${detail} · ${next}` : next;
      break;
    }
  }

  return { title: input.calendarName, headline, detail, days };
}
