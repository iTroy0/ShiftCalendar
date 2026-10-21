import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType, getShiftHours, isWorkingShift } from '../../constants/shifts';
import { ThemeColors } from '../../constants/colors';
import { TimeFormat, formatHours, formatTimeRange } from '../../utils/time';
import { readableTextColor } from '../../utils/color';
import { haptic } from '../../utils/haptics';
import { Tap } from '../ui/Tap';
import { SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  timeFormat: TimeFormat;
  allShifts: ShiftType[];
  onNewShift: () => void;
  onEditShift: (shift: ShiftType) => void;
  onMoveShift: (code: string, direction: 'up' | 'down') => void;
}

export function ShiftsSection({ colors, timeFormat, allShifts, onNewShift, onEditShift, onMoveShift }: Props) {
  return (
    <>
      <SectionLabel colors={colors}>Shift types</SectionLabel>
      <SettingsCard colors={colors}>
        {allShifts.map((shift, i) => (
          <Tap
            key={shift.code}
            onPress={() => onEditShift(shift)}
            activeOpacity={0.6}
            accessibilityLabel={`Edit ${shift.label}`}
            style={styles.row}
          >
            <View style={[styles.badge, { backgroundColor: shift.color }]}>
              <Text style={[styles.badgeText, { color: readableTextColor(shift.color) }]}>{shift.code}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
                {shift.label}
              </Text>
              <Text style={[styles.time, { color: colors.textSecondary }]} numberOfLines={1}>
                {isWorkingShift(shift)
                  ? `${formatTimeRange(shift.startTime, shift.endTime, timeFormat)} · ${formatHours(getShiftHours(shift))}`
                  : 'Day off'}
              </Text>
            </View>
            <View style={styles.reorder}>
              <Tap
                onPress={() => {
                  haptic.selection();
                  onMoveShift(shift.code, 'up');
                }}
                disabled={i === 0}
                accessibilityLabel={`Move ${shift.label} up`}
                style={[styles.reorderBtn, { opacity: i === 0 ? 0.25 : 1 }]}
              >
                <MaterialCommunityIcons name="chevron-up" size={20} color={colors.textSecondary} />
              </Tap>
              <Tap
                onPress={() => {
                  haptic.selection();
                  onMoveShift(shift.code, 'down');
                }}
                disabled={i === allShifts.length - 1}
                accessibilityLabel={`Move ${shift.label} down`}
                style={[styles.reorderBtn, { opacity: i === allShifts.length - 1 ? 0.25 : 1 }]}
              >
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
              </Tap>
            </View>
          </Tap>
        ))}
        <SettingsRow icon="plus" title="Add shift type" colors={colors} onPress={onNewShift} chevron={false} />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, minHeight: 60 },
  badge: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 13, fontWeight: '800' },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700' },
  time: { fontSize: 12.5, marginTop: 2 },
  reorder: { flexDirection: 'row' },
  reorderBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
});
