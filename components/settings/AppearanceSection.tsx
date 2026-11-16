import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { ThemeMode } from '../../hooks/useSettings';
import { WeekStart } from '../../utils/dates';
import { TimeFormat } from '../../utils/time';
import { haptic } from '../../utils/haptics';
import { LANGUAGE_NAMES, Language, LanguageSetting, getLanguage, isRTL, isRTLLanguage, t, weekdayName } from '../../i18n';
import { Segmented, SectionLabel } from '../ui/primitives';
import { Tap } from '../ui/Tap';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  language: LanguageSetting;
  setLanguage: (v: LanguageSetting) => void;
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

/** A row that drops down the languages, each named in itself so it can be found from any language. */
function LanguagePicker({ value, onChange, colors }: { value: LanguageSetting; onChange: (v: LanguageSetting) => void; colors: ThemeColors }) {
  const [open, setOpen] = useState(false);
  const options: [LanguageSetting, string][] = [['system', t('Auto')], ...(Object.entries(LANGUAGE_NAMES) as [Language, string][])];
  return (
    <View>
      <SettingsRow
        icon="translate"
        title={t('Language')}
        value={value === 'system' ? `${t('Auto')} · ${LANGUAGE_NAMES[getLanguage()]}` : LANGUAGE_NAMES[value]}
        colors={colors}
        onPress={() => setOpen((o) => !o)}
        right={<MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />}
        chevron={false}
      />
      {open &&
        options.map(([code, name]) => {
          const selected = code === value;
          return (
            <Tap
              key={code}
              onPress={() => {
                setOpen(false);
                onChange(code);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={name}
              style={styles.option}
            >
              <Text style={[styles.optionText, { color: selected ? colors.primaryText : colors.text }]}>{name}</Text>
              {selected && <MaterialCommunityIcons name="check" size={20} color={colors.primaryText} />}
            </Tap>
          );
        })}
    </View>
  );
}

export function AppearanceSection(props: Props) {
  const { colors } = props;
  const pick = <T,>(fn: (v: T) => void) => (v: T) => {
    haptic.selection();
    fn(v);
  };
  const chooseLanguage = (v: LanguageSetting) => {
    pick(props.setLanguage)(v);
    if (isRTL !== isRTLLanguage()) {
      Alert.alert(t('Restart needed'), t('Close ShiftCalendar and open it again to finish switching the layout direction.'));
    }
  };
  return (
    <>
      <SectionLabel colors={colors}>{t('Appearance')}</SectionLabel>
      <SettingsCard colors={colors}>
        <LanguagePicker value={props.language} onChange={chooseLanguage} colors={colors} />
        <Labeled label={t('Theme')} colors={colors}>
          <Segmented
            options={[
              { value: 'light', label: t('Light'), icon: 'white-balance-sunny' },
              { value: 'dark', label: t('Dark'), icon: 'weather-night' },
              { value: 'system', label: t('Auto'), icon: 'theme-light-dark' },
            ]}
            value={props.themeMode}
            onChange={pick(props.setThemeMode)}
            colors={colors}
          />
        </Labeled>
        <Labeled label={t('Week starts on')} colors={colors}>
          <Segmented
            options={[
              { value: 6, label: weekdayName(6) },
              { value: 0, label: weekdayName(0) },
              { value: 1, label: weekdayName(1) },
            ]}
            value={props.weekStart}
            onChange={pick(props.setWeekStart)}
            colors={colors}
          />
        </Labeled>
        <Labeled label={t('Time format')} colors={colors}>
          <Segmented
            options={[
              { value: '24h', label: t('24-hour · 15:00') },
              { value: '12h', label: t('12-hour · 3 PM') },
            ]}
            value={props.timeFormat}
            onChange={pick(props.setTimeFormat)}
            colors={colors}
          />
        </Labeled>
        <SettingsRow
          icon="clock-time-four-outline"
          title={t('Start times on calendar')}
          subtitle={t('Show each shift’s start time in the month grid')}
          colors={colors}
          switchValue={props.showShiftTimes}
          onSwitch={props.setShowShiftTimes}
        />
        <SettingsRow
          icon="vibrate"
          title={t('Haptic feedback')}
          subtitle={t('Subtle vibrations when you tap and assign')}
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
  // Indented past the row icon, so the names line up with the row titles.
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingLeft: 60, paddingRight: 14 },
  optionText: { fontSize: 15, fontWeight: '600' },
});
