import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShifts } from '../hooks/ShiftContext';
import { useAppSettings } from '../hooks/SettingsContext';
import { ShiftType, shiftCode } from '../constants/shifts';
import { formatDate, isRTL, plural, t, weekdayName } from '../i18n';
import { DURATION_OPTIONS, DurationOption, buildRepeatEntries, durationEndKey } from '../utils/patterns';
import { addDaysToKey, eachDayKey, fromDateKey } from '../utils/dates';
import { readableTextColor, withAlpha } from '../utils/color';
import { Chip, SectionLabel } from './ui/primitives';
import { SheetActionBar, SheetHeader, useSheetChrome } from './ui/sheet';

interface Props {
  /** Only the active quick-fill sheet publishes a calendar preview. */
  active: boolean;
  patternStart: string | null;
  patternEnd: string | null;
  onReset: () => void;
  onClose: () => void;
  onApply: (entries: Record<string, string | null>, summary: string) => void;
  onPreview: (preview: Map<string, ShiftType | null> | null) => void;
}

/** Collapsed height of the quick-fill sheets; the calendar shrinks by this much so previews stay visible. */
export const QUICK_FILL_COLLAPSED = 190;

export function durationLabel(option: DurationOption, startKey: string) {
  if (option === 'month') return t('Until {date}', { date: formatDate(fromDateKey(durationEndKey(startKey, 'month')), 'MMM d') });
  return option === '3m' ? t('3 months') : option === '6m' ? t('6 months') : t('1 year');
}

