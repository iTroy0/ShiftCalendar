import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import { format, getDaysInMonth } from 'date-fns';
import { ShiftData, NotesData, OvertimeData } from '../hooks/useShiftData';
import { ShiftType, HOURS_PER_SHIFT } from '../constants/shifts';

// ---------- CSV EXPORT ----------

function buildCSVRows(
  year: number,
  month: number | null,
  shiftData: ShiftData,
  notesData: NotesData,
  overtimeData: OvertimeData,
  allShifts: ShiftType[],
): string {
  const header = 'Date,Day,Shift Code,Shift Label,Start Time,End Time,Overtime Hours,Note';
  const rows: string[] = [header];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const startMonth = month !== null ? month : 0;
  const endMonth = month !== null ? month : 11;

  for (let m = startMonth; m <= endMonth; m++) {
    const daysInMonth = getDaysInMonth(new Date(year, m));
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, m, d);
      const dayName = dayNames[date.getDay()];
      const code = shiftData[dateStr] || '';
      const shift = code ? allShifts.find((s) => s.code === code) : undefined;
      const note = notesData[dateStr] || '';
      const overtime = overtimeData[dateStr] || 0;

      const escapedNote = note ? `"${note.replace(/"/g, '""')}"` : '';
      rows.push(
        `${dateStr},${dayName},${code},${shift?.label || ''},${shift?.startTime || ''},${shift?.endTime || ''},${overtime || ''},${escapedNote}`
      );
    }
  }

  return rows.join('\n');
}

export async function exportCSV(
  year: number,
  month: number | null,
  shiftData: ShiftData,
  notesData: NotesData,
  overtimeData: OvertimeData,
  allShifts: ShiftType[],
  calendarName: string,
) {
  const csv = buildCSVRows(year, month, shiftData, notesData, overtimeData, allShifts);
  const monthLabel = month !== null ? format(new Date(year, month), 'MMM') : 'Year';
  const fileName = `${calendarName.replace(/\s+/g, '_')}_${monthLabel}_${year}.csv`;

  const file = new File(Paths.cache, fileName);
  file.write(csv);

  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
}

// ---------- CSV IMPORT ----------

export interface ImportResult {
  shiftEntries: Record<string, string>;
  noteEntries: Record<string, string>;
  overtimeEntries: Record<string, number>;
  rowCount: number;
}

export async function importCSV(allShifts: ShiftType[]): Promise<ImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return null;

  const pickedFile = new File(result.assets[0].uri);
  const content = await pickedFile.text();
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return null;

  const validCodes = new Set(allShifts.map((s) => s.code));
  const shiftEntries: Record<string, string> = {};
  const noteEntries: Record<string, string> = {};
  const overtimeEntries: Record<string, number> = {};
  let rowCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length < 3) continue;

    const dateStr = parts[0].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    const code = parts[2].trim();
    if (code && validCodes.has(code)) {
      shiftEntries[dateStr] = code;
    }

    const overtime = parts[6] ? parseFloat(parts[6].trim()) : 0;
    if (overtime > 0) {
      overtimeEntries[dateStr] = overtime;
    }

    const note = parts[7] ? parts[7].trim().replace(/^"|"$/g, '') : '';
    if (note) {
      noteEntries[dateStr] = note;
    }

    rowCount++;
  }

  return { shiftEntries, noteEntries, overtimeEntries, rowCount };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// ---------- PDF EXPORT ----------

