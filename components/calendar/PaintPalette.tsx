import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType } from '../../constants/shifts';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { elevation } from '../../constants/theme';
import { readableTextColor, withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';

export type Brush = { kind: 'shift'; code: string } | { kind: 'leave'; id: string } | { kind: 'erase' };

export function brushKey(brush: Brush | null) {
  if (!brush) return '';
  return brush.kind === 'shift' ? `s:${brush.code}` : brush.kind === 'leave' ? `l:${brush.id}` : 'erase';
}

interface Props {
  shifts: ShiftType[];
  leaveTypes: LeaveType[];
  brush: Brush | null;
  onSelect: (brush: Brush) => void;
  colors: ThemeColors;
}

function BrushChip({
  label,
  code,
  color,
  icon,
  selected,
  onPress,
  colors,
}: {
  label: string;
  code?: string;
  color: string;
  icon?: any;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const fg = selected ? readableTextColor(color) : colors.text;
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={`Brush: ${label}`}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? color : withAlpha(color, 0.12),
          borderColor: selected ? color : withAlpha(color, 0.35),
        },
      ]}
    >
      {code ? (
        <View style={[styles.code, { backgroundColor: selected ? withAlpha(readableTextColor(color), 0.2) : color }]}>
          <Text style={[styles.codeText, { color: selected ? fg : readableTextColor(color) }]}>{code}</Text>
        </View>
      ) : (
        <MaterialCommunityIcons name={icon} size={16} color={selected ? fg : color} />
      )}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Tap>
  );
}

/** Floating brush picker shown at the bottom while paint mode is on. */
export function PaintPalette({ shifts, leaveTypes, brush, onSelect, colors }: Props) {
  const key = brushKey(brush);
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, elevation(3, colors.shadow)]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} keyboardShouldPersistTaps="handled">
        {shifts.map((s) => (
          <BrushChip
            key={s.code}
            label={s.label}
            code={s.code}
            color={s.color}
            selected={key === `s:${s.code}`}
            onPress={() => onSelect({ kind: 'shift', code: s.code })}
            colors={colors}
          />
        ))}
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
        {leaveTypes.map((t) => (
          <BrushChip
            key={t.id}
            label={t.label.replace(' Leave', '')}
            code={t.code}
            color={t.color}
            selected={key === `l:${t.id}`}
            onPress={() => onSelect({ kind: 'leave', id: t.id })}
            colors={colors}
          />
        ))}
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
        <BrushChip
          label="Erase"
          icon="eraser"
          color={colors.textSecondary}
          selected={key === 'erase'}
          onPress={() => onSelect({ kind: 'erase' })}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  row: { paddingHorizontal: 10, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 6,
    paddingRight: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  code: { minWidth: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  codeText: { fontSize: 12, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', maxWidth: 110 },
  sep: { width: 1, height: 28, marginHorizontal: 2 },
});
