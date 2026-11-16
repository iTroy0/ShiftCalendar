import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { haptic } from '../../utils/haptics';
import { t } from '../../i18n';
import { Tap } from '../ui/Tap';
import { SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  calendarName: string;
  leaveTypes: LeaveType[];
  leaveBalances: Record<string, number>;
  setLeaveBalance: (id: string, days: number) => void;
}

function DaysStepper({ value, onChange, colors, label }: { value: number; onChange: (v: number) => void; colors: ThemeColors; label: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const step = (d: number) => {
    haptic.selection();
    onChange(Math.max(0, Math.min(365, value + d)));
  };
  return (
    <View style={[styles.stepper, { backgroundColor: colors.surfaceVariant }]}>
      <Tap
        onPress={() => step(-1)}
        disabled={value <= 0}
        accessibilityLabel={t('Fewer {name} days', { name: label })}
        style={[styles.stepBtn, { opacity: value <= 0 ? 0.35 : 1 }]}
      >
        <MaterialCommunityIcons name="minus" size={16} color={colors.text} />
      </Tap>
      <TextInput
        value={text}
        onChangeText={(input) => {
          const digits = input.replace(/[^0-9]/g, '').slice(0, 3);
          setText(digits);
          if (digits) onChange(Math.min(parseInt(digits, 10), 365));
        }}
        onBlur={() => setText(String(value))}
        keyboardType="number-pad"
        accessibilityLabel={t('{name} days per year', { name: label })}
        style={[styles.stepValue, { color: colors.text }]}
      />
      <Tap onPress={() => step(1)} accessibilityLabel={t('More {name} days', { name: label })} style={styles.stepBtn}>
        <MaterialCommunityIcons name="plus" size={16} color={colors.text} />
      </Tap>
    </View>
  );
}

export function LeaveBalanceSection({ colors, calendarName, leaveTypes, leaveBalances, setLeaveBalance }: Props) {
  return (
    <>
      <SectionLabel colors={colors}>{t('Leave allowance · {calendar}', { calendar: calendarName })}</SectionLabel>
      <SettingsCard colors={colors}>
        {leaveTypes.map((lt) => (
          <SettingsRow
            key={lt.id}
            icon={lt.icon as any}
            iconColor={lt.color}
            title={t(lt.label)}
            subtitle={lt.paid ? t('Paid · days per year') : t('Unpaid · days per year')}
            colors={colors}
            right={
              <DaysStepper
                value={leaveBalances[lt.id] ?? lt.defaultDays}
                onChange={(v) => setLeaveBalance(lt.id, v)}
                colors={colors}
                label={t(lt.label)}
              />
            }
          />
        ))}
      </SettingsCard>
      <Text style={[styles.footnote, { color: colors.textMuted }]}>{t('Remaining days for the current year are shown in Stats.')}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 3 },
  stepBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 38, textAlign: 'center', fontSize: 15, fontWeight: '800', paddingVertical: 0 },
  footnote: { fontSize: 12, marginTop: 6, marginHorizontal: 4 },
});
