import { parseHHMM } from '../utils/time';

export interface ShiftType {
  code: string;
  label: string;
  color: string;
  startTime: string; // 'HH:MM', or '' for day-off types
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
    // Cyan rather than blue: blue sat too close to Night's indigo (hard to tell apart, worse with CVD).
    color: '#06B6D4',
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

/** A shift counts as work when it has both a start and an end time. */
export function isWorkingShift(shift: ShiftType | undefined): boolean {
  return !!shift && !!parseHHMM(shift.startTime) && !!parseHHMM(shift.endTime);
}

export function getShiftMinutes(shift: ShiftType): number {
  const start = parseHHMM(shift.startTime);
  const end = parseHHMM(shift.endTime);
  if (!start || !end) return 0;
  const startMin = start[0] * 60 + start[1];
  let endMin = end[0] * 60 + end[1];
  if (endMin <= startMin) endMin += 24 * 60; // overnight shift
  return endMin - startMin;
}

export function getShiftHours(shift: ShiftType): number {
  return getShiftMinutes(shift) / 60;
}

export const AVAILABLE_COLORS = [
  '#6366F1', '#3B82F6', '#0EA5E9', '#06B6D4',
  '#14B8A6', '#10B981', '#84CC16', '#F59E0B',
  '#F97316', '#EF4444', '#F43F5E', '#EC4899',
  '#A855F7', '#8B5CF6', '#78716C', '#6B7280',
];

export const AVAILABLE_ICONS = [
  'weather-sunny', 'weather-sunset-up', 'weather-sunset-down', 'weather-night',
  'home-variant', 'bed', 'palm-tree', 'coffee',
  'briefcase', 'hospital-building', 'stethoscope', 'medical-bag',
  'school', 'store', 'cash-register', 'factory',
  'truck', 'car', 'airplane', 'package-variant',
  'wrench', 'hard-hat', 'chef-hat', 'food',
  'phone', 'headset', 'laptop', 'shield',
  'police-badge', 'fire', 'heart-pulse', 'account-group',
  'star', 'lightning-bolt', 'run', 'book-open-variant',
];
