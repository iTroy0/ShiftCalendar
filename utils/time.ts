export type TimeFormat = '24h' | '12h';

export function parseHHMM(value: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return [h, min];
}

export function toHHMM(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** '07:00' → '07:00' (24h) or '7:00 AM' (12h). */
export function formatTime(value: string, format: TimeFormat): string {
  const t = parseHHMM(value);
  if (!t) return value;
  if (format === '24h') return toHHMM(t[0], t[1]);
  const [h, m] = t;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Short form for tight spaces: '07:00' (24h) or '7a' / '7:30p' (12h). */
export function formatTimeCompact(value: string, format: TimeFormat): string {
  const t = parseHHMM(value);
  if (!t) return value;
  if (format === '24h') return toHHMM(t[0], t[1]);
  const [h, m] = t;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'a' : 'p'}`;
}

export function formatTimeRange(start: string, end: string, format: TimeFormat): string {
  if (!start) return '';
  return `${formatTime(start, format)} – ${formatTime(end, format)}`;
}

/** Tighter range for one-line summaries: '07:00–15:00' (24h) or '7 AM–3:30 PM' (12h). */
export function formatTimeRangeShort(start: string, end: string, format: TimeFormat): string {
  if (!start) return '';
  if (format === '24h') return `${formatTime(start, format)}–${formatTime(end, format)}`;
  const short = (value: string) => formatTime(value, format).replace(':00 ', ' ');
  return `${short(start)}–${short(end)}`;
}

/** 20 → '20:00' (24h) or '8 PM' (12h). */
export function formatHourOfDay(hour: number, format: TimeFormat): string {
  if (format === '24h') return toHHMM(hour, 0);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** 8 → '8h', 7.5 → '7.5h', 7.25 → '7.25h'. */
export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded}h`;
}

export function formatMinutesAsDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h === 1 ? '' : 's'}`;
}
