import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/SettingsContext';
import { useShifts } from '../hooks/ShiftContext';
import { SHIFT_TEMPLATES, ShiftTemplate } from '../constants/templates';
import { ThemeColors } from '../constants/colors';
import { buildTemplateEntries, defaultSlotMapping, durationEndKey } from '../utils/patterns';
import { readableTextColor, withAlpha } from '../utils/color';
import { todayKey } from '../utils/dates';
import { haptic } from '../utils/haptics';
import { Tap } from './ui/Tap';
import { Button, Segmented } from './ui/primitives';

const FEATURES: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; text: string }[] = [
  { icon: 'brush-variant', title: 'Fill a month in seconds', text: 'Paint days, repeat a pattern, or apply a rotation template.' },
  { icon: 'bell-ring-outline', title: 'Never miss a shift', text: 'Evening reminders and a loud pre-shift alarm.' },
  { icon: 'chart-box-outline', title: 'Know your hours & pay', text: 'Overtime, leave balance and monthly estimates.' },
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
                  <Text style={[styles.demoPillText, { color: readableTextColor(color) }]}>{code}</Text>
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
          <Tap onPress={settings.completeOnboarding} accessibilityLabel="Skip setup" style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Tap>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)}>
          {step === 0 && (
            <>
              <DemoCalendar colors={colors} />
              <Text style={[styles.title, { color: colors.text }]}>Your shifts,{'\n'}at a glance</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                A private, offline calendar built for shift work.
              </Text>
              <View style={styles.features}>
                {FEATURES.map((f) => (
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
              <Text style={[styles.title, { color: colors.text }]}>Make it yours</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>You can change these any time in Settings.</Text>
              <Text style={[styles.label, { color: colors.text }]}>Week starts on</Text>
              <Segmented
                options={[
                  { value: 6, label: 'Saturday' },
                  { value: 0, label: 'Sunday' },
                  { value: 1, label: 'Monday' },
                ]}
                value={settings.weekStart}
                onChange={(v) => settings.updateSetting('weekStart', v)}
                colors={colors}
              />
              <Text style={[styles.label, { color: colors.text }]}>Time format</Text>
              <Segmented
                options={[
                  { value: '24h', label: '24-hour · 15:00' },
                  { value: '12h', label: '12-hour · 3 PM' },
                ]}
                value={settings.timeFormat}
                onChange={(v) => settings.updateSetting('timeFormat', v)}
                colors={colors}
              />
              <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
              <Segmented
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'Auto' },
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
              <Text style={[styles.title, { color: colors.text }]}>Work a rotation?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pick one to fill the next 3 months from today. You can fine-tune any day afterwards.
              </Text>
              {SHIFT_TEMPLATES.slice(0, 6).map((t) => {
                const selected = template?.id === t.id;
                return (
                  <Tap
                    key={t.id}
                    onPress={() => {
                      haptic.selection();
                      setTemplate(selected ? null : t);
                    }}
                    accessibilityLabel={`${t.name}: ${t.description}`}
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
                      <Text style={[styles.templateName, { color: colors.text }]}>{t.name}</Text>
                      <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t.description}</Text>
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
          label={step === 0 ? 'Get started' : step === 1 ? 'Continue' : template ? `Use ${template.name}` : 'I’ll set it up myself'}
          icon={step === 2 ? 'check' : 'arrow-right'}
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