export const RepeatSheet = forwardRef<BottomSheet, Props>(function RepeatSheet(
  { active, patternStart, patternEnd, onReset, onClose, onApply, onPreview },
  ref
) {
  const { colors } = useAppSettings();
  const { shiftData, leaveData, getShiftByCode } = useShifts();
  const chrome = useSheetChrome(colors);
  const snapPoints = useMemo(() => [QUICK_FILL_COLLAPSED, '58%', '88%'], []);
  const [duration, setDuration] = useState<DurationOption>('3m');

  const pattern = useMemo(() => {
    if (!patternStart || !patternEnd) return [];
    return eachDayKey(patternStart, patternEnd).map((key) => ({
      key,
      code: shiftData[key] ?? null,
      shift: shiftData[key] ? getShiftByCode(shiftData[key]) : undefined,
    }));
  }, [patternStart, patternEnd, shiftData, getShiftByCode]);

  const shiftCount = pattern.filter((d) => d.shift).length;
  const repeatFrom = patternEnd ? addDaysToKey(patternEnd, 1) : null;
  const plan = useMemo(() => {
    if (!patternEnd || !repeatFrom || shiftCount === 0) return null;
    const endKey = durationEndKey(repeatFrom, duration);
    if (endKey < repeatFrom) return null;
    return { endKey, ...buildRepeatEntries(pattern.map((d) => (d.shift ? d.code : null)), patternEnd, endKey, leaveData) };
  }, [pattern, patternEnd, repeatFrom, shiftCount, duration, leaveData]);

  // Show what will change directly on the calendar.
  useEffect(() => {
    if (!active) return;
    if (!plan) {
      onPreview(null);
      return;
    }
    const map = new Map<string, ShiftType | null>();
    for (const [key, code] of Object.entries(plan.entries)) {
      const current = shiftData[key] ?? null;
      if (current !== code) map.set(key, code ? getShiftByCode(code) ?? null : null);
    }
    onPreview(map);
  }, [active, plan, shiftData, getShiftByCode, onPreview]);

  const step = !patternStart ? 1 : !patternEnd ? 2 : 3;
  const hint =
    step === 1 ? t('Tap the first day of your pattern on the calendar.') : step === 2 ? t('Now tap the last day of the pattern.') : null;
  const changed = plan ? Object.keys(plan.entries).filter((k) => (shiftData[k] ?? null) !== plan.entries[k]).length : 0;

  const apply = () => {
    if (!plan || !repeatFrom) return;
    onApply(
      plan.entries,
      t('Pattern repeated · {from} – {to}', {
        from: formatDate(fromDateKey(repeatFrom), 'MMM d'),
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
        <SheetHeader title={t('Repeat pattern')} subtitle={hint ?? undefined} colors={colors} onClose={onClose} />
        {!hint && (
          <SheetActionBar
            summary={
              shiftCount === 0
                ? t('Those days have no shifts to repeat yet.')
                : plan && repeatFrom
                  ? `${formatDate(fromDateKey(repeatFrom), 'MMM d')} – ${formatDate(fromDateKey(plan.endKey), 'MMM d')}\n${t('{n}-day pattern', {
                      n: pattern.length,
                    })} · ${plural(changed, '1 change', '{n} changes')}`
                  : t('Pick a longer period below.')
            }
            actionLabel={t('Apply')}
            onAction={apply}
            onOptions={() => {
              if (ref && typeof ref !== 'function') ref.current?.snapToIndex(1);
            }}
            disabled={!plan || changed === 0}
            colors={colors}
          />
        )}

        <View style={styles.rangeRow}>
          {[
            { label: t('From'), value: patternStart },
            { label: t('To'), value: patternEnd },
          ].map((r, i) => (
            <React.Fragment key={i}>
              {i === 1 && <MaterialCommunityIcons name={isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={colors.textMuted} />}
              <View
                style={[
                  styles.rangeBox,
                  {
                    backgroundColor: r.value ? withAlpha(colors.primary, 0.12) : colors.surfaceVariant,
                    borderColor: r.value ? withAlpha(colors.primary, 0.4) : colors.border,
                  },
                ]}
              >
                <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{r.label}</Text>
                <Text style={[styles.rangeValue, { color: r.value ? colors.text : colors.textMuted }]}>
                  {r.value ? formatDate(fromDateKey(r.value), 'EEE, MMM d') : t('Tap a day')}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {pattern.length > 0 && (
          <>
            <SectionLabel colors={colors} right={patternStart ? <Chip label={t('Reset')} icon="close" compact onPress={onReset} colors={colors} /> : undefined}>
              {`${t('{n}-day pattern', { n: pattern.length })} · ${plural(shiftCount, '1 shift', '{n} shifts')}`}
            </SectionLabel>
            <View style={styles.patternGrid}>
              {pattern.map((d) => (
                <View key={d.key} style={styles.patternDay}>
                  <Text style={[styles.patternDow, { color: colors.textMuted }]}>{weekdayName(fromDateKey(d.key).getDay(), 'narrow')}</Text>
                  <View style={[styles.patternBadge, { backgroundColor: d.shift ? d.shift.color : colors.surfaceVariant }]}>
                    <Text style={[styles.patternCode, { color: d.shift ? readableTextColor(d.shift.color) : colors.textMuted }]}>
                      {d.shift ? shiftCode(d.shift) : '–'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {shiftCount === 0 && (
              <View style={[styles.warn, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.warnText, { color: colors.warning }]}>
                  {t('These days have no shifts yet. Assign shifts to them first, then repeat.')}
                </Text>
              </View>
            )}
          </>
        )}

        {repeatFrom && shiftCount > 0 && (
          <>
            <SectionLabel colors={colors}>{t('Repeat for')}</SectionLabel>
            <View style={styles.chips}>
              {DURATION_OPTIONS.map((opt) => (
                <Chip key={opt} label={durationLabel(opt, repeatFrom)} selected={duration === opt} onPress={() => setDuration(opt)} colors={colors} />
              ))}
            </View>
            <Text style={[styles.summary, { color: colors.textSecondary }]}>
              {plan
                ? [
                    t('Repeats until {date}.', { date: formatDate(fromDateKey(plan.endKey), 'MMM d, yyyy') }),
                    plan.keptLeave ? plural(plan.keptLeave, '1 leave day stays as it is.', '{n} leave days stay as they are.') : '',
                    t('Blank days in the pattern clear shifts.'),
                  ]
                    .filter(Boolean)
                    .join(' ')
                : t('The pattern already reaches the end of this period — pick a longer one.')}
            </Text>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeBox: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12 },
  rangeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  rangeValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  patternGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patternDay: { alignItems: 'center', gap: 4 },
  patternDow: { fontSize: 10, fontWeight: '700' },
  patternBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  patternCode: { fontSize: 12, fontWeight: '800' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  warnText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summary: { fontSize: 13, lineHeight: 19, marginTop: 12 },
});
