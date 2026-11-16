# Translating ShiftCalendar

ShiftCalendar is available in English, Simplified Chinese (简体中文) and Arabic (العربية). This guide covers fixing a translation and adding a new language.

You don't need to know React Native to improve a translation. Each language is a single file of `'English': 'translation'` pairs.

## Fix or improve a translation

1. Open the language's file in [`i18n/`](i18n): `zh.ts` for Chinese, `ar.ts` for Arabic.
2. Find the English text. The translation is on the right:

   ```ts
   'Add a note': '添加备注',
   ```

3. Change only the right-hand side, then open a pull request.

If you'd rather not edit code, [open an issue](https://github.com/iTroy0/ShiftCalendar/issues). Say what the screen shows, what it should say, and why.

## How translations work

- The app's text is written in English and passed through `t()`: `t('Add a note')`.
- The English is the key. `t()` looks it up in the file for the current language and falls back to English when there's no entry, so a missing translation shows English instead of breaking.
- The language follows the phone, or the one picked in **Settings → Appearance → Language**.
- Translations live in the app. They work offline and are never downloaded.

### Placeholders

Text in braces is filled in by the app. Keep each placeholder exactly as written, and move it to wherever it belongs in your language:

```ts
'Next: {shift}, {when}': '下一班：{shift}，{when}',
'{name} removed': 'تمت إزالة {name}',
```

### Counts

The app uses two strings for a count, one for 1 and one for everything else:

```ts
'1 day': '1 天',
'{n} days': '{n} 天',
```

For a language with more plural forms, put the forms in one string, separated by `|`. Arabic uses four, for 2, 3–10, 11–99 and everything else (0, 100 and up):

```ts
'{n} days': 'يومين|{n} أيام|{n} يومًا|{n} يوم',
```

A form can leave out `{n}` when the word already says the number, as `يومين` (two days) does. The order of the forms is set by the language's `pluralForm` function in [`i18n/index.ts`](i18n/index.ts), and the comment at the top of `ar.ts` repeats it.

### Dates

Month and weekday names come from [date-fns](https://date-fns.org/), so they need no translating. Date patterns are translated only where your language orders the parts differently. Each letter stands for a part of the date (`d` the day, `MMM` a short month name, `EEEE` the weekday); copy the letters and move them:

```ts
'MMM d': 'M月d日',   // Chinese: 11月16日
'MMM d': 'd MMM',    // Arabic: 16 نوفمبر
```

Leave out patterns that already read correctly in your language.

### Calendar codes

The short codes on the calendar for the built-in shifts and leave types sit at the end of each language file, in `ZH_CODES` or `AR_CODES`. Keep them to one or two characters, or one short word, so they fit in a day cell.

### Names users type

Shift, calendar and leave names that users type are shown exactly as typed. The built-in ones ("Morning", "My Shifts") follow the app's language until the user renames them.

### What stays in English

- CSV export column headers, so a file exported in one language imports in any other.
- File names of exports and backups.
- The Huawei Watch GT app in [`watch/`](watch).

## Add a language

1. Copy `i18n/zh.ts` to `i18n/<code>.ts`, using the language's [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) (`fr.ts`, `es.ts`). Rename the exports to match (`FR`, `FR_CODES`).
2. Translate every right-hand side and the calendar codes. Delete the date patterns at the top that your language doesn't need.
3. Register the language in `LANGUAGES` in [`i18n/index.ts`](i18n/index.ts):

   ```ts
   import { fr } from 'date-fns/locale/fr';
   import { FR, FR_CODES } from './fr';

   fr: { name: 'Français', tag: 'fr', text: FR, codes: FR_CODES, dates: fr },
   ```

   - `name` is the language's name in itself, so people can find it whatever language the app is in. The Language picker lists every entry automatically.
   - `tag` is the [BCP 47 tag](https://en.wikipedia.org/wiki/IETF_language_tag) used by the PDF export.
   - `dates` is the matching [date-fns locale](https://github.com/date-fns/date-fns/tree/main/src/locale).
   - Add `rtl: true` for a right-to-left language.
   - Add `pluralForm` if the language has more than two plural forms (see [Counts](#counts)).

4. To follow the phone's language, add the code to `deviceLanguage()` in the same file.
5. Run the check (below) and test on a phone.

## Check your work

From the project folder, run:

```bash
node scripts/check-translations.js
```

It reads the app's code and reports for every language:

- **missing a translation**: English text the app shows with no entry yet.
- **placeholders differ**: a translation that lost or renamed a `{placeholder}`.
- **no longer used**: entries for text that has left the app, which can be deleted.

It finishes with a count per language and exits with an error while anything is missing or broken. Run it after any change to app text, too.

## Right-to-left languages

Arabic lays the whole app out right to left. React Native mirrors the layout itself; the app also flips back and forward arrows and the direction of month swipes. React Native reads the direction once, at launch, so after switching between a right-to-left and a left-to-right language the app asks to be closed and opened again.

When you test a right-to-left language, check:

- Back and forward arrows point the right way.
- Swiping between months moves in the expected direction.
- Times read hours first (`07:30`).
- A PDF export lays the month out right to left.

## Writing style

- Short and plain. Labels have little room, especially on the calendar and in buttons.
- One word for one thing. If "shift" is "مناوبة" on one screen, use the same word everywhere.
- Address the user the way apps in your language usually do.
- Keep the app name, ShiftCalendar, untranslated.
