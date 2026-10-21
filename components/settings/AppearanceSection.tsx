import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { ThemeMode } from '../../hooks/useSettings';
import { WeekStart } from '../../utils/dates';
import { TimeFormat } from '../../utils/time';
import { haptic } from '../../utils/haptics';
import { Segmented, SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  weekStart: WeekStart;
  setWeekStart: (v: WeekStart) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (v: TimeFormat) => void;
  showShiftTimes: boolean;
  setShowShiftTimes: (v: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => void;
}

function Labeled({ label, colors, children }: { label: string; colors: ThemeColors; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {children}
    </View>
  );
}

export function AppearanceSection(props: Props) {
  const { colors } = props;
  const pick = <T,>(fn: (v: T) => void) => (v: T) => {
    haptic.selection();
    fn(v);
  };
  return (
    <>
      <SectionLabel colors={colors}>Appearance</SectionLabel>
      <SettingsCard colors={colors}>
        <Labeled label="Theme" colors={colors}>
          <Segmented
            options={[
              { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
              { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
            ]}
            value={props.themeMode}
            onChange={pick(props.setThemeMode)}
            colors={colors}
          />
        </Labeled>
        <Labeled label="Week starts on" colors={colors}>
          <Segmented
            options={[
              { value: 6, label: 'Saturday' },
              { value: 0, label: 'Sunday' },
              { value: 1, label: 'Monday' },
            ]}
            value={props.weekStart}
            onChange={pick(props.setWeekStart)}
            colors={colors}
          />
        </Labeled>
        <Labeled label="Time format" colors={colors}>
          <Segmented
            options={[
              { value: '24h', label: '24-hour · 15:00' },
              { value: '12h', label: '12-hour · 3 PM' },
            ]}
            value={props.timeFormat}
            onChange={pick(props.setTimeFormat)}
            colors={colors}
          />
        </Labeled>
        <SettingsRow
          icon="clock-time-four-outline"
          title="Start times on calendar"
          subtitle="Show each shift’s start time in the month grid"
          colors={colors}
          switchValue={props.showShiftTimes}
          onSwitch={props.setShowShiftTimes}
        />
        <SettingsRow
          icon="vibrate"
          title="Haptic feedback"
          subtitle="Subtle vibrations when you tap and assign"
          colors={colors}
          switchValue={props.hapticsEnabled}
          onSwitch={props.setHapticsEnabled}
        />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  label: { fontSize: 15, fontWeight: '600' },
});
