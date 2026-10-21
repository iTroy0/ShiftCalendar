export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  noteAccent: string;
  overtimeAccent: string;
  swapAccent: string;
  overlay: string;
  shadow: string;
}

const dark: ThemeColors = {
  background: '#0E0E12',
  surface: '#17171D',
  surfaceVariant: '#212129',
  surfaceElevated: '#1B1B22',
  border: '#2A2A34',
  borderStrong: '#3A3A47',
  text: '#F4F4F6',
  textSecondary: '#A3A3AE',
  textMuted: '#6E6E7A',
  primary: '#6366F1',
  primaryText: '#8E91FA',
  onPrimary: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  noteAccent: '#F59E0B',
  overtimeAccent: '#F87171',
  swapAccent: '#A78BFA',
  overlay: 'rgba(0,0,0,0.55)',
  shadow: '#000000',
};

const light: ThemeColors = {
  background: '#F4F2EE',
  surface: '#FFFEFC',
  surfaceVariant: '#EFECE7',
  surfaceElevated: '#FFFEFC',
  border: '#E3DFD8',
  borderStrong: '#CFC9C0',
  text: '#262320',
  textSecondary: '#6F6A63',
  textMuted: '#9C968E',
  primary: '#6366F1',
  primaryText: '#4F46E5',
  onPrimary: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  noteAccent: '#D97706',
  overtimeAccent: '#DC2626',
  swapAccent: '#7C3AED',
  overlay: 'rgba(38,35,32,0.35)',
  shadow: '#5C4F3A',
};

export const Colors = { dark, light };
