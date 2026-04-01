import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShiftType } from '../../constants/shifts';

type Props = {
  colors: any;
  allShifts: ShiftType[];
  onNewShift: () => void;
  onEditShift: (shift: ShiftType) => void;
  onDeleteShift: (code: string) => void;
  onMoveShift: (code: string, direction: 'up' | 'down') => void;
};

export function ShiftsSection({ colors, allShifts, onNewShift, onEditShift, onDeleteShift, onMoveShift }: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SHIFTS</Text>
        <TouchableOpacity onPress={onNewShift} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
          <Text style={styles.addButtonText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {allShifts.map((shift, i) => (
          <React.Fragment key={shift.code}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <View style={styles.shiftRow}>
              <View style={[styles.shiftBadge, { backgroundColor: shift.color }]}>
                <Text style={styles.shiftBadgeText}>{shift.code}</Text>
              </View>
              <MaterialCommunityIcons name={shift.icon as any} size={20} color={shift.color} />
              <View style={styles.shiftInfo}>
                <Text style={[styles.shiftLabel, { color: colors.text }]}>{shift.label}</Text>
                <Text style={[styles.shiftTime, { color: colors.textSecondary }]}>
                  {shift.startTime ? `${shift.startTime} – ${shift.endTime}` : 'Day Off'}
                </Text>
              </View>
              <View style={styles.shiftActions}>
                <TouchableOpacity
                  style={[styles.shiftActionBtn, { opacity: i === 0 ? 0.25 : 1 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveShift(shift.code, 'up'); }}
                  disabled={i === 0}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons name="chevron-up" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shiftActionBtn, { opacity: i === allShifts.length - 1 ? 0.25 : 1 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMoveShift(shift.code, 'down'); }}
                  disabled={i === allShifts.length - 1}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shiftActionBtn}
                  onPress={() => onEditShift(shift)}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shiftActionBtn, { opacity: allShifts.length <= 1 ? 0.25 : 1 }]}
                  onPress={() => onDeleteShift(shift.code)}
                  disabled={allShifts.length <= 1}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4, marginTop: 10 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  divider: { height: 1 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  shiftBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shiftBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  shiftInfo: { flex: 1 },
  shiftLabel: { fontSize: 15, fontWeight: '600' },
  shiftTime: { fontSize: 13, marginTop: 2 },
  shiftActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shiftActionBtn: { padding: 4 },
});
