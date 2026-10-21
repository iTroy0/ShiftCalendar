# Changelog

## 2.6.0

### What's new
- **Redesigned calendar** — Swipe between months, cleaner day cells with the shift centred and its start time, dots for notes, overtime and swaps, a week agenda, and layouts for tablets and landscape
- **Paint mode** — Pick a shift or leave type and tap days to fill them, with undo
- **Template and repeat previews** — See a rotation on the calendar before applying it; leave days are kept and every fill can be undone
- **New day sheet** — Shift, leave, overtime stepper, notes that save as you type, and swap offers in one place
- **Stats dashboard** — Total hours and estimated pay, shift mix, monthly hours chart, leave balances and a year overview
- **Settings refresh** — Calendar and currency editors, reminder time, alarm lead time, a test notification, and a choice of which calendar drives reminders and the widget
- **First-run setup** — Pick your preferences and, optionally, a rotation to start with
- **More options** — 12/24-hour time, weeks starting on Saturday, a haptics toggle, a 4-4-4 template and more currencies
- **Huawei Watch GT companion** — A read-only month calendar of your rotation for GT-series watches, written for the GT 7. It's built and installed separately with DevEco Studio; see [watch/](https://github.com/iTroy0/ShiftCalendar/tree/main/watch)

### Fixes
- A day can no longer hold both a shift and leave, which double-counted hours and pay
- Renaming or deleting a custom shift now updates every calendar, not just the open one
- Alarms for shifts that start just after midnight now ring the evening before, and reminders no longer pile up as duplicates
- CSV export and import keep notes with line breaks or a leading "=" or "-" intact, and older CSV files still import
- Exporting a PDF a second time no longer fails
- Backups are checked before restoring, and a restore reloads everything without restarting the app
- The Panama template now matches its description

### Good to know
- Installs over 2.5.1 and keeps your shifts, notes and settings
- Reminders and the widget keep following the calendar you had open when you updated; change it in Settings → Reminders
- New installs get a cyan Afternoon shift so it's easier to tell apart from Night, and Unpaid leave is now pink

## 2.5.1
- Pre-shift alarm plays a proper alarm tone instead of the default notification sound
- Settings reorganized: Shifts, Calendars, Leave, Pay, Notifications, Appearance, Import/Export, About
- Dependency updates and expo doctor fixes

## 2.5.0
- Landscape mode with responsive calendar, stats and settings layouts on tablets
- Pre-shift alarm an hour before your shift, even in Do Not Disturb
- Template and repeat sheets minimize while you tap dates
- Removed the duplicate month header
- Yearly overview shows 6 months per row in landscape

## 2.4.2
- Calendar cells with icon and code pill badges; previous and next month days visible
- 8 rotation templates that map to your shifts even after renaming them, and repeat patterns
- Leave types (Annual, Sick, Emergency, Unpaid) with yearly balances
- Pay calculator with base and overtime rates in 33 currencies
- Shift swaps shared through WhatsApp, SMS and other apps
- Android home screen widget for the current week
- Notes with search, week view and yearly overview
- CSV and PDF export, CSV import, and full backup and restore
- Redesigned light mode, larger touch targets and accessibility labels

## 1.0.1
- CSV export and import of shifts, overtime and notes for a month or a whole year
- PDF export with monthly summaries, shift badges, a day-by-day table and notes

## 1.0.0
- Initial public release
