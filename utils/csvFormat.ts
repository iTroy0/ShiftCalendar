import { ShiftType, getShiftHours, isWorkingShift } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { encodeRow, parseCSV, unsanitizeCell } from './csv';
import { eachDayKey, fromDateKey, isDateKey } from './dates';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BOM = String.fromCharCode(0xfeff);

/**
 * Column order of earlier versions is kept (Date … Note) so older importers and spreadsheets
 * that rely on positions still work; new columns are appended.
 */
export const CSV_HEADER = ['Date', 'Day', 'Shift Code', 'Shift Label', 'Start Time', 'End Time', 'Overtime Hours', 'Note', 'Leave', 'Shift Hours'];

export interface CSVDayData {
  shifts: Record<string, string>;
  notes: Record<string, string>;
  overtime: Record<string, number>;
  leave: Record<string, string>;
}

export function buildCSV(
  data: CSVDayData,
  allShifts: ShiftType[],
  leaveTypes: LeaveType[],
  fromKey: string,
  toKey: string
): string {
  const shiftMap = new Map(allShifts.map((s) => [s.code, s]));
  const leaveMap = new Map(leaveTypes.map((t) => [t.id, t]));
  const rows = [encodeRow(CSV_HEADER)];
  for (const key of eachDayKey(fromKey, toKey)) {
    const code = data.shifts[key] ?? '';
    const shift = code ? shiftMap.get(code) : undefined;
    const leave = data.leave[key] ? leaveMap.get(data.leave[key]) : undefined;
    rows.push(
      encodeRow([
        key,
        DAY_NAMES[fromDateKey(key).getDay()],
        shift ? code : '',
        shift?.label ?? '',
        shift?.startTime ?? '',
        shift?.endTime ?? '',
        data.overtime[key] || '',
        data.notes[key] ?? '',
        leave?.label ?? '',
        shift && isWorkingShift(shift) ? Math.round(getShiftHours(shift) * 100) / 100 : '',
      ])
    );
  }
  // BOM + CRLF keep spreadsheet apps happy with non-English notes.
  return BOM + rows.join('\r\n') + '\r\n';
}

export interface ImportResult {
  shifts: Record<string, string>;
  notes: Record<string, string>;
  overtime: Record<string, number>;
  leave: Record<string, string>;
  days: number;
  skippedRows: number;
  unknownCodes: string[];
}

function findColumn(header: string[], names: string[]) {
  const normalized = header.map((h) => h.trim().toLowerCase());
  for (const name of names) {
    const idx = normalized.indexOf(name);
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeDate(value: string): string | null {
  const v = value.trim();
  if (isDateKey(v)) return v;
  const m = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(v);
  if (m) {
    const key = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    return isDateKey(key) ? key : null;
  }
  return null;
}

/** Parses a ShiftCalendar CSV (current or older column layouts). Returns null when it isn't one. */
export function parseCSVContent(content: string, allShifts: ShiftType[], leaveTypes: LeaveType[]): ImportResult | null {
  const rows = parseCSV(content);
  if (rows.length < 2) return null;
  const header = rows[0];
  const col = {
    date: findColumn(header, ['date']),
    code: findColumn(header, ['shift code', 'code', 'shift']),
    label: findColumn(header, ['shift label', 'label']),
    overtime: findColumn(header, ['overtime hours', 'overtime', 'ot']),
    note: findColumn(header, ['note', 'notes']),
    leave: findColumn(header, ['leave', 'leave type']),
  };
  if (col.date < 0) return null;

  const byCode = new Map(allShifts.map((s) => [s.code.toUpperCase(), s.code]));
  const byLabel = new Map(allShifts.map((s) => [s.label.trim().toLowerCase(), s.code]));
  const leaveLookup = new Map<string, string>();
  for (const t of leaveTypes) {
    leaveLookup.set(t.id.toLowerCase(), t.id);
    leaveLookup.set(t.code.toLowerCase(), t.id);
    leaveLookup.set(t.label.toLowerCase(), t.id);
  }

  const result: ImportResult = { shifts: {}, notes: {}, overtime: {}, leave: {}, days: 0, skippedRows: 0, unknownCodes: [] };
  const unknown = new Set<string>();
  const cell = (row: string[], idx: number) => (idx >= 0 && idx < row.length ? unsanitizeCell(row[idx].trim()) : '');

  for (const row of rows.slice(1)) {
    const key = normalizeDate(cell(row, col.date));
    if (!key) {
      result.skippedRows++;
      continue;
    }
    let touched = false;

    const leaveValue = cell(row, col.leave).toLowerCase();
    const leaveId = leaveValue ? leaveLookup.get(leaveValue) : undefined;
    if (leaveId) {
      result.leave[key] = leaveId;
      touched = true;
    } else {
      const rawCode = cell(row, col.code);
      if (rawCode) {
        const code = byCode.get(rawCode.toUpperCase()) ?? byLabel.get(cell(row, col.label).toLowerCase());
        if (code) {
          result.shifts[key] = code;
          touched = true;
        } else {
          unknown.add(rawCode);
        }
      }
    }

    const ot = parseFloat(cell(row, col.overtime));
    if (Number.isFinite(ot) && ot > 0) {
      result.overtime[key] = Math.round(ot * 100) / 100;
      touched = true;
    }
    const note = cell(row, col.note);
    if (note) {
      result.notes[key] = note;
      touched = true;
    }
    if (touched) result.days++;
  }
  result.unknownCodes = [...unknown].slice(0, 6);
  return result;
}

export function describeImport(result: ImportResult): string {
  const parts: string[] = [];
  const n = (count: number, one: string, many = one + 's') => `${count} ${count === 1 ? one : many}`;
  const shiftCount = Object.keys(result.shifts).length;
  const leaveCount = Object.keys(result.leave).length;
  const noteCount = Object.keys(result.notes).length;
  const otCount = Object.keys(result.overtime).length;
  if (shiftCount) parts.push(n(shiftCount, 'shift'));
  if (leaveCount) parts.push(n(leaveCount, 'leave day'));
  if (noteCount) parts.push(n(noteCount, 'note'));
  if (otCount) parts.push(n(otCount, 'overtime entry', 'overtime entries'));
  let text = `Found ${n(result.days, 'day')} with data${parts.length ? ` (${parts.join(', ')})` : ''}.`;
  if (result.unknownCodes.length) text += `\n\nSkipped unknown shift codes: ${result.unknownCodes.join(', ')}.`;
  return text;
}
