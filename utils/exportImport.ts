import { File, Paths } from 'expo-file-system';
import {
  readAsStringAsync,
  writeAsStringAsync,
  EncodingType,
  StorageAccessFramework,
} from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ShiftType, isWorkingShift } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { formatMoney } from '../constants/currencies';
import { SETTINGS_KEYS } from '../hooks/useSettings';
import { buildCSV } from './csvFormat';
import { rerunMigrations } from './migrations';
import { readableTextColor, withAlpha } from './color';
import { WeekStart, buildMonthGrid, weekdayOrder } from './dates';
import { computeStats, monthRange } from './statsCalculation';
import { TimeFormat, formatTimeCompact, formatTimeRange, formatHours } from './time';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface ExportData {
  shifts: Record<string, string>;
  notes: Record<string, string>;
  overtime: Record<string, number>;
  leave: Record<string, string>;
}

export interface ExportOptions {
  year: number;
  month: number | null; // null = whole year
  data: ExportData;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  calendarName: string;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
  baseRate: number;
  overtimeRate: number;
  paidLeaveHours: number;
  currencyCode: string;
}

// ---------- DELIVERY ----------

function safeFileName(name: string) {
  return name.replace(/[^\w\-. ]+/g, '').trim().replace(/\s+/g, '_') || 'ShiftCalendar';
}

function cacheFile(fileName: string): File {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  return file;
}

type Delivery = 'share' | 'save' | 'cancel';

function askDelivery(fileName: string): Promise<Delivery> {
  return new Promise((resolve) => {
    Alert.alert(
      'Export ready',
      fileName,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Share', onPress: () => resolve('share') },
        { text: 'Save to device', onPress: () => resolve('save') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') }
    );
  });
}

/** Lets the user share the file or save it to a folder (Android); iOS uses the share sheet, which includes Files. */
async function deliverFile(file: File, fileName: string, mimeType: string, uti: string): Promise<boolean> {
  if (Platform.OS !== 'android') {
    await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: fileName });
    return true;
  }
  const choice = await askDelivery(fileName);
  if (choice === 'cancel') return false;
  if (choice === 'share') {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName });
    return true;
  }
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) return false;
  const isBinary = mimeType === 'application/pdf';
  const encoding = isBinary ? EncodingType.Base64 : EncodingType.UTF8;
  const destUri = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, mimeType);
  const content = await readAsStringAsync(file.uri, { encoding });
  await writeAsStringAsync(destUri, content, { encoding });
  return true;
}

function periodLabel(year: number, month: number | null) {
  return month !== null ? `${MONTH_NAMES[month]} ${year}` : `${year}`;
}

function periodRange(year: number, month: number | null) {
  return month !== null ? monthRange(year, month) : { fromKey: `${year}-01-01`, toKey: `${year}-12-31` };
}

// ---------- CSV EXPORT & IMPORT ----------

export { parseCSVContent, describeImport } from './csvFormat';
export type { ImportResult } from './csvFormat';

export async function exportCSV(opts: ExportOptions): Promise<boolean> {
  const label = opts.month !== null ? format(new Date(opts.year, opts.month), 'MMM') : 'Year';
  const fileName = `${safeFileName(opts.calendarName)}_${label}_${opts.year}.csv`;
  const { fromKey, toKey } = periodRange(opts.year, opts.month);
  const file = cacheFile(fileName);
  file.write(buildCSV(opts.data, opts.allShifts, opts.leaveTypes, fromKey, toKey));
  return deliverFile(file, fileName, 'text/csv', 'public.comma-separated-values-text');
}

export async function pickTextFile(types: string[]): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.length) return null;
  return new File(picked.assets[0].uri).text();
}

export function pickCSVFile() {
  return pickTextFile(['text/csv', 'text/comma-separated-values', 'text/plain', 'application/octet-stream']);
}