function buildPDFHtml(
  year: number,
  month: number | null,
  shiftData: ShiftData,
  notesData: NotesData,
  overtimeData: OvertimeData,
  allShifts: ShiftType[],
  calendarName: string,
): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNamesArr = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const startMonth = month !== null ? month : 0;
  const endMonth = month !== null ? month : 11;

  let monthsHtml = '';

  for (let m = startMonth; m <= endMonth; m++) {
    const daysInMonth = getDaysInMonth(new Date(year, m));

    const counts: Record<string, number> = {};
    allShifts.forEach((s) => (counts[s.code] = 0));
    let otTotal = 0;
    let workDays = 0;
    const offCodes = new Set(allShifts.filter((s) => !s.startTime).map((s) => s.code));

    let tableRows = '';
    let notesRows = '';
    let hasNotes = false;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, m, d);
      const dayName = dayNames[date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const code = shiftData[dateStr] || '';
      const shift = code ? allShifts.find((s) => s.code === code) : undefined;
      const overtime = overtimeData[dateStr] || 0;
      const note = notesData[dateStr] || '';

      if (code && counts[code] !== undefined) counts[code]++;
      if (code && !offCodes.has(code)) workDays++;
      if (overtime > 0) otTotal += overtime;

      const bgColor = isWeekend ? '#f8f9fa' : '#fff';
      const shiftTextColor = shift ? shift.color : '#6B7280';

      tableRows += `
        <tr style="background:${bgColor}">
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;width:26px">${d}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;color:#6B7280;width:34px">${dayName}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;width:50px">
            ${shift ? `<span style="background:${shift.color}20;color:${shiftTextColor};padding:1px 8px;border-radius:4px;font-weight:700;font-size:11px">${code}</span>` : '<span style="color:#d1d5db">-</span>'}
          </td>
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;color:${shiftTextColor}">${shift?.label || ''}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;color:#6B7280;font-size:11px">${shift?.startTime ? `${shift.startTime} - ${shift.endTime}` : ''}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:${overtime > 0 ? '#EF4444' : '#d1d5db'};font-weight:${overtime > 0 ? '700' : '400'};font-size:11px">${overtime > 0 ? `+${overtime}h` : '-'}</td>
        </tr>`;

      if (note) {
        hasNotes = true;
        notesRows += `
          <tr>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#6366F1;width:90px">${monthNamesArr[m].slice(0, 3)} ${d}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px">${escapeHtml(note)}</td>
          </tr>`;
      }
    }

    const regularHours = workDays * HOURS_PER_SHIFT;
    const totalHours = regularHours + otTotal;

    let shiftBadges = '';
    allShifts.forEach((s) => {
      if (counts[s.code] > 0) {
        shiftBadges += `
          <div style="display:inline-flex;align-items:center;gap:6px;margin:3px 6px 3px 0;background:${s.color}15;padding:4px 12px;border-radius:8px;border:1px solid ${s.color}30">
            <span style="background:${s.color};color:#fff;width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">${s.code}</span>
            <span style="color:${s.color};font-weight:700;font-size:13px">${counts[s.code]}</span>
            <span style="color:${s.color}99;font-size:11px">${s.label}</span>
          </div>`;
      }
    });

    const pageBreak = m > startMonth ? 'page-break-before:always;' : '';

    monthsHtml += `
      <div style="${pageBreak}margin-bottom:20px">
        <h2 style="color:#1f2937;font-size:18px;margin:0 0 8px 0;border-bottom:2px solid #6366F1;padding-bottom:4px">${monthNamesArr[m]} ${year}</h2>

        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 14px;flex:1;min-width:100px">
            <div style="color:#16a34a;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Working Days</div>
            <div style="color:#15803d;font-size:18px;font-weight:800">${workDays}</div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:6px 14px;flex:1;min-width:100px">
            <div style="color:#2563eb;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Hours</div>
            <div style="color:#1d4ed8;font-size:18px;font-weight:800">${totalHours}h</div>
          </div>
          ${otTotal > 0 ? `
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:6px 14px;flex:1;min-width:100px">
            <div style="color:#dc2626;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Overtime</div>
            <div style="color:#b91c1c;font-size:18px;font-weight:800">+${otTotal}h</div>
          </div>` : ''}
        </div>

        <div style="margin-bottom:10px">${shiftBadges}</div>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:12px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase">Day</th>
              <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase"></th>
              <th style="padding:5px 8px;text-align:center;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase">Shift</th>
              <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase">Type</th>
              <th style="padding:5px 8px;text-align:left;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase">Time</th>
              <th style="padding:5px 8px;text-align:center;border-bottom:2px solid #e5e7eb;color:#6B7280;font-size:10px;text-transform:uppercase">OT</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>

        ${hasNotes ? `
        <div style="margin-top:14px">
          <h3 style="color:#6366F1;font-size:14px;margin:0 0 8px 0">Notes</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px">
            <tbody>${notesRows}</tbody>
          </table>
        </div>` : ''}
      </div>`;
  }

  const title = month !== null
    ? `${monthNamesArr[month]} ${year}`
    : `${year} - Full Year`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1f2937;
      line-height: 1.4;
    }
    @page { margin: 14mm 12mm; }
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 3px solid #6366F1;
    }
    .pdf-header h1 { margin: 0; font-size: 22px; color: #1f2937; }
    .pdf-header p { margin: 2px 0 0 0; color: #6B7280; font-size: 13px; }
    .pdf-header-right { text-align: right; color: #9ca3af; font-size: 11px; }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <h1>${escapeHtml(calendarName)}</h1>
      <p>${title}</p>
    </div>
    <div class="pdf-header-right">
      ShiftCalendar<br>
      Generated ${format(new Date(), 'MMM d, yyyy')}
    </div>
  </div>
  ${monthsHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function exportPDF(
  year: number,
  month: number | null,
  shiftData: ShiftData,
  notesData: NotesData,
  overtimeData: OvertimeData,
  allShifts: ShiftType[],
  calendarName: string,
) {
  const html = buildPDFHtml(year, month, shiftData, notesData, overtimeData, allShifts, calendarName);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const monthLabel = month !== null ? format(new Date(year, month), 'MMM') : 'Year';
  const fileName = `${calendarName.replace(/\s+/g, '_')}_${monthLabel}_${year}.pdf`;
  const srcFile = new File(uri);
  const destFile = new File(Paths.cache, fileName);
  srcFile.move(destFile);
  await Sharing.shareAsync(destFile.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
