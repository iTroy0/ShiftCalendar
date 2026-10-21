import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShiftType } from '../../constants/shifts';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { PeriodStats } from '../../utils/statsCalculation';
import { formatHours } from '../../utils/time';
import { readableTextColor } from '../../utils/color';

interface Props {
  stats: PeriodStats;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  colors: ThemeColors;
}

/** Compact per-month totals shown beside the calendar in landscape. */
export function MonthSummary({ stats, allShifts, leaveTypes, colors }: Props) {
  const items = [
    ...allShifts.filter((s) => stats.counts[s.code] > 0).map((s) => ({ key: s.code, code: s.code, label: s.label, color: s.color, count: stats.counts[s.code] })),
    ...leaveTypes.filter((t) => stats.leaveCounts[t.id] > 0).map((t) => ({ key: t.id, code: t.code, label: t.label, color: t.color, count: stats.leaveCounts[t.id] })),
  ];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.totals}>
        <View style={styles.total}>
          <Text style={[styles.totalValue, { color: colors.text }]}>{stats.workingDays}</Text>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Shifts</Text>
        </View>
        <View style={styles.total}>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatHours(stats.totalHours)}</Text>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Hours</Text>
        </View>
        <View style={styles.total}>
          <Text style={[styles.totalValue, { color: stats.overtimeHours > 0 ? colors.overtimeAccent : colors.text }]}>
            {formatHours(stats.overtimeHours)}
          </Text>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Overtime</Text>
        </View>
      </View>
      {items.length > 0 && (
        <View style={styles.items}>
          {items.map((it) => (
            <View key={it.key} style={styles.item}>
              <View style={[styles.code, { backgroundColor: it.color }]}>
                <Text style={[styles.codeText, { color: readableTextColor(it.color) }]}>{it.code}</Text>
              </View>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {it.label}
              </Text>
              <Text style={[styles.itemCount, { color: colors.text }]}>{it.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  totals: { flexDirection: 'row' },
  total: { flex: 1, alignItems: 'center' },
  totalValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  totalLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  items: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  code: { minWidth: 26, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  codeText: { fontSize: 11, fontWeight: '800' },
  itemLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  itemCount: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
