/** Minimal RFC 4180 CSV helpers (quoted fields may contain commas, quotes and newlines). */

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Prefixes values that spreadsheets would treat as formulas, so exports can't inject them. */
export function sanitizeCell(value: string): string {
  return FORMULA_PREFIX.test(value) ? "'" + value : value;
}

/** Reverses `sanitizeCell` on import. */
export function unsanitizeCell(value: string): string {
  return value.length > 1 && value[0] === "'" && FORMULA_PREFIX.test(value.slice(1)) ? value.slice(1) : value;
}

export function encodeCell(value: string | number | null | undefined, sanitize = true): string {
  if (value === null || value === undefined || value === '') return '';
  let s = String(value);
  if (sanitize && typeof value === 'string') s = sanitizeCell(s);
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function encodeRow(cells: (string | number | null | undefined)[]): string {
  return cells.map((c) => encodeCell(c)).join(',');
}

export function parseCSV(content: string): string[][] {
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
