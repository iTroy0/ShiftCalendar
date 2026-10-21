function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Returns the color as an 8-digit hex with the given alpha (0–1). Non-hex input is returned untouched. */
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return '#' + [...rgb, a].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function luminance(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const DARK_INK = '#1C1917';

/**
 * Legible foreground for text drawn on `background`: white while it clears 3:1
 * (the conventional look on saturated fills), otherwise dark ink.
 */
export function readableTextColor(background: string): string {
  return contrastRatio('#FFFFFF', background) >= 3 ? '#FFFFFF' : DARK_INK;
}
