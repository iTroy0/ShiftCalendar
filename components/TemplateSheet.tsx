import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShifts } from '../hooks/ShiftContext';
import { useAppSettings } from '../hooks/SettingsContext';
import { ShiftType, shiftCode, shiftName } from '../constants/shifts';
import { formatDate, plural, t } from '../i18n';
import { SHIFT_TEMPLATES, SLOT_LABELS, ShiftTemplate, TemplateSlot } from '../constants/templates';
import {
  DURATION_OPTIONS,
  DurationOption,
  SlotMapping,
  buildTemplateEntries,
  defaultSlotMapping,
  durationEndKey,
} from '../utils/patterns';
import { fromDateKey, todayKey } from '../utils/dates';
import { readableTextColor, withAlpha } from '../utils/color';
import { haptic } from '../utils/haptics';
import { Tap } from './ui/Tap';
import { Chip, SectionLabel } from './ui/primitives';
import { SheetActionBar, SheetHeader, useSheetChrome } from './ui/sheet';
import { QUICK_FILL_COLLAPSED, durationLabel } from './RepeatSheet';

interface Props {
  /** Only the active quick-fill sheet publishes a calendar preview. */
  active: boolean;
  startKey: string;
  onStartChange: (key: string) => void;
  onClose: () => void;
  onApply: (entries: Record<string, string>, summary: string) => void;
  onPreview: (preview: Map<string, ShiftType | null> | null) => void;
  onTemplateChange: (template: ShiftTemplate | null) => void;
}

