import { LEAVE, LEAVE_TYPES, MY_ROTATION, ROTATION_START, ROTATIONS, SHIFTS, WEEK_START } from './config.js';
import { ACCENT, BACKGROUND, MUTED, ON_ACCENT, OUTSIDE, SELECTED, TEXT } from './colors.js';

const DAY_MS = 86400000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UNKNOWN = { label: '?', start: '', end: '', color: '#6B7280', ink: '#FFFFFF' };
// '0'..'31', made once so drawing a month builds no strings.
const NUMBERS = [];
for (let i = 0; i <= 31; i++) NUMBERS.push(String(i));

/** Today's local date as a day number (days since 1970-01-01). UTC maths keeps DST out of it. */
export function today() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/** Day of the week of a day number, 0 = Sunday. 1 January 1970 was a Thursday. */
function weekdayOf(day) {
  return (day + 4) % 7;
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

/** Leave from config.js as { dayNumber: type }, skipping entries with a bad date or type. */
function leaveDays() {
  const days = {};
  for (let i = 0; i < LEAVE.length; i++) {
    const entry = LEAVE[i];
    const from = parseDate(entry.from);
    const to = entry.to ? parseDate(entry.to) : from;
    if (from === null || to === null || !LEAVE_TYPES[entry.type]) continue;
    for (let d = from; d <= to; d++) days[d] = entry.type;
  }
  return days;
}

/** The rotation and leave set in config.js, or null if the rotation's name or date is wrong. */
export function mySchedule() {
  const rotation = findRotation(MY_ROTATION);
  const start = parseDate(ROTATION_START);
  if (rotation < 0 || start === null) return null;
  return { start, days: ROTATIONS[rotation].days, leave: leaveDays() };
}

/** What a day is: its leave type if booked, otherwise its shift. Has `label`, `color` and `ink`. */
function lookOf(day, settings) {
  return LEAVE_TYPES[settings.leave[day]] || shiftFor(settings.days[position(day, settings.start, settings.days.length)]);
}

/** 'Tue 21 Oct' */
export function dateLabel(day) {
  const d = new Date(day * DAY_MS);
  return WEEKDAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
}

/** The pill's text for a day: { title, label, time }. */
export function describe(day, settings, todayDay) {
  const look = lookOf(day, settings);
  const d = new Date(day * DAY_MS);
  let title = WEEKDAYS[d.getUTCDay()] + ' ' + d.getUTCDate();
  if (day === todayDay) title = 'Today';
  else if (day === todayDay + 1) title = 'Tomorrow';
  let time = 'On leave';
  if (!LEAVE_TYPES[settings.leave[day]]) time = look.start ? look.start + ' - ' + look.end : 'Day off';
  return { title, label: look.label, time };
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

/** A month's 6-week grid: its first cell's day number, the month's first and last days, and the
 *  previous month's length (for the grey dates before the 1st). */
export function monthFrame(year, month) {
  const first = Math.floor(Date.UTC(year, month, 1) / DAY_MS);
  const last = Math.floor(Date.UTC(year, month + 1, 1) / DAY_MS) - 1;
  const prevLength = first - Math.floor(Date.UTC(year, month - 1, 1) / DAY_MS);
  return { start: first - ((weekdayOf(first) - WEEK_START + 7) % 7), first, last, prevLength };
}

// Runs 42 times per month change on a slow watch, so it uses integer maths only.
// Every day of the rotation gets a circle in its shift's (or leave's) colour, days off included.
// Dates from the months either side are plain grey numbers. Today gets an accent ring and a tapped
// day a green ring. Without a rotation it's a plain calendar with today filled in the accent colour.
export function cellState(day, frame, settings, todayDay, selectedDay) {
  const inMonth = day >= frame.first && day <= frame.last;
  let date = day - frame.first + 1;
  if (day < frame.first) date = frame.prevLength - (frame.first - day) + 1;
  else if (day > frame.last) date = day - frame.last;
  const weekday = weekdayOf(day);
  const cell = {
    num: NUMBERS[date],
    bg: BACKGROUND,
    fg: !inMonth ? OUTSIDE : weekday === 0 || weekday === 6 ? MUTED : TEXT,
    ring: BACKGROUND,
    ringWidth: '0px',
  };
  if (settings && inMonth) {
    const look = lookOf(day, settings);
    cell.bg = look.color;
    cell.fg = look.ink;
  }
  if (day === todayDay && inMonth) {
    if (settings) {
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
