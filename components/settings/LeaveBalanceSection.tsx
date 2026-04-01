import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type LeaveType = { id: string; label: string; icon: string; color: string; defaultDays: number };

type Props = {
  colors: any;
  leaveTypes: LeaveType[];
  leaveBalances: Record<string, number>;
  setLeaveBalance: (id: string, days: number) => void;
};

export function LeaveBalanceSection({ colors, leaveTypes, leaveBalances, setLeaveBalance }: Props) {
  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEAVE BALANCE</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Set your annual leave allocation for each leave type.
        </Text>
        {leaveTypes.map((lt, i) => (
          <View key={lt.id}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />}
            <View style={styles.leaveBalanceRow}>
              <MaterialCommunityIcons name={lt.icon as any} size={20} color={lt.color} />
              <Text style={[styles.leaveBalanceLabel, { color: colors.text }]}>{lt.label}</Text>
              <TextInput
                style={[styles.leaveBalanceInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                value={String(leaveBalances[lt.id] ?? lt.defaultDays)}
                onChangeText={(t) => {
                  const val = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  setLeaveBalance(lt.id, isNaN(val) ? 0 : val);
                }}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>days</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  divider: { height: 1 },
  leaveBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leaveBalanceLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  leaveBalanceInput: { width: 60, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  rateUnit: { fontSize: 14, fontWeight: '600' },
});
