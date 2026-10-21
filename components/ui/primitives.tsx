import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { Radius, Spacing, Type } from '../../constants/theme';
import { readableTextColor, withAlpha } from '../../utils/color';
import { Tap } from './Tap';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Card({
  children,
  colors,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, padded && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

export function SectionLabel({
  children,
  colors,
  right,
  style,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={[Type.overline, { color: colors.textMuted }]} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Divider({ colors, inset = 0 }: { colors: ThemeColors; inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />;
}

export function IconButton({
  icon,
  onPress,
  colors,
  label,
  active,
  tint,
  size = 40,
  style,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  colors: ThemeColors;
  label: string;
  active?: boolean;
  tint?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const accent = tint ?? colors.primary;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2.6,
          backgroundColor: active ? accent : colors.surfaceVariant,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={Math.round(size * 0.5)} color={active ? readableTextColor(accent) : colors.text} />
    </Tap>
  );
}

export function Chip({
  label,
  icon,
  selected,
  onPress,
  colors,
  color,
  style,
  textStyle,
  compact,
  accessibilityLabel,
}: {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  colors: ThemeColors;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const accent = color ?? colors.primary;
  const fg = selected ? readableTextColor(accent) : color ? accent : colors.text;
  return (
    <Tap
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: selected ? accent : color ? withAlpha(accent, 0.12) : colors.surfaceVariant,
          borderColor: selected ? accent : color ? withAlpha(accent, 0.3) : colors.border,
        },
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={compact ? 14 : 16} color={fg} />}
      <Text style={[styles.chipText, compact && styles.chipTextCompact, { color: fg }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Tap>
  );
}

export function Button({
  label,
  onPress,
  colors,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  color,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  icon?: IconName;
  /** Forward actions ("Continue →") read better with the icon after the label. */
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const base = color ?? (variant === 'danger' ? colors.danger : colors.primary);
  const bg =
    variant === 'primary' ? base : variant === 'danger' ? withAlpha(base, 0.12) : variant === 'secondary' ? colors.surfaceVariant : 'transparent';
  const fg = variant === 'primary' ? readableTextColor(base) : variant === 'secondary' ? colors.text : base;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      scale
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, iconPosition === 'right' && styles.buttonReverse, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <MaterialCommunityIcons name={icon} size={18} color={fg} />
      )}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Tap>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  colors,
  style,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  colors: ThemeColors;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceVariant }, style]} accessibilityRole="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Tap
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            activeOpacity={0.8}
            style={[styles.segment, active && [styles.segmentActive, { backgroundColor: colors.surface, shadowColor: colors.shadow }]]}
          >
            {opt.icon && <MaterialCommunityIcons name={opt.icon} size={16} color={active ? colors.text : colors.textSecondary} />}
            <Text style={[styles.segmentText, { color: active ? colors.text : colors.textSecondary }]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  colors,
  action,
}: {
  icon: IconName;
  title: string;
  message?: string;
  colors: ThemeColors;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
        <MaterialCommunityIcons name={icon} size={34} color={colors.primaryText} />
      </View>
      <Text style={[Type.heading, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  cardPadded: { padding: Spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    minHeight: 24,
  },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 36,
  },
  chipCompact: { paddingHorizontal: 10, paddingVertical: 5, minHeight: 30, gap: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  chipTextCompact: { fontSize: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    minHeight: 48,
    borderRadius: Radius.md,
  },
  buttonReverse: { flexDirection: 'row-reverse' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3, gap: 3 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    borderRadius: Radius.sm + 1,
    paddingHorizontal: 8,
  },
  segmentActive: {
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyMessage: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
