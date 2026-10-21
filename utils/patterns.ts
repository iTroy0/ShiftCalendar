import { addMonths, subDays } from 'date-fns';
import { ShiftType, isWorkingShift } from '../constants/shifts';
import { TemplateSlot } from '../constants/templates';
import { parseHHMM } from './time';
import { addDaysToKey, daysBetweenKeys, fromDateKey, lastDayKeyOfMonth, toDateKey } from './dates';

export type SlotMapping = Record<TemplateSlot, string | null>;

function startMinutes(shift: ShiftType): number {
  const t = parseHHMM(shift.startTime);
  return t ? t[0] * 60 + t[1] : 0;
}

function isNightish(shift: ShiftType) {
  const start = startMinutes(shift);
  return start >= 19 * 60 || start < 4 * 60;
}

function isMorningish(shift: ShiftType) {
  const start = startMinutes(shift);
  return start >= 4 * 60 && start < 11 * 60;
}

function isAfternoonish(shift: ShiftType) {
  const start = startMinutes(shift);
  return start >= 11 * 60 && start < 19 * 60;
}

/**
 * Maps template slots (M/A/N/O) to the user's own shift codes. Exact code matches win;
 * otherwise shifts are matched by their start time so renamed or custom shifts still work.
 */
export function defaultSlotMapping(allShifts: ShiftType[]): SlotMapping {
  const working = allShifts.filter(isWorkingShift).sort((a, b) => startMinutes(a) - startMinutes(b));
  const offTypes = allShifts.filter((s) => !isWorkingShift(s));
  const exact = (code: string) => allShifts.find((s) => s.code === code);
  const exactWorking = (code: string) => {
    const s = exact(code);
    return s && isWorkingShift(s) ? s.code : undefined;
  };

  const m = exactWorking('M') ?? (working.find(isMorningish) ?? working.find((s) => !isNightish(s)) ?? working[0])?.code;
  const n = exactWorking('N') ?? (working.find(isNightish) ?? working[working.length - 1])?.code;
  const a =
    exactWorking('A') ??
    (working.find(isAfternoonish) ?? working.find((s) => s.code !== m && s.code !== n) ?? working.find((s) => s.code === m))?.code;
  const offExact = exact('O');
  const o = offExact && !isWorkingShift(offExact) ? offExact.code : offTypes[0]?.code;

  return { M: m ?? null, A: a ?? null, N: n ?? null, O: o ?? null };
}

export type DurationOption = 'month' | '3m' | '6m' | '12m';

export const DURATION_OPTIONS: DurationOption[] = ['month', '3m', '6m', '12m'];

/** Last day (inclusive) covered when filling from `startKey` for the chosen duration. */
export function durationEndKey(startKey: string, option: DurationOption): string {
  const start = fromDateKey(startKey);
  if (option === 'month') return lastDayKeyOfMonth(start.getFullYear(), start.getMonth());
  const months = option === '3m' ? 3 : option === '6m' ? 6 : 12;
  return toDateKey(subDays(addMonths(start, months), 1));
}

/**
 * Entries produced by laying a template from `startKey` through `endKey`.
 * Days with leave are left untouched; slots mapped to null are skipped.
 */
export function buildTemplateEntries(
  pattern: TemplateSlot[],
  mapping: SlotMapping,
  startKey: string,
  endKey: string,
  leaveData: Record<string, string>,
): { entries: Record<string, string>; keptLeave: number } {
  const entries: Record<string, string> = {};
  let keptLeave = 0;
  const total = daysBetweenKeys(startKey, endKey) + 1;
  for (let i = 0; i < total; i++) {
    const key = addDaysToKey(startKey, i);
    if (leaveData[key]) {
      keptLeave++;
      continue;
    }
    const code = mapping[pattern[i % pattern.length]];
    if (code) entries[key] = code;
  }
  return { entries, keptLeave };
}

/**
 * Entries produced by repeating `pattern` (one item per day, `null` = no shift) starting the
 * day after `patternEndKey` through `endKey`. Blank pattern days clear the target day; leave is kept.
 */
export function buildRepeatEntries(
  pattern: (string | null)[],
  patternEndKey: string,
  endKey: string,
  leaveData: Record<string, string>,
): { entries: Record<string, string | null>; keptLeave: number } {
  const entries: Record<string, string | null> = {};
  let keptLeave = 0;
  const startKey = addDaysToKey(patternEndKey, 1);
  const total = daysBetweenKeys(startKey, endKey) + 1;
  for (let i = 0; i < total; i++) {
    const key = addDaysToKey(startKey, i);
    if (leaveData[key]) {
      keptLeave++;
      continue;
    }
    entries[key] = pattern[i % pattern.length] ?? null;
  }
  return { entries, keptLeave };
}
