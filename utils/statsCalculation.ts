import { ShiftType, getShiftHours, isWorkingShift } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { daysBetweenKeys, lastDayKeyOfMonth, toDateKey } from './dates';

export interface StatsInput {
  shifts: Record<string, string>;
  overtime: Record<string, number>;
  leave: Record<string, string>;
  notes?: Record<string, string>;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  baseRate: number;
  overtimeRate: number;
  paidLeaveHours: number;
  fromKey: string;
  toKey: string;
}

export interface PeriodStats {
  counts: Record<string, number>;
  hoursByCode: Record<string, number>;
  leaveCounts: Record<string, number>;
  workingDays: number;
  offDays: number;
  leaveDays: number;
  paidLeaveDays: number;
  shiftHours: number;
  paidLeaveHours: number;
  regularHours: number;
  overtimeHours: number;
  overtimeDays: number;
  totalHours: number;
  totalDays: number;
  assignedDays: number;
  notesCount: number;
  basePay: number;
  overtimeEarnings: number;
  totalPay: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function monthRange(year: number, month: number) {
  return { fromKey: toDateKey(new Date(year, month, 1)), toKey: lastDayKeyOfMonth(year, month) };
}

export function yearRange(year: number) {
  return { fromKey: `${year}-01-01`, toKey: `${year}-12-31` };
}

/** Totals for an inclusive date range. Codes of deleted shift types are ignored. */
export function computeStats(input: StatsInput): PeriodStats {
  const { fromKey, toKey } = input;
  const inRange = (key: string) => key >= fromKey && key <= toKey;
  const shiftMap = new Map(input.allShifts.map((s) => [s.code, s]));
  const leaveMap = new Map(input.leaveTypes.map((t) => [t.id, t]));

  const counts: Record<string, number> = {};
  const hoursByCode: Record<string, number> = {};
  const leaveCounts: Record<string, number> = {};
  for (const s of input.allShifts) {
    counts[s.code] = 0;
    hoursByCode[s.code] = 0;
  }
  for (const t of input.leaveTypes) leaveCounts[t.id] = 0;

  let workingDays = 0;
  let offDays = 0;
  let shiftHours = 0;
  const assigned = new Set<string>();

  for (const [key, code] of Object.entries(input.shifts)) {
    if (!inRange(key)) continue;
    const shift = shiftMap.get(code);
    if (!shift || input.leave[key]) continue;
    counts[code]++;
    assigned.add(key);
    if (isWorkingShift(shift)) {
      const h = getShiftHours(shift);
      workingDays++;
      shiftHours += h;
      hoursByCode[code] += h;
    } else {
      offDays++;
    }
  }

  let leaveDays = 0;
  let paidLeaveDays = 0;
  for (const [key, id] of Object.entries(input.leave)) {
    if (!inRange(key)) continue;
    const type = leaveMap.get(id);
    if (!type) continue;
    leaveCounts[id]++;
    leaveDays++;
    assigned.add(key);
    if (type.paid) paidLeaveDays++;
  }

  let overtimeHours = 0;
  let overtimeDays = 0;
  for (const [key, hours] of Object.entries(input.overtime)) {
    if (!inRange(key) || !(hours > 0)) continue;
    overtimeHours += hours;
    overtimeDays++;
  }

  const notesCount = Object.keys(input.notes ?? {}).filter(inRange).length;
  const paidLeaveHours = paidLeaveDays * input.paidLeaveHours;
  const regularHours = shiftHours + paidLeaveHours;
  const basePay = input.baseRate > 0 ? regularHours * input.baseRate : 0;
  const overtimeEarnings = input.overtimeRate > 0 ? overtimeHours * input.overtimeRate : 0;

  for (const code of Object.keys(hoursByCode)) hoursByCode[code] = round1(hoursByCode[code]);

  return {
    counts,
    hoursByCode,
    leaveCounts,
    workingDays,
    offDays,
    leaveDays,
    paidLeaveDays,
    shiftHours: round1(shiftHours),
    paidLeaveHours: round1(paidLeaveHours),
    regularHours: round1(regularHours),
    overtimeHours: round1(overtimeHours),
    overtimeDays,
    totalHours: round1(regularHours + overtimeHours),
    totalDays: daysBetweenKeys(fromKey, toKey) + 1,
    assignedDays: assigned.size,
    notesCount,
    basePay: round2(basePay),
    overtimeEarnings: round2(overtimeEarnings),
    totalPay: round2(basePay + overtimeEarnings),
  };
}

/** Leave days used per type within a calendar year. */
export function leaveUsedInYear(leave: Record<string, string>, year: number): Record<string, number> {
  const prefix = `${year}-`;
  const used: Record<string, number> = {};
  for (const [key, id] of Object.entries(leave)) {
    if (key.startsWith(prefix)) used[id] = (used[id] || 0) + 1;
  }
  return used;
}
