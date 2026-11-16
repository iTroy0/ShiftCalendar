import { I18nManager } from 'react-native';
import { format } from 'date-fns';
import type { Day, Locale, Month } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { zhCN } from 'date-fns/locale/zh-CN';
import { ar as arabic } from 'date-fns/locale/ar';
import { ZH, ZH_CODES } from './zh';
import { AR, AR_CODES } from './ar';

interface Translation {
  /** The language's name in itself, so it can be found from any language. */
  name: string;
  /** BCP 47 tag, for the PDF export. */
  tag: string;
  /** Translations keyed by the English text in the code. */
  text: Record<string, string>;
  /** Calendar codes for the built-in shifts (keyed by their code) and leave types (by id). */
  codes: Record<string, string>;
  /** Month and weekday names. */
  dates: Locale;
  rtl?: boolean;
  /** For translations with several plural forms ('a|b|c|d'), which form a count {n} uses. */
  pluralForm?: (n: number) => number;
}

/** Arabic forms after 1, in this order in ar.ts: 2 · 3–10 · 11–99 · everything else (0, 100, 1.5). */
export function arabicPluralForm(n: number): number {
  const r = n % 100;
  if (n === 2) return 0;
  if (!Number.isInteger(n)) return 3;
  return r >= 3 && r <= 10 ? 1 : r >= 11 ? 2 : 3;
}

const LANGUAGES = {
  en: { name: 'English', tag: 'en', text: {}, codes: {}, dates: enUS },
  zh: { name: '简体中文', tag: 'zh-CN', text: ZH, codes: ZH_CODES, dates: zhCN },
  ar: { name: 'العربية', tag: 'ar', text: AR, codes: AR_CODES, dates: arabic, rtl: true, pluralForm: arabicPluralForm },
} satisfies Record<string, Translation>;

export type Language = keyof typeof LANGUAGES;
export type LanguageSetting = 'system' | Language;

const lang = (l: Language): Translation => LANGUAGES[l];

/** Every language the app has, for the picker. */
export const LANGUAGE_NAMES = Object.fromEntries(Object.entries(LANGUAGES).map(([code, l]) => [code, l.name])) as Record<Language, string>;

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === 'system' || (typeof value === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, value));
}

/**
 * The phone's language when the app has it. Traditional Chinese (Taiwan, Hong Kong, Macau)
 * stays English until it has a translation of its own.
 */
export function deviceLanguage(): Language {
  // Android reports e.g. 'zh_CN', 'zh_CN_#Hans', 'zh_TW' or 'ar_EG'; iOS 'zh-Hans_CN'.
  const id = (I18nManager.getConstants().localeIdentifier ?? '').toLowerCase();
  if (id.startsWith('zh') && !/hant|[-_](tw|hk|mo)\b/.test(id)) return 'zh';
  if (/^ar([-_]|$)/.test(id)) return 'ar';
  return 'en';
}

let current: Language = deviceLanguage();

export function setLanguage(setting: LanguageSetting) {
  current = setting === 'system' ? deviceLanguage() : setting;
}

export function getLanguage(): Language {
  return current;
}

export function languageTag(): string {
  return lang(current).tag;
}

/** Whether the app's language reads right to left. */
export function isRTLLanguage(): boolean {
  return !!lang(current).rtl;
}

/** Whether the screen is laid out right to left. Fixed until the app restarts. */
export const isRTL = I18nManager.isRTL;

/**
 * Lays the app out right to left for Arabic and left to right otherwise, from the next launch
 * (React Native reads the direction once, at start). Returns true when that differs from now.
 */
export function syncLayoutDirection(): boolean {
  const rtl = isRTLLanguage();
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return isRTL !== rtl;
}

/**
 * The app's text is written in English, and the English is the key into the translation.
 * `{name}` placeholders are filled from `vars`. Call it while rendering, never at module load,
 * so a language change shows up.
 */
export function t(text: string, vars?: Record<string, string | number>): string {
  const { text: dict, pluralForm } = lang(current);
  let out = dict[text] ?? text;
  if (pluralForm && typeof vars?.n === 'number' && out.includes('|')) {
    const forms = out.split('|');
    out = forms[pluralForm(vars.n)] ?? forms[forms.length - 1];
  }
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** plural(3, '1 day', '{n} days') → '3 days'. Languages with more forms pick one in `t`. */
export function plural(n: number, one: string, many: string): string {
  return n === 1 ? t(one) : t(many, { n });
}

/** The calendar code of a built-in shift ('M') or leave type ('annual') in the app's language. */
export function builtInCode(key: string): string | undefined {
  return lang(current).codes[key];
}

/** date-fns `format` in the app's language. The pattern is translated too: 'd MMMM yyyy' becomes 'yyyy年M月d日'. */
export function formatDate(date: Date, pattern: string): string {
  return format(date, t(pattern), { locale: lang(current).dates });
}

type Width = 'wide' | 'abbreviated' | 'narrow';

/** 0 → 'January' / 'Jan' / 'J' (一月 / 1月 / 一). */
export function monthName(month: number, width: Width = 'wide'): string {
  return lang(current).dates.localize.month(month as Month, { width });
}

/** 0 → 'Sunday' / 'Sun' / 'S' (星期日 / 周日 / 日). */
export function weekdayName(day: number, width: Width = 'wide'): string {
  return lang(current).dates.localize.day(day as Day, { width });
}