// ---------- PDF EXPORT ----------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function monthSection(opts: ExportOptions, month: number, isLast: boolean): string {
  const { year, data } = opts;
  const shiftMap = new Map(opts.allShifts.map((s) => [s.code, s]));
  const leaveMap = new Map(opts.leaveTypes.map((t) => [t.id, t]));
  const stats = computeStats({
    ...data,
    allShifts: opts.allShifts,
    leaveTypes: opts.leaveTypes,
    baseRate: opts.baseRate,
    overtimeRate: opts.overtimeRate,
    paidLeaveHours: opts.paidLeaveHours,
    ...monthRange(year, month),
  });

  const head = weekdayOrder(opts.weekStart)
    .map((d) => `<th>${DAY_NAMES[d].slice(0, 3)}</th>`)
    .join('');

  const notes: string[] = [];
  const body = buildMonthGrid(year, month, opts.weekStart)
    .map((row) => {
      const cells = row.map((day) => {
        if (!day.inMonth) return `<td class="out"><div class="num">${day.day}</div></td>`;
        const shift = data.shifts[day.key] ? shiftMap.get(data.shifts[day.key]) : undefined;
        const leave = data.leave[day.key] ? leaveMap.get(data.leave[day.key]) : undefined;
        const item = leave ?? shift;
        const ot = data.overtime[day.key];
        const note = data.notes[day.key];
        if (note) notes.push(`<tr><td class="nd">${MONTH_NAMES[month].slice(0, 3)} ${day.day}</td><td>${escapeHtml(note).replace(/\n/g, '<br>')}</td></tr>`);
        const bg = item ? withAlpha(item.color, 0.1) : '#F9FAFB';
        const pill = item
          ? `<div class="pill" style="background:${item.color};color:${readableTextColor(item.color)}">${escapeHtml(item.code)}</div>`
          : '';
        const time = !leave && shift && isWorkingShift(shift)
          ? `<div class="time">${formatTimeCompact(shift.startTime, opts.timeFormat)}–${formatTimeCompact(shift.endTime, opts.timeFormat)}</div>`
          : item ? `<div class="time">${escapeHtml(item.label)}</div>` : '';
        const marks = [
          ot ? `<span class="ot">+${ot}h</span>` : '',
          note ? '<span class="nt">●</span>' : '',
        ].join(' ');
        return `<td style="background:${bg}"><div class="num">${day.day}</div>${pill}${time}<div class="marks">${marks}</div></td>`;
      });
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');

  const chips = [
    ['Worked', `${stats.workingDays} days`],
    ['Hours', formatHours(stats.totalHours)],
    stats.overtimeHours > 0 ? ['Overtime', `+${formatHours(stats.overtimeHours)}`] : null,
    stats.leaveDays > 0 ? ['Leave', `${stats.leaveDays} days`] : null,
    stats.totalPay > 0 ? ['Est. pay', formatMoney(stats.totalPay, opts.currencyCode)] : null,
  ]
    .filter(Boolean)
    .map((c) => `<div class="chip"><div class="cl">${c![0]}</div><div class="cv">${escapeHtml(c![1])}</div></div>`)
    .join('');

  const legend = opts.allShifts
    .filter((s) => stats.counts[s.code] > 0)
    .map((s) => {
      const detail = isWorkingShift(s) ? ` · ${escapeHtml(formatTimeRange(s.startTime, s.endTime, opts.timeFormat))}` : '';
      return `<span class="lg"><span class="sw" style="background:${s.color}"></span>${escapeHtml(s.label)} ×${stats.counts[s.code]}${detail}</span>`;
    })
    .concat(
      opts.leaveTypes
        .filter((t) => stats.leaveCounts[t.id] > 0)
        .map((t) => `<span class="lg"><span class="sw" style="background:${t.color}"></span>${escapeHtml(t.label)} ×${stats.leaveCounts[t.id]}</span>`)
    )
    .join('');

  return `
  <section class="month${isLast ? '' : ' brk'}">
    <h2>${MONTH_NAMES[month]} ${year}</h2>
    <div class="chips">${chips}</div>
    <table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    ${legend ? `<div class="legend">${legend}</div>` : ''}
    ${notes.length ? `<h3>Notes</h3><table class="notes"><tbody>${notes.join('')}</tbody></table>` : ''}
  </section>`;
}

export function buildPDFHtml(opts: ExportOptions): string {
  const months = opts.month !== null ? [opts.month] : Array.from({ length: 12 }, (_, i) => i);
  const sections = months.map((m, i) => monthSection(opts, m, i === months.length - 1)).join('');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Segoe UI', sans-serif; color: #1f2937; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #6366F1; padding-bottom: 8px; margin-bottom: 14px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 2px 0 0; color: #6b7280; font-size: 13px; }
  .header .meta { text-align: right; color: #9ca3af; font-size: 11px; }
  .brk { page-break-after: always; }
  h2 { font-size: 18px; margin: 0 0 8px; }
  h3 { font-size: 13px; color: #6366F1; margin: 14px 0 6px; }
  .chips { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  .chip { background: #f3f4f6; border-radius: 8px; padding: 5px 10px; }
  .cl { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; }
  .cv { font-size: 14px; font-weight: 800; }
  table.grid { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 3px; }
  .grid th { font-size: 9px; color: #6b7280; text-transform: uppercase; padding: 2px 0; font-weight: 700; }
  .grid td { height: 76px; vertical-align: top; border-radius: 6px; padding: 4px; }
  .grid td.out { background: transparent; color: #d1d5db; }
  .num { font-size: 11px; font-weight: 700; }
  .pill { margin-top: 3px; border-radius: 5px; padding: 3px 2px; font-size: 11px; font-weight: 800; text-align: center; }
  .time { font-size: 8.5px; color: #4b5563; text-align: center; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .marks { font-size: 9px; margin-top: 1px; text-align: center; }
  .ot { color: #dc2626; font-weight: 800; }
  .nt { color: #d97706; }
  .legend { margin-top: 8px; font-size: 10px; color: #374151; }
  .lg { display: inline-block; margin: 0 10px 4px 0; }
  .sw { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; }
  table.notes { width: 100%; border-collapse: collapse; font-size: 11px; }
  .notes td { border-bottom: 1px solid #f3f4f6; padding: 4px 6px; vertical-align: top; }
  .notes td.nd { width: 64px; color: #6366F1; font-weight: 700; white-space: nowrap; }
</style></head>
<body>
  <div class="header">
    <div><h1>${escapeHtml(opts.calendarName)}</h1><p>${periodLabel(opts.year, opts.month)}</p></div>
    <div class="meta">ShiftCalendar<br>Generated ${format(new Date(), 'MMM d, yyyy')}</div>
  </div>
  ${sections}
</body></html>`;
}

export async function exportPDF(opts: ExportOptions): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html: buildPDFHtml(opts), base64: false });
  const label = opts.month !== null ? format(new Date(opts.year, opts.month), 'MMM') : 'Year';
  const fileName = `${safeFileName(opts.calendarName)}_${label}_${opts.year}.pdf`;
  const dest = cacheFile(fileName);
  new File(uri).move(dest);
  return deliverFile(dest, fileName, 'application/pdf', 'com.adobe.pdf');
}

// ---------- BACKUP & RESTORE ----------

const DATA_KEY_PREFIXES = ['shift_data_', 'shift_notes_', 'shift_overtime_', 'shift_swaps_', 'leave_data_', 'leave_balances_'];
const EXACT_KEYS = new Set([
  'calendars_list', 'active_calendar', 'all_shifts_v2', 'custom_shifts', 'schema_version', 'last_used_shift',
  ...Object.values(SETTINGS_KEYS),
]);

export function isBackupKey(key: string): boolean {
  return EXACT_KEYS.has(key) || DATA_KEY_PREFIXES.some((p) => key.startsWith(p));
}

export async function backupAll(): Promise<boolean> {
  const keys = (await AsyncStorage.getAllKeys()).filter(isBackupKey);
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};
  for (const [key, value] of pairs) if (value !== null) data[key] = value;
  const json = JSON.stringify({ app: 'ShiftCalendar', version: 3, timestamp: new Date().toISOString(), data }, null, 2);
  const fileName = `ShiftCalendar_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
  const file = cacheFile(fileName);
  file.write(json);
  return deliverFile(file, fileName, 'application/json', 'public.json');
}

export function pickBackupFile() {
  return pickTextFile(['application/json', 'text/plain', 'application/octet-stream']);
}

export interface BackupSummary {
  entries: [string, string][];
  timestamp: string | null;
  calendars: number;
  days: number;
}

/** Validates a backup file and summarizes it. Throws with a readable message when it isn't usable. */
export function inspectBackup(content: string): BackupSummary {
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('This file is not a valid backup (it is not JSON).');
  }
  if (!parsed || typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('This file is not a ShiftCalendar backup.');
  }
  const entries: [string, string][] = Object.entries(parsed.data as Record<string, unknown>)
    .filter(([key, value]) => typeof value === 'string' && isBackupKey(key))
    .map(([key, value]) => [key, value as string]);
  if (entries.length === 0) throw new Error('The backup does not contain any ShiftCalendar data.');

  let calendars = 1;
  let days = 0;
  for (const [key, value] of entries) {
    try {
      if (key === 'calendars_list') calendars = Math.max(1, (JSON.parse(value) as unknown[]).length);
      if (key.startsWith('shift_data_') || key.startsWith('leave_data_')) days += Object.keys(JSON.parse(value)).length;
    } catch {
      // Unreadable values are restored as-is and ignored by the loader.
    }
  }
  return { entries, timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : null, calendars, days };
}

export function describeBackup(summary: BackupSummary): string {
  const when = summary.timestamp ? format(new Date(summary.timestamp), 'MMM d, yyyy · HH:mm') : 'an unknown date';
  return `Backup from ${when}\n${summary.calendars} calendar${summary.calendars === 1 ? '' : 's'}, ${summary.days} scheduled day${summary.days === 1 ? '' : 's'}.\n\nThis replaces all current data and settings.`;
}

/** Replaces the app's stored data with the backup's. Callers reload state afterwards. */
export async function restoreBackup(summary: BackupSummary): Promise<void> {
  const existing = (await AsyncStorage.getAllKeys()).filter(isBackupKey);
  const entries = [...summary.entries];
  // Older backups may predate the onboarding flag; restoring shouldn't send the user back to onboarding.
  if (!entries.some(([key]) => key === SETTINGS_KEYS.onboardingComplete)) {
    entries.push([SETTINGS_KEYS.onboardingComplete, 'true']);
  }
  await AsyncStorage.multiRemove(existing);
  await AsyncStorage.multiSet(entries);
  // Backups from older versions need the same upgrades as an older install.
  await rerunMigrations();
}
