import { ShiftType, getShiftHours } from '../constants/shifts';
import { LeaveType, STANDARD_WORK_HOURS } from '../constants/leaveTypes';
import { ShiftData, OvertimeData, LeaveData } from '../hooks/useShiftData';
import { getDaysInMonth } from 'date-fns';

export interface MonthlyStats {
  counts: Record<string, number>;
  workingDays: number;
  regularHours: number;
  overtimeHours: number;
  overtimeDays: number;
  totalHours: number;
  totalDays: number;
  assignedDays: number;
  basePay: number;
  overtimeEarnings: number;
  totalPay: number;
}

export function computeMonthlyStats(
  shiftData: ShiftData,
  overtimeData: OvertimeData,
  leaveData: LeaveData,
  leaveTypes: LeaveType[],
  monthKey: string,
  currentMonth: Date,
  allShifts: ShiftType[],
  baseRate: number,
  overtimeRate: number,
): MonthlyStats {
  const counts: Record<string, number> = {};
  allShifts.forEach((s) => (counts[s.code] = 0));

  let overtimeHours = 0;
  let overtimeDays = 0;
  let regularHours = 0;
  let paidLeaveDays = 0;

  Object.entries(shiftData).forEach(([date, code]) => {
    if (date.startsWith(monthKey)) {
      counts[code] = (counts[code] || 0) + 1;
      const shift = allShifts.find((s) => s.code === code);
      if (shift) {
        regularHours += getShiftHours(shift);
      }
    }
  });

  Object.entries(leaveData).forEach(([date, typeId]) => {
    if (date.startsWith(monthKey)) {
      const lt = leaveTypes.find((t) => t.id === typeId);
      if (lt?.paid) {
        paidLeaveDays++;
        regularHours += STANDARD_WORK_HOURS;
      }
    }
  });

  Object.entries(overtimeData).forEach(([date, hours]) => {
    if (date.startsWith(monthKey) && hours > 0) {
      overtimeHours += hours;
      overtimeDays++;
    }
  });

  const offCodes = allShifts.filter((s) => !s.startTime).map((s) => s.code);
  const workingDays = Object.entries(counts)
    .filter(([code]) => !offCodes.includes(code))
    .reduce((sum, [, count]) => sum + count, 0) + paidLeaveDays;
  const totalHours = regularHours + overtimeHours;
  const totalDays = getDaysInMonth(currentMonth);
  const assignedDays = Object.values(counts).reduce((s, c) => s + c, 0);
  const basePay = baseRate > 0 ? regularHours * baseRate : 0;
  const overtimeEarnings = overtimeRate > 0 ? overtimeHours * overtimeRate : 0;
  const totalPay = basePay + overtimeEarnings;

  return {
    counts, workingDays,
    regularHours: Math.round(regularHours * 10) / 10,
    overtimeHours, overtimeDays,
    totalHours: Math.round(totalHours * 10) / 10,
    totalDays, assignedDays,
    basePay: Math.round(basePay * 100) / 100,
    overtimeEarnings: Math.round(overtimeEarnings * 100) / 100,
    totalPay: Math.round(totalPay * 100) / 100,
  };
}
