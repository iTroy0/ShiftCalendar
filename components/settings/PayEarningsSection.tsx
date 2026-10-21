import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { getCurrency } from '../../constants/currencies';
import { SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  currencyCode: string;
  onCurrencyPress: () => void;
  baseRate: number;
  setBaseRate: (v: number) => void;
  overtimeRate: number;
  setOvertimeRate: (v: number) => void;
  paidLeaveHours: number;
  setPaidLeaveHours: (v: number) => void;
}

/** Number field that keeps the user's text while typing and saves every valid value. */
function NumberField({
  value,
  onCommit,
  colors,
  prefix,
  suffix,
  max,
  label,
}: {
  value: number;
  onCommit: (v: number) => void;
  colors: ThemeColors;
  prefix?: string;
  suffix: string;
  max: number;
  label: string;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : '');
  useEffect(() => {
    setText((prev) => (parseFloat(prev || '0') === value ? prev : value > 0 ? String(value) : ''));
  }, [value]);

  return (
    <View style={[styles.field, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      {prefix ? <Text style={[styles.affix, { color: colors.textSecondary }]}>{prefix}</Text> : null}
      <TextInput
        value={text}
        onChangeText={(t) => {
          const cleaned = t.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
          setText(cleaned);
          const n = parseFloat(cleaned);
          onCommit(Number.isFinite(n) ? Math.min(n, max) : 0);
        }}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        maxLength={9}
        accessibilityLabel={label}
        style={[styles.input, { color: colors.text }]}
      />
      <Text style={[styles.affix, { color: colors.textMuted }]}>{suffix}</Text>
    </View>
  );
}

export function PayEarningsSection(props: Props) {
  const { colors } = props;
  const currency = getCurrency(props.currencyCode);
  return (
    <>
      <SectionLabel colors={colors}>Pay</SectionLabel>
      <SettingsCard colors={colors}>
        <SettingsRow icon="cash-multiple" iconColor={colors.success} title="Currency" value={`${currency.symbol} · ${currency.code}`} colors={colors} onPress={props.onCurrencyPress} />
        <SettingsRow
          icon="briefcase-clock-outline"
          title="Hourly rate"
          subtitle="Used for pay estimates in Stats"
          colors={colors}
          right={<NumberField value={props.baseRate} onCommit={props.setBaseRate} colors={colors} prefix={currency.symbol} suffix="/h" max={1e6} label="Hourly rate" />}
        />
        <SettingsRow
          icon="clock-plus-outline"
          iconColor={colors.overtimeAccent}
          title="Overtime rate"
          subtitle="Per extra hour you log"
          colors={colors}
          right={<NumberField value={props.overtimeRate} onCommit={props.setOvertimeRate} colors={colors} prefix={currency.symbol} suffix="/h" max={1e6} label="Overtime rate" />}
        />
        <SettingsRow
          icon="umbrella-beach"
          iconColor={colors.success}
          title="Paid leave day"
          subtitle="Hours credited for each paid leave day"
          colors={colors}
          right={<NumberField value={props.paidLeaveHours} onCommit={props.setPaidLeaveHours} colors={colors} suffix="h" max={24} label="Hours per paid leave day" />}
        />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  // Fixed width: a TextInput's intrinsic width (large on web) must never squeeze the row's label.
  field: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, height: 42, width: 124 },
  affix: { fontSize: 14, fontWeight: '700' },
  input: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '800', textAlign: 'right', paddingHorizontal: 4, paddingVertical: 0 },
});
