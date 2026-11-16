/**
 * Checks each translation in i18n/ (zh.ts, ar.ts, ...) against the app's English text: strings
 * shown in the app with no translation, translations whose {placeholders} don't match, and
 * translations nothing uses any more. Run after changing app text or a translation:
 *
 *   node scripts/check-translations.js
 *
 * TRANSLATING.md explains how the translations work.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const I18N = path.join(root, 'i18n');
const SOURCE_DIRS = ['app', 'components', 'constants', 'hooks', 'i18n', 'utils', 'widgets'];
// Data the app shows through t() at runtime: template, leave, shift and currency names, the first calendar.
const DATA_FILES = ['constants/templates.ts', 'constants/leaveTypes.ts', 'constants/shifts.ts', 'constants/currencies.ts', 'hooks/useShiftData.ts'];

const STR = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;
const ARG = String.raw`(?:[^(),]|\((?:[^()]|\([^()]*\))*\))+`; // an argument, possibly with nested calls

function unquote(literal) {
  const inner = literal.slice(1, -1).replace(/\\'/g, "'").replace(/(^|[^\\])"/g, '$1\\"');
  return JSON.parse(`"${inner}"`);
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function matches(text, pattern) {
  return [...text.matchAll(new RegExp(pattern, 'gm'))];
}

// Every file in i18n/ except index.ts is a translation.
const translations = fs.readdirSync(I18N).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

const shown = new Set(); // English text the app displays
const patterns = new Set(); // date patterns, translated when a language orders the parts differently
for (const file of SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(root, d)))) {
  if (path.dirname(file) === I18N && translations.includes(path.basename(file))) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const m of matches(text, String.raw`\bt\(\s*(${STR})`)) shown.add(unquote(m[1]));
  for (const m of matches(text, String.raw`\bplural\(${ARG},\s*(${STR}),\s*(${STR})`)) {
    shown.add(unquote(m[1]));
    shown.add(unquote(m[2]));
  }
  for (const m of matches(text, String.raw`\bformatDate\(${ARG},\s*(${STR})\s*\)`)) patterns.add(unquote(m[1]));
}
for (const file of DATA_FILES) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of matches(text, String.raw`\b(?:label|name|description):\s*(${STR})`)) shown.add(unquote(m[1]));
  for (const m of matches(text, String.raw`^\s*[MANO]:\s*(${STR})`)) shown.add(unquote(m[1])); // SLOT_LABELS
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const withoutCount = (s) => placeholders(s.replace(/\{n\}/g, ''));
const report = (title, list) => list.length && console.log(`${title} (${list.length}):\n${list.map((s) => `  ${JSON.stringify(s)}`).join('\n')}\n`);

let failed = false;
const sizes = [];
for (const file of translations) {
  const text = fs.readFileSync(path.join(I18N, file), 'utf8');
  // The dictionary is the first `Record<string, string>` object in the file.
  const start = text.indexOf('Record<string, string> = {');
  const body = text.slice(start, text.indexOf('\n};', start));
  const dict = new Map(matches(body, String.raw`^\s*(${STR}):\s*(${STR}),?\s*$`).map((m) => [unquote(m[1]), unquote(m[2])]));

  // Text without letters ('2-2-2', '–') reads the same in every language and needs no entry.
  const missing = [...shown].filter((s) => /[A-Za-z]/.test(s) && !dict.has(s)).sort();
  const mismatched = [];
  const formCounts = new Set();
  for (const [en, tr] of dict) {
    const forms = tr.split('|');
    if (forms.length === 1) {
      if (placeholders(en) !== placeholders(tr)) mismatched.push(en);
      continue;
    }
    // Plural forms ('يومين|{n} أيام|…') belong on text with a count, and each may leave the count out.
    formCounts.add(forms.length);
    if (!en.includes('{n}') || forms.some((f) => withoutCount(f) !== withoutCount(en))) mismatched.push(en);
  }
  const unused = [...dict.keys()].filter((en) => !shown.has(en) && !patterns.has(en));

  report(`${file}: missing a translation`, missing);
  report(`${file}: placeholders differ from the English`, mismatched);
  report(`${file}: translated but no longer used`, unused);
  if (formCounts.size > 1) console.log(`${file}: plurals have different numbers of forms (${[...formCounts].join(', ')}); they should all match.\n`);
  if (missing.length || mismatched.length || formCounts.size > 1) failed = true;
  sizes.push(`${dict.size} in ${file}`);
}
console.log(`${shown.size} strings and ${patterns.size} date patterns in the app; translations: ${sizes.join(', ')}.`);
process.exitCode = failed ? 1 : 0;
