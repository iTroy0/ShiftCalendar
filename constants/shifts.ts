export interface ShiftType {
  code: string;
  label: string;
  color: string;
  startTime: string;
  endTime: string;
  icon: string;
  isDefault: boolean;
}

export const DEFAULT_SHIFTS: ShiftType[] = [
  {
    code: 'M',
    label: 'Morning',
    color: '#F59E0B',
    startTime: '07:00',
    endTime: '15:00',
    icon: 'weather-sunny',
    isDefault: true,
  },
  {
    code: 'A',
    label: 'Afternoon',
    color: '#3B82F6',
    startTime: '15:00',
    endTime: '23:00',
    icon: 'weather-sunset-up',
    isDefault: true,
  },
  {
    code: 'N',
    label: 'Night',
    color: '#6366F1',
    startTime: '23:00',
    endTime: '07:00',
    icon: 'weather-night',
    isDefault: true,
  },
  {
    code: 'O',
    label: 'OFF',
    color: '#6B7280',
    startTime: '',
    endTime: '',
    icon: 'home-variant',
    isDefault: true,
  },
];

export const HOURS_PER_SHIFT = 8;

export function getShiftHours(shift: ShiftType): number {
  if (!shift.startTime || !shift.endTime) return 0;
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // overnight shift
  return (endMin - startMin) / 60;
}

export const AVAILABLE_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#6B7280',
  '#84CC16', '#06B6D4',
];

export const AVAILABLE_ICONS = [
  'weather-sunny', 'weather-sunset-up', 'weather-night', 'home-variant',
  'briefcase', 'hospital-building', 'school', 'store',
  'car', 'airplane', 'run', 'food',
  'phone', 'laptop', 'wrench', 'heart-pulse',
  'account-group', 'shield', 'fire', 'star',
];
