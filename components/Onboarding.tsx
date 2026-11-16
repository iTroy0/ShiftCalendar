import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/SettingsContext';
import { useShifts } from '../hooks/ShiftContext';
import { SHIFT_TEMPLATES, ShiftTemplate } from '../constants/templates';
import { ThemeColors } from '../constants/colors';
import { shiftCode } from '../constants/shifts';
import { buildTemplateEntries, defaultSlotMapping, durationEndKey } from '../utils/patterns';
import { readableTextColor, withAlpha } from '../utils/color';
import { todayKey } from '../utils/dates';
import { haptic } from '../utils/haptics';
import { isRTL, t, weekdayName } from '../i18n';
import { Tap } from './ui/Tap';
import { Button, Segmented } from './ui/primitives';

const features = (): { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; text: string }[] => [
  { icon: 'brush-variant', title: t('Fill a month in seconds'), text: t('Paint days, repeat a pattern, or apply a rotation template.') },
  { icon: 'bell-ring-outline', title: t('Never miss a shift'), text: t('Evening reminders and a loud pre-shift alarm.') },
  { icon: 'chart-box-outline', title: t('Know your hours & pay'), text: t('Overtime, leave balance and monthly estimates.') },
];

const DEMO = ['M', 'M', 'A', 'A', 'N', 'N', 'O', 'O', 'M', 'M', 'A', 'A', 'N', 'N', 'O', 'O', 'M', 'M', 'A', 'A', 'N'];

function DemoCalendar({ colors }: { colors: ThemeColors }) {
  const { getShiftByCode } = useShifts();
  return (
    <View style={[styles.demo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.demoRow}>
          {DEMO.slice(row * 7, row * 7 + 7).map((code, i) => {
            const shift = getShiftByCode(code);
            const color = shift?.color ?? colors.border;
            return (
              <View key={i} style={[styles.demoCell, { backgroundColor: withAlpha(color, 0.16) }]}>
                <Text style={[styles.demoDay, { color: colors.textSecondary }]}>{row * 7 + i + 1}</Text>
                <View style={[styles.demoPill, { backgroundColor: color }]}>
                  <Text style={[styles.demoPillText, { color: readableTextColor(color) }]}>{shift ? shiftCode(shift) : code}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** First-run setup: welcome, preferences, and an optional rotation to pre-fill the calendar. */
export function Onboarding() {
  const settings = useAppSettings();
  const { colors } = settings;
  const { allShifts, leaveData, applyShiftEntries } = useShifts();
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<ShiftTemplate | null>(null);
  const mapping = useMemo(() => defaultSlotMapping(allShifts), [allShifts]);

  const finish = () => {
    if (template) {
      const start = todayKey();
      const { entries } = buildTemplateEntries(template.pattern, mapping, start, durationEndKey(start, '3m'), leaveData);
      applyShiftEntries(entries);
    }
    haptic.success();
    settings.completeOnboarding();
  };

  const next = () => {
    haptic.light();
    if (step < 2) setStep(step + 1);
    else finish();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, { width: i === step ? 24 : 8, backgroundColor: i <= step ? colors.primary : withAlpha(colors.primary, 0.25) }]}
            />
          ))}
        </View>
        {step < 2 && (
          <Tap onPress={settings.completeOnboarding} accessibilityLabel={t('Skip setup')} style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('Skip')}</Text>
          </Tap>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
          {step === 0 && (
            <>
              <DemoCalendar colors={colors} />
              <Text style={[styles.title, { color: colors.text }]}>{t('Your shifts,\nat a glance')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('A private, offline calendar built for shift work.')}
              </Text>
              <View style={styles.features}>
                {features().map((f) => (
                  <View key={f.title} style={styles.feature}>
                    <View style={[styles.featureIcon, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
                      <MaterialCommunityIcons name={f.icon} size={22} color={colors.primaryText} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <View style={[styles.stepIcon, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
                <MaterialCommunityIcons name="tune-variant" size={30} color={colors.primaryText} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{t('Make it yours')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('You can change these any time in Settings.')}</Text>
              <Text style={[styles.label, { color: colors.text }]}>{t('Week starts on')}</Text>
              <Segmented
                options={[
                  { value: 6, label: weekdayName(6) },
                  { value: 0, label: weekdayName(0) },
                  { value: 1, label: weekdayName(1) },
                ]}
                value={settings.weekStart}
                onChange={(v) => settings.updateSetting('weekStart', v)}
                colors={colors}
              />
              <Text style={[styles.label, { color: colors.text }]}>{t('Time format')}</Text>
              <Segmented
                options={[
                  { value: '24h', label: t('24-hour · 15:00') },
                  { value: '12h', label: t('12-hour · 3 PM') },
                ]}
                value={settings.timeFormat}
                onChange={(v) => settings.updateSetting('timeFormat', v)}
                colors={colors}
              />
              <Text style={[styles.label, { color: colors.text }]}>{t('Theme')}</Text>
              <Segmented
                options={[
                  { value: 'light', label: t('Light') },
                  { value: 'dark', label: t('Dark') },
                  { value: 'system', label: t('Auto') },
                ]}
                value={settings.themeMode}
                onChange={(v) => settings.updateSetting('themeMode', v)}
                colors={colors}
              />
            </>
          )}

          {step === 2 && (
            <>
              <View style={[styles.stepIcon, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
                <MaterialCommunityIcons name="view-grid-plus-outline" size={30} color={colors.primaryText} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{t('Work a rotation?')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('Pick one to fill the next 3 months from today. You can fine-tune any day afterwards.')}
              </Text>
              {SHIFT_TEMPLATES.slice(0, 6).map((tpl) => {
                const selected = template?.id === tpl.id;
                return (
                  <Tap
                    key={tpl.id}
                    onPress={() => {
                      haptic.selection();
                      setTemplate(selected ? null : tpl);
                    }}
                    accessibilityLabel={`${t(tpl.name)}: ${t(tpl.description)}`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.template,
                      {
                        backgroundColor: selected ? withAlpha(colors.primary, 0.12) : colors.surface,
                        borderColor: selected ? colors.primaryText : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text style={[styles.templateName, { color: colors.text }]}>{t(tpl.name)}</Text>
                      <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t(tpl.description)}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={selected ? colors.primaryText : colors.textMuted}
                    />
                  </Tap>
                );
              })}
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            step === 0
              ? t('Get started')
              : step === 1
                ? t('Continue')
                : template
                  ? t('Use {name}', { name: t(template.name) })
                  : t('I’ll set it up myself')
          }
          icon={step === 2 ? 'check' : isRTL ? 'arrow-left' : 'arrow-right'}
          iconPosition={step === 2 ? 'left' : 'right'}
          onPress={next}
          colors={colors}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 52 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skip: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { fontSize: 15, fontWeight: '700' },
  body: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1, justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' },
  demo: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 10, gap: 6, marginBottom: 28 },
  demoRow: { flexDirection: 'row', gap: 6 },
  demoCell: { flex: 1, aspectRatio: 0.8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  demoDay: { fontSize: 10, fontWeight: '700' },
  demoPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  demoPillText: { fontSize: 10, fontWeight: '800' },
  stepIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, lineHeight: 38 },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 8 },
  features: { gap: 18, marginTop: 22 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 16, fontWeight: '800' },
  featureText: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  label: { fontSize: 15, fontWeight: '700', marginTop: 22, marginBottom: 8 },
  template: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, marginTop: 10 },
  templateName: { fontSize: 16, fontWeight: '800' },
  templateDesc: { fontSize: 13, marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, maxWidth: 560, width: '100%', alignSelf: 'center' },
});
