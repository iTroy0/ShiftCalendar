import { ShiftType, isWorkingShift } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { addDaysToKey, fromDateKey, toDateKey } from './dates';
import { TimeFormat, formatTime, formatTimeRangeShort } from './time';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface UpcomingInfo {
  today: { label: string; color: string; detail: string; working: boolean } | null;
  next: { label: string; color: string; when: string; time: string } | null;
}

export interface UpcomingInput {
  shifts: Record<string, string>;
  leave: Record<string, string>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  getLeaveType: (id: string) => LeaveType | undefined;
  timeFormat: TimeFormat;
  now?: Date;
  lookahead?: number;
}

/** Today's assignment and the next working shift after today. */
export function getUpcoming(input: UpcomingInput): UpcomingInfo {
  const todayKey = toDateKey(input.now ?? new Date());
  let today: UpcomingInfo['today'] = null;

  const leave = input.leave[todayKey] ? input.getLeaveType(input.leave[todayKey]) : undefined;
  const shift = input.shifts[todayKey] ? input.getShiftByCode(input.shifts[todayKey]) : undefined;
  if (leave) {
    today = { label: leave.label, color: leave.color, detail: '', working: false };
  } else if (shift) {
    const working = isWorkingShift(shift);
    today = {
      label: shift.label,
      color: shift.color,
      detail: working ? formatTimeRangeShort(shift.startTime, shift.endTime, input.timeFormat) : 'Day off',
      working,
    };
  }

  let next: UpcomingInfo['next'] = null;
  for (let i = 1; i <= (input.lookahead ?? 30); i++) {
    const key = addDaysToKey(todayKey, i);
    if (input.leave[key]) continue;
    const s = input.shifts[key] ? input.getShiftByCode(input.shifts[key]) : undefined;
    if (s && isWorkingShift(s)) {
      const d = fromDateKey(key);
      next = {
        label: s.label,
        color: s.color,
        when: i === 1 ? 'Tomorrow' : `${SHORT_DAYS[d.getDay()]} ${d.getDate()}`,
        time: formatTime(s.startTime, input.timeFormat),
      };
      break;
    }
  }
  return { today, next };
}
