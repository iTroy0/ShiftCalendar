// Your shifts and rotation. Edit this file, then rebuild and reinstall the watch app.
// The defaults match ShiftCalendar on your phone.

// Shift types by code. `ink` is the text colour drawn on top of `color`.
export const SHIFTS = {
  M: { label: 'Morning', start: '07:00', end: '15:00', color: '#F59E0B', ink: '#1C1917' },
  A: { label: 'Afternoon', start: '15:00', end: '23:00', color: '#06B6D4', ink: '#1C1917' },
  N: { label: 'Night', start: '23:00', end: '07:00', color: '#6366F1', ink: '#FFFFFF' },
  O: { label: 'OFF', start: '', end: '', color: '#6B7280', ink: '#FFFFFF' },
};

// Rotations, written with the codes above. These are the phone app's templates; add your own
// the same way (any length).
export const ROTATIONS = [
  { name: '2-2-2', days: ['M', 'M', 'N', 'N', 'O', 'O'] },
  { name: '2-2-2-2', days: ['M', 'M', 'A', 'A', 'N', 'N', 'O', 'O'] },
  { name: '4-on 4-off', days: ['M', 'M', 'M', 'M', 'O', 'O', 'O', 'O'] },
  { name: '5-on 2-off', days: ['M', 'M', 'M', 'M', 'M', 'O', 'O'] },
  { name: '3-on 3-off', days: ['M', 'M', 'M', 'O', 'O', 'O'] },
  { name: '4-4-4', days: ['M', 'M', 'M', 'M', 'N', 'N', 'N', 'N', 'O', 'O', 'O', 'O'] },
  { name: 'Continental', days: ['M', 'M', 'N', 'N', 'O', 'O', 'M', 'M', 'M', 'N', 'N', 'O', 'O', 'O'] },
  { name: 'Panama 2-2-3', days: ['M', 'M', 'O', 'O', 'M', 'M', 'M', 'O', 'O', 'M', 'M', 'O', 'O', 'O'] },
  {
    name: 'DuPont',
    days: [
      'N', 'N', 'N', 'N', 'O', 'O', 'O',
      'M', 'M', 'M', 'O',
      'N', 'N', 'N', 'O', 'O', 'O',
      'M', 'M', 'M', 'M', 'O', 'O', 'O', 'O', 'O', 'O', 'O',
    ],
  },
];

// Your rotation: one of the names above, and the date of any day 1 of it (for 2-2-2-2, the first
// of two Morning days). Every other day is worked out from these.
export const MY_ROTATION = '2-2-2-2';
export const ROTATION_START = '2026-10-19';

// First day of the week in the month view: 0 = Sunday (like the watch's own calendar), 1 = Monday, 6 = Saturday.
export const WEEK_START = 0;
