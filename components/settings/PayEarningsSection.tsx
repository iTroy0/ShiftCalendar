import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CURRENCIES, getCurrencySymbol } from '../../constants/currencies';

type Props = {
  colors: any;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  showCurrencyPicker: boolean;
  setShowCurrencyPicker: (v: boolean) => void;
  baseRateText: string;
  setBaseRateText: (v: string) => void;
  setBaseRate: (v: number) => void;
  otRateText: string;
  setOtRateText: (v: string) => void;
  setOvertimeRate: (v: number) => void;
};

export function PayEarningsSection({
  colors,
  currencyCode,
  setCurrencyCode,
  showCurrencyPicker,
  setShowCurrencyPicker,
  baseRateText,
  setBaseRateText,
  setBaseRate,
  otRateText,
  setOtRateText,
  setOvertimeRate,
}: Props) {
  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAY & EARNINGS</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
        <TouchableOpacity
          style={[styles.monthPickerBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, marginBottom: 12 }]}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
        >
          <Text style={[styles.rateSymbol, { color: colors.primary }]}>{getCurrencySymbol(currencyCode)}</Text>
          <Text style={[styles.monthPickerText, { color: colors.text }]}>
            {CURRENCIES.find((c) => c.code === currencyCode)?.name || currencyCode}
          </Text>
          <MaterialCommunityIcons name={showCurrencyPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {showCurrencyPicker && (
          <View style={[styles.currencyGrid, { borderColor: colors.border }]}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: currencyCode === c.code ? colors.primary : colors.surfaceVariant,
                    borderColor: currencyCode === c.code ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setCurrencyCode(c.code); setShowCurrencyPicker(false); }}
              >
                <Text style={[styles.currencySymbol, { color: currencyCode === c.code ? '#FFF' : colors.primary }]}>
                  {c.symbol}
                </Text>
                <Text style={[styles.currencyCode, { color: currencyCode === c.code ? '#FFFFFFCC' : colors.text }]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Base Hourly Rate</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Your regular hourly pay rate for pay estimates.
        </Text>
        <View style={styles.rateRow}>
          <Text style={[styles.rateSymbol, { color: colors.primary }]}>{getCurrencySymbol(currencyCode)}</Text>
          <TextInput
            style={[styles.rateInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            value={baseRateText}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, '');
              setBaseRateText(cleaned);
            }}
            onBlur={() => {
              const val = parseFloat(baseRateText);
              setBaseRate(!isNaN(val) && val >= 0 ? val : 0);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={8}
          />
          <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>/hour</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 14 }]} />

        <Text style={[styles.label, { color: colors.text }]}>Overtime Hourly Rate</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Overtime hourly rate for extra hours logged.
        </Text>
        <View style={styles.rateRow}>
          <Text style={[styles.rateSymbol, { color: colors.primary }]}>{getCurrencySymbol(currencyCode)}</Text>
          <TextInput
            style={[styles.rateInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            value={otRateText}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, '');
              setOtRateText(cleaned);
            }}
            onBlur={() => {
              const val = parseFloat(otRateText);
              setOvertimeRate(!isNaN(val) && val >= 0 ? val : 0);
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={8}
          />
          <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>/hour</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  divider: { height: 1 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1 },
  currencyChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, gap: 4 },
  currencySymbol: { fontSize: 14, fontWeight: '800' },
  currencyCode: { fontSize: 12, fontWeight: '600' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rateSymbol: { fontSize: 20, fontWeight: '800' },
  rateInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, fontWeight: '700' },
  rateUnit: { fontSize: 14, fontWeight: '600' },
  monthPickerBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  monthPickerText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
