import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { withAlpha } from '../../utils/color';

interface Props {
  leaveTypes: LeaveType[];
  balances: Record<string, number>;
  used: Record<string, number>;
  colors: ThemeColors;
}

/** Used vs allocated per leave type. The track is a lighter step of the fill's own hue. */
export function LeaveMeters({ leaveTypes, balances, used, colors }: Props) {
  return (
    <View style={styles.list}>
      {leaveTypes.map((lt) => {
        const allocated = balances[lt.id] ?? lt.defaultDays;
        const taken = used[lt.id] || 0;
        const over = allocated > 0 && taken > allocated;
        const pct = allocated > 0 ? Math.min(taken / allocated, 1) : taken > 0 ? 1 : 0;
        const fill = over ? colors.danger : lt.color;
        let detail: string;
        if (allocated === 0) detail = taken ? `${taken} day${taken === 1 ? '' : 's'} taken` : 'No allowance set';
        else if (over) detail = `${taken - allocated} over allowance`;
        else detail = `${allocated - taken} of ${allocated} left`;
        return (
          <View key={lt.id} style={styles.item} accessibilityLabel={`${lt.label}: ${taken} used. ${detail}`}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name={lt.icon as any} size={16} color={lt.color} />
              <Text style={[styles.label, { color: colors.text }]}>{lt.label}</Text>
              {over && <MaterialCommunityIcons name="alert-circle" size={14} color={colors.danger} />}
              <Text style={[styles.detail, { color: over ? colors.danger : colors.textSecondary }]}>{detail}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: withAlpha(fill, 0.18) }]}>
              {pct > 0 && <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: fill }]} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  item: { gap: 7 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 14, fontWeight: '700' },
  detail: { fontSize: 12, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
