import { MY_ROTATION, ROTATION_START, ROTATIONS, SHIFTS, WEEK_START } from './config.js';
import { ACCENT, BACKGROUND, MUTED, ON_ACCENT, OUTSIDE, SELECTED, TEXT } from './colors.js';

const DAY_MS = 86400000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UNKNOWN = { label: '?', start: '', end: '', color: '#6B7280', ink: '#FFFFFF' };

/** Today's local date as a day number (days since 1970-01-01). UTC maths keeps DST out of it. */
export function today() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/** Where `day` falls (0-based) in a rotation of `length` days whose first day is `start`. */
export function position(day, start, length) {
  return (((day - start) % length) + length) % length;
}

export function shiftFor(code) {
  return SHIFTS[code] || UNKNOWN;
}

export function findRotation(name) {
  for (let i = 0; i < ROTATIONS.length; i++) {
    if (ROTATIONS[i].name === name) return i;
  }
  return -1;
}

/** 'YYYY-MM-DD' as a day number, or null if it isn't a real date. */
export function parseDate(text) {
  // Checked by hand: the watch's JavaScript engine has no RegExp, and a regex literal stops the page loading.
  const s = String(text);
  if (s.length !== 10 || s.charAt(4) !== '-' || s.charAt(7) !== '-') return null;
  const digits = s.substring(0, 4) + s.substring(5, 7) + s.substring(8, 10);
  for (let i = 0; i < digits.length; i++) {
    const c = digits.charCodeAt(i);
    if (c < 48 || c > 57) return null;
  }
  const year = Number(s.substring(0, 4));
  const month = Number(s.substring(5, 7)) - 1;
  const date = Number(s.substring(8, 10));
  const day = Math.floor(Date.UTC(year, month, date) / DAY_MS);
  const back = new Date(day * DAY_MS);
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month || back.getUTCDate() !== date) return null;
  return day;
}

/** The rotation set in config.js as { rotation, start }, or null if the name or date is wrong. */
export function mySchedule() {
  const rotation = findRotation(MY_ROTATION);
  const start = parseDate(ROTATION_START);
  return rotation < 0 || start === null ? null : { rotation, start };
}

/** 'Tue 21 Oct' */
export function dateLabel(day) {
  const d = new Date(day * DAY_MS);
  return WEEKDAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
}

/** Everything a screen needs to draw one day. `settings` is { rotation: index, start: day }. */
export function describe(day, settings, todayDay) {
  const days = ROTATIONS[settings.rotation].days;
  const code = days[position(day, settings.start, days.length)];
  const shift = shiftFor(code);
  const offset = day - todayDay;
  const d = new Date(day * DAY_MS);
  let title = WEEKDAYS[d.getUTCDay()] + ' ' + d.getUTCDate();
  if (offset === 0) title = 'Today';
  if (offset === 1) title = 'Tomorrow';
  return {
    id: day,
    title,
    code,
    label: shift.label,
    time: shift.start ? shift.start + ' - ' + shift.end : 'Day off',
    color: shift.color,
    ink: shift.ink,
  };
}

/** { year, month (0-11), date } of a day number. */
export function dayParts(day) {
  const d = new Date(day * DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate() };
}

/** The month `delta` months after year/month. */
export function addMonths(year, month, delta) {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: total % 12 };
}

/** Title for the month picker: 'Oct' in the current year, 'Jan 2027' otherwise. */
export function monthLabel(year, month, currentYear) {
  return year === currentYear ? MONTHS[month] : MONTHS[month] + ' ' + year;
}

/** Weekday names for the header, in display order. Weekends are grey, like the watch's calendar. */
export function weekdayHeader() {
  const list = [];
  for (let i = 0; i < 7; i++) {
    const weekday = (WEEK_START + i) % 7;
    list.push({ id: i, label: WEEKDAYS[weekday], color: weekday === 0 || weekday === 6 ? MUTED : TEXT });
  }
  return list;
}

/** The month's grid: 6 weeks of 7 days, starting on WEEK_START. Returns the first day's number. */
export function gridStart(year, month) {
  const first = Math.floor(Date.UTC(year, month, 1) / DAY_MS);
  return first - ((new Date(first * DAY_MS).getUTCDay() - WEEK_START + 7) % 7);
}

// Every day of the rotation gets a circle in its shift's colour, days off included. Days from the
// months either side are plain grey numbers. Today gets an accent ring and a tapped day a green
// ring. Without a rotation it's a plain calendar with today filled in the accent colour.
export function cellState(day, month, settings, todayDay, selectedDay) {
  const parts = dayParts(day);
  const inMonth = parts.month === month;
  const weekday = new Date(day * DAY_MS).getUTCDay();
  const cell = {
    num: String(parts.date),
    bg: BACKGROUND,
    fg: !inMonth ? OUTSIDE : weekday === 0 || weekday === 6 ? MUTED : TEXT,
    ring: BACKGROUND,
    ringWidth: '0px',
  };
  const info = settings && inMonth ? describe(day, settings, todayDay) : null;
  if (info) {
    cell.bg = info.color;
    cell.fg = info.ink;
  }
  if (day === todayDay && inMonth) {
    if (info) {
      cell.ring = ACCENT;
      cell.ringWidth = '4px';
    } else {
      cell.bg = ACCENT;
      cell.fg = ON_ACCENT;
    }
  } else if (day === selectedDay) {
    cell.ring = SELECTED;
    cell.ringWidth = '4px';
  }
  return cell;
}
