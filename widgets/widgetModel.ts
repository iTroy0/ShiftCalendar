import { ShiftType, isWorkingShift, shiftCode, shiftName } from '../constants/shifts';
import { LeaveType, leaveCode } from '../constants/leaveTypes';
import { readableTextColor } from '../utils/color';
import { WeekStart, addDaysToKey, fromDateKey, toDateKey, weekDays, weekIndexOf } from '../utils/dates';
import { TimeFormat, formatTimeRange, formatTime } from '../utils/time';
import { t, weekdayName } from '../i18n';

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
    if (leave) return { code: leaveCode(leave), color: leave.color, label: t(leave.label), shift: undefined };
    const shift = input.shifts[key] ? shiftMap.get(input.shifts[key]) : undefined;
    if (shift) return { code: shiftCode(shift), color: shift.color, label: shiftName(shift), shift };
    return null;
  };

  const days = weekDays(weekIndexOf(now, input.weekStart), input.weekStart).map((key) => {
    const d = fromDateKey(key);
    const info = describe(key);
    return {
      key,
      letter: weekdayName(d.getDay(), 'narrow'),
      dayNum: String(d.getDate()),
      isToday: key === todayKey,
      code: info?.code ?? '',
      color: info?.color ?? '',
      textColor: info ? readableTextColor(info.color) : '',
    };
  });

  let headline = t('Nothing scheduled today');
  let detail = '';
  const today = describe(todayKey);
  if (today) {
    headline = t('Today · {shift}', { shift: today.label });
    detail = today.shift && isWorkingShift(today.shift)
      ? formatTimeRange(today.shift.startTime, today.shift.endTime, input.timeFormat)
      : t('Day off');
  }
  // Point to the next working shift so the widget always answers "when do I work next?"
  for (let i = 1; i <= 14; i++) {
    const key = addDaysToKey(todayKey, i);
    const info = describe(key);
    if (info?.shift && isWorkingShift(info.shift)) {
      const when = i === 1 ? t('Tomorrow') : weekdayName(fromDateKey(key).getDay(), 'abbreviated');
      const next = t('Next: {shift} · {when} {time}', {
        shift: info.label,
        when,
        time: formatTime(info.shift.startTime, input.timeFormat),
      });
      if (!today || !(today.shift && isWorkingShift(today.shift))) detail = detail ? `${detail} · ${next}` : next;
      break;
    }
  }

  return { title: input.calendarName, headline, detail, days };
}
