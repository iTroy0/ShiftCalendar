/**
 * Date helpers that work purely with local calendar dates.
 * Day keys are `yyyy-MM-dd` strings, the format used throughout storage.
 */

export type WeekStart = 0 | 1 | 6; // Sunday, Monday, Saturday

const DAY_MS = 86400000;

function pad(n: number) {
  return n < 10 ? '0' + n : String(n);
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = fromDateKey(value);
  return toDateKey(d) === value;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Whole days since 1970-01-01 for a local calendar date (DST-safe). */
export function dayNumber(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

function fromDayNumber(n: number): Date {
  const u = new Date(n * DAY_MS);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
}

export function addDaysToKey(key: string, days: number): string {
  return toDateKey(fromDayNumber(dayNumber(fromDateKey(key)) + days));
}

export function daysBetweenKeys(fromKey: string, toKey: string): number {
  return dayNumber(fromDateKey(toKey)) - dayNumber(fromDateKey(fromKey));
}

/** Inclusive list of day keys from `startKey` to `endKey`. */
export function eachDayKey(startKey: string, endKey: string): string[] {
  const start = dayNumber(fromDateKey(startKey));
  const end = dayNumber(fromDateKey(endKey));
  const out: string[] = [];
  for (let n = start; n <= end; n++) out.push(toDateKey(fromDayNumber(n)));
  return out;
}

export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Absolute month index (year * 12 + month) — handy for paging. */
export function monthIndexOf(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

export function monthFromIndex(index: number): Date {
  return new Date(Math.floor(index / 12), ((index % 12) + 12) % 12, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function lastDayKeyOfMonth(year: number, month: number): string {
  return toDateKey(new Date(year, month, daysInMonth(year, month)));
}

/** Weekday numbers (0 = Sunday) in display order for the given week start. */
export function weekdayOrder(weekStart: WeekStart): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
}

export interface GridDay {
  key: string;
  day: number;
  inMonth: boolean;
  weekday: number;
}

/** Rows of 7 days covering the month, including leading/trailing days of adjacent months. */
export function buildMonthGrid(year: number, month: number, weekStart: WeekStart): GridDay[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStart + 7) % 7;
  const total = daysInMonth(year, month);
  const rowCount = Math.ceil((lead + total) / 7);
  const startNum = dayNumber(first) - lead;
  const rows: GridDay[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: GridDay[] = [];
    for (let c = 0; c < 7; c++) {
      const date = fromDayNumber(startNum + r * 7 + c);
      row.push({
        key: toDateKey(date),
        day: date.getDate(),
        inMonth: date.getMonth() === month && date.getFullYear() === year,
        weekday: date.getDay(),
      });
    }
    rows.push(row);
  }
  return rows;
}

function weekShift(weekStart: WeekStart) {
  // 1970-01-01 was a Thursday (weekday 4).
  return (((weekStart - 4) % 7) + 7) % 7;
}

/** Absolute index of the week containing `d`, with weeks beginning on `weekStart`. */
export function weekIndexOf(d: Date, weekStart: WeekStart): number {
  return Math.floor((dayNumber(d) - weekShift(weekStart)) / 7);
}

export function weekStartFromIndex(index: number, weekStart: WeekStart): Date {
  return fromDayNumber(index * 7 + weekShift(weekStart));
}

export function weekDays(index: number, weekStart: WeekStart): string[] {
  const start = dayNumber(weekStartFromIndex(index, weekStart));
  return Array.from({ length: 7 }, (_, i) => toDateKey(fromDayNumber(start + i)));
}
