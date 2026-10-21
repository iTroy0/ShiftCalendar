import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useShifts } from '../hooks/ShiftContext';
import { useAppSettings } from '../hooks/SettingsContext';
import { ShiftType } from '../constants/shifts';
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
              {shift ? shift.code : '–'}
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
  const choose = (t: ShiftTemplate | null) => {
    haptic.light();
    setTemplate(t);
    onTemplateChange(t);
    snapTo(t ? 0 : 2);
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
    onApply(plan.entries, `${template.name} applied · ${format(fromDateKey(startKey), 'MMM d')} – ${format(fromDateKey(plan.endKey), 'MMM d, yyyy')}`);
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
            <SheetHeader title="Rotation templates" subtitle="Pick a rotation — you’ll see a preview on the calendar before anything changes." colors={colors} onClose={onClose} />
            {SHIFT_TEMPLATES.map((t) => (
              <Tap
                key={t.id}
                onPress={() => choose(t)}
                activeOpacity={0.7}
                accessibilityLabel={`${t.name}: ${t.description}`}
                style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.templateTop}>
                  <View style={styles.flex}>
                    <Text style={[styles.templateName, { color: colors.text }]}>{t.name}</Text>
                    <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>{t.description}</Text>
                  </View>
                  <View style={[styles.cycle, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                    <Text style={[styles.cycleText, { color: colors.primaryText }]}>{t.pattern.length} days</Text>
                  </View>
                </View>
                <PatternStrip template={t} mapping={mapping} size={18} />
              </Tap>
            ))}
          </>
        ) : (
          <>
            <SheetHeader title={template.name} colors={colors} onBack={() => choose(null)} onClose={onClose} />
            <SheetActionBar
              summary={
                plan
                  ? `${format(fromDateKey(startKey), 'MMM d')} – ${format(fromDateKey(plan.endKey), 'MMM d')}\n${changed} change${changed === 1 ? '' : 's'}${plan.keptLeave ? ` · ${plan.keptLeave} leave kept` : ''}`
                  : ''
              }
              actionLabel="Apply"
              onAction={apply}
              onOptions={() => snapTo(1)}
              disabled={!plan || changed === 0}
              colors={colors}
            />
            <PatternStrip template={template} mapping={mapping} />
            <Text style={[styles.summary, { color: colors.textSecondary }]}>{template.description}</Text>

            <SectionLabel colors={colors}>Starts on</SectionLabel>
            <View style={[styles.startRow, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="calendar-start" size={20} color={colors.primaryText} />
              <View style={styles.flex}>
                <Text style={[styles.startDate, { color: colors.text }]}>{format(fromDateKey(startKey), 'EEEE, MMM d, yyyy')}</Text>
                <Text style={[styles.startHint, { color: colors.textSecondary }]}>Tap a day on the calendar to change</Text>
              </View>
              {startKey !== todayKey() && <Chip label="Today" compact onPress={() => onStartChange(todayKey())} colors={colors} />}
            </View>

            <SectionLabel colors={colors}>Fill for</SectionLabel>
            <View style={styles.chips}>
              {DURATION_OPTIONS.map((opt) => (
                <Chip key={opt} label={durationLabel(opt, startKey)} selected={duration === opt} onPress={() => setDuration(opt)} colors={colors} />
              ))}
            </View>

            <SectionLabel colors={colors}>Shift mapping</SectionLabel>
            <Text style={[styles.mappingHint, { color: colors.textSecondary }]}>
              Choose which of your shifts fills each part of the rotation.
            </Text>
            {unmapped.length > 0 && (
              <View style={[styles.warn, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.warnText, { color: colors.warning }]}>
                  {unmapped.map((s) => SLOT_LABELS[s]).join(', ')} {unmapped.length === 1 ? 'is' : 'are'} skipped — pick a shift below.
                </Text>
              </View>
            )}
            {usedSlots.map((slot) => (
              <View key={slot} style={styles.mappingRow}>
                <Text style={[styles.slotLabel, { color: colors.text }]}>{SLOT_LABELS[slot]}</Text>
                <View style={styles.mappingChips}>
                  {allShifts.map((s) => (
                    <Chip
                      key={s.code}
                      label={`${s.code} · ${s.label}`}
                      color={s.color}
                      selected={mapping[slot] === s.code}
                      onPress={() => setMapping((m) => ({ ...m, [slot]: s.code }))}
                      colors={colors}
                      compact
                    />
                  ))}
                  <Chip label="Skip" selected={!mapping[slot]} onPress={() => setMapping((m) => ({ ...m, [slot]: null }))} colors={colors} compact />
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