function PatternStrip({ template, mapping, size = 30 }: { template: ShiftTemplate; mapping: SlotMapping; size?: number }) {
  const { colors } = useAppSettings();
  const { getShiftByCode } = useShifts();
  return (
    <View style={styles.strip}>
      {template.pattern.map((slot, i) => {
        const shift = mapping[slot] ? getShiftByCode(mapping[slot]!) : undefined;
        return (
          <View
            key={i}
            style={[
              styles.stripCell,
              { width: size, height: size, borderRadius: size / 3.2, backgroundColor: shift ? shift.color : colors.surfaceVariant },
            ]}
          >
            <Text style={[styles.stripText, { color: shift ? readableTextColor(shift.color) : colors.textMuted, fontSize: size > 24 ? 11 : 9 }]}>
              {shift ? shiftCode(shift) : '–'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export const TemplateSheet = forwardRef<BottomSheet, Props>(function TemplateSheet(
  { active, startKey, onStartChange, onClose, onApply, onPreview, onTemplateChange },
  ref
) {
  const { colors } = useAppSettings();
  const { allShifts, shiftData, leaveData, getShiftByCode } = useShifts();
  const chrome = useSheetChrome(colors);
  const snapPoints = useMemo(() => [QUICK_FILL_COLLAPSED, '58%', '88%'], []);
  const [template, setTemplate] = useState<ShiftTemplate | null>(null);
  const [duration, setDuration] = useState<DurationOption>('3m');
  const autoMapping = useMemo(() => defaultSlotMapping(allShifts), [allShifts]);
  const [mapping, setMapping] = useState<SlotMapping>(autoMapping);
  useEffect(() => setMapping(autoMapping), [autoMapping]);

  // Start fresh each time template mode opens.
  useEffect(() => {
    if (!active) {
      setTemplate(null);
      setDuration('3m');
    }
  }, [active]);

  const snapTo = (index: number) => {
    if (ref && typeof ref !== 'function') ref.current?.snapToIndex(index);
  };

  // After picking a rotation, collapse so its preview is visible on the calendar.
  const choose = (picked: ShiftTemplate | null) => {
    haptic.light();
    setTemplate(picked);
    onTemplateChange(picked);
    snapTo(picked ? 0 : 2);
  };

  const plan = useMemo(() => {
    if (!template || !active) return null;
    const endKey = durationEndKey(startKey, duration);
    return { endKey, ...buildTemplateEntries(template.pattern, mapping, startKey, endKey, leaveData) };
  }, [template, active, mapping, startKey, duration, leaveData]);

  useEffect(() => {
    if (!active) return;
    if (!plan) {
      onPreview(null);
      return;
    }
    const map = new Map<string, ShiftType | null>();
    for (const [key, code] of Object.entries(plan.entries)) {
      if (shiftData[key] !== code) map.set(key, getShiftByCode(code) ?? null);
    }
    onPreview(map);
  }, [active, plan, shiftData, getShiftByCode, onPreview]);

  const usedSlots = useMemo(
    () => (template ? (['M', 'A', 'N', 'O'] as TemplateSlot[]).filter((s) => template.pattern.includes(s)) : []),
    [template]
  );
  const unmapped = usedSlots.filter((s) => !mapping[s]);
  const changed = plan ? Object.keys(plan.entries).filter((k) => shiftData[k] !== plan.entries[k]).length : 0;

  const apply = () => {
    if (!plan || !template) return;
    onApply(
      plan.entries,
      t('{name} applied · {from} – {to}', {
        name: t(template.name),
        from: formatDate(fromDateKey(startKey), 'MMM d'),
        to: formatDate(fromDateKey(plan.endKey), 'MMM d, yyyy'),
      })
    );
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={onClose}
      {...chrome}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!template ? (
          <>
            <SheetHeader
              title={t('Rotation templates')}
              subtitle={t('Pick a rotation — you’ll see a preview on the calendar before anything changes.')}
              colors={colors}
              onClose={onClose}
            />
            {SHIFT_TEMPLATES.map((tpl) => (
              <Tap
                key={tpl.id}
                onPress={() => choose(tpl)}
                activeOpacity={0.7}
                accessibilityLabel={`${t(tpl.name)}: ${t(tpl.description)}`}
                style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.templateTop}>
                  <View style={styles.flex}>
                    <Text style={[styles.templateName, { color: colors.text }]}>{t(tpl.name)}</Text>
                    <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t(tpl.description)}</Text>
                  </View>
                  <View style={[styles.cycle, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                    <Text style={[styles.cycleText, { color: colors.primaryText }]}>{plural(tpl.pattern.length, '1 day', '{n} days')}</Text>
                  </View>
                </View>
                <PatternStrip template={tpl} mapping={mapping} size={18} />
              </Tap>
            ))}
          </>
        ) : (
          <>
            <SheetHeader title={t(template.name)} colors={colors} onBack={() => choose(null)} onClose={onClose} />
            <SheetActionBar
              summary={
                plan
                  ? `${formatDate(fromDateKey(startKey), 'MMM d')} – ${formatDate(fromDateKey(plan.endKey), 'MMM d')}\n${plural(changed, '1 change', '{n} changes')}${
                      plan.keptLeave ? ` · ${t('{n} leave kept', { n: plan.keptLeave })}` : ''
                    }`
                  : ''
              }
              actionLabel={t('Apply')}
              onAction={apply}
              onOptions={() => snapTo(1)}
              disabled={!plan || changed === 0}
              colors={colors}
            />
            <PatternStrip template={template} mapping={mapping} />
            <Text style={[styles.summary, { color: colors.textSecondary }]}>{t(template.description)}</Text>

            <SectionLabel colors={colors}>{t('Starts on')}</SectionLabel>
            <View style={[styles.startRow, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="calendar-start" size={20} color={colors.primaryText} />
              <View style={styles.flex}>
                <Text style={[styles.startDate, { color: colors.text }]}>{formatDate(fromDateKey(startKey), 'EEEE, MMM d, yyyy')}</Text>
                <Text style={[styles.startHint, { color: colors.textSecondary }]}>{t('Tap a day on the calendar to change')}</Text>
              </View>
              {startKey !== todayKey() && <Chip label={t('Today')} compact onPress={() => onStartChange(todayKey())} colors={colors} />}
            </View>

            <SectionLabel colors={colors}>{t('Fill for')}</SectionLabel>
            <View style={styles.chips}>
              {DURATION_OPTIONS.map((opt) => (
                <Chip key={opt} label={durationLabel(opt, startKey)} selected={duration === opt} onPress={() => setDuration(opt)} colors={colors} />
              ))}
            </View>

            <SectionLabel colors={colors}>{t('Shift mapping')}</SectionLabel>
            <Text style={[styles.mappingHint, { color: colors.textSecondary }]}>
              {t('Choose which of your shifts fills each part of the rotation.')}
            </Text>
            {unmapped.length > 0 && (
              <View style={[styles.warn, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.warnText, { color: colors.warning }]}>
                  {unmapped.length === 1
                    ? t('{slots} is skipped — pick a shift below.', { slots: t(SLOT_LABELS[unmapped[0]]) })
                    : t('{slots} are skipped — pick a shift below.', { slots: unmapped.map((s) => t(SLOT_LABELS[s])).join(t(', ')) })}
                </Text>
              </View>
            )}
            {usedSlots.map((slot) => (
              <View key={slot} style={styles.mappingRow}>
                <Text style={[styles.slotLabel, { color: colors.text }]}>{t(SLOT_LABELS[slot])}</Text>
                <View style={styles.mappingChips}>
                  {allShifts.map((s) => (
                    <Chip
                      key={s.code}
                      label={`${shiftCode(s)} · ${shiftName(s)}`}
                      color={s.color}
                      selected={mapping[slot] === s.code}
                      onPress={() => setMapping((m) => ({ ...m, [slot]: s.code }))}
                      colors={colors}
                      compact
                    />
                  ))}
                  <Chip label={t('Skip')} selected={!mapping[slot]} onPress={() => setMapping((m) => ({ ...m, [slot]: null }))} colors={colors} compact />
                </View>
              </View>
            ))}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  templateCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10, gap: 10 },
  templateTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  templateName: { fontSize: 16, fontWeight: '800' },
  templateDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  cycle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cycleText: { fontSize: 11, fontWeight: '800' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  stripCell: { alignItems: 'center', justifyContent: 'center' },
  stripText: { fontWeight: '800' },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  startDate: { fontSize: 15, fontWeight: '700' },
  startHint: { fontSize: 12, marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  mappingHint: { fontSize: 13, marginBottom: 8 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 8 },
  warnText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  mappingRow: { marginBottom: 12 },
  slotLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  mappingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
