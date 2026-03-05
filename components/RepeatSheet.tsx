import React, { useMemo, forwardRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  format,
  addDays,
  eachDayOfInterval,
  differenceInDays,
  endOfMonth,
  addMonths,
  endOfYear,
  parseISO,
} from 'date-fns';
import { ShiftType } from '../constants/shifts';

interface Props {
  shiftData: Record<string, string>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  onApplyPattern: (entries: Record<string, string>) => void;
  onClearPattern: () => void;
  currentMonth: Date;
  patternStart: string | null;
  patternEnd: string | null;
  colors: {
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
    primary: string;
  };
}

type RepeatTarget = 'month' | '3months' | '6months' | 'year';

export const RepeatSheet = forwardRef<BottomSheet, Props>(
  ({ shiftData, getShiftByCode, onApplyPattern, onClearPattern, currentMonth, patternStart, patternEnd, colors }, ref) => {
    const snapPoints = useMemo(() => ['55%', '85%'], []);

    // Auto-snap sheet when end date is picked
    useEffect(() => {
      if (patternStart && patternEnd && ref && typeof ref !== 'function' && ref.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        ref.current.snapToIndex(1); // expand to full view
      }
    }, [patternEnd]);

    const pattern = useMemo(() => {
      if (!patternStart || !patternEnd) return [];
      const start = parseISO(patternStart);
      const end = parseISO(patternEnd);
      if (start > end) return [];
      return eachDayOfInterval({ start, end }).map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const code = shiftData[dateStr];
        return {
          dayName: format(d, 'EEE'),
          dateLabel: format(d, 'd'),
          code,
          shift: code ? getShiftByCode(code) : undefined,
        };
      });
    }, [patternStart, patternEnd, shiftData, getShiftByCode]);

    const patternLength = pattern.length;
    const shiftCount = pattern.filter((d) => d.code).length;
    const hasShifts = shiftCount > 0;

    const applyRepeat = useCallback(
      (target: RepeatTarget) => {
        if (!patternStart || !patternEnd || !hasShifts) {
          Alert.alert('No Shifts', 'Your selected range has no shifts assigned. Assign shifts to those dates first, then repeat.');
          return;
        }

        const patternCodes = pattern.map((d) => d.code);

        let endDate: Date;
        switch (target) {
          case 'month':
            endDate = endOfMonth(currentMonth);
            break;
          case '3months':
            endDate = endOfMonth(addMonths(currentMonth, 2));
            break;
          case '6months':
            endDate = endOfMonth(addMonths(currentMonth, 5));
            break;
          case 'year':
            endDate = endOfYear(currentMonth);
            break;
        }

        const entries: Record<string, string> = {};
        const repeatStart = addDays(parseISO(patternEnd), 1);
        const totalDays = differenceInDays(endDate, repeatStart) + 1;

        if (totalDays <= 0) {
          Alert.alert('Nothing to Fill', 'The pattern already extends past the selected period.');
          return;
        }

        for (let i = 0; i < totalDays; i++) {
          const day = addDays(repeatStart, i);
          const code = patternCodes[i % patternLength];
          if (code) {
            entries[format(day, 'yyyy-MM-dd')] = code;
          }
        }

        const count = Object.keys(entries).length;
        const targetLabel =
          target === 'month'
            ? format(endOfMonth(currentMonth), 'MMM d')
            : target === '3months'
            ? format(endOfMonth(addMonths(currentMonth, 2)), 'MMM d, yyyy')
            : target === '6months'
            ? format(endOfMonth(addMonths(currentMonth, 5)), 'MMM d, yyyy')
            : format(endOfYear(currentMonth), 'MMM d, yyyy');

        Alert.alert(
          'Repeat Pattern',
          `Fill ${count} days with your ${patternLength}-day pattern?\n\n${format(repeatStart, 'MMM d')} → ${targetLabel}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Apply',
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onApplyPattern(entries);
              },
            },
          ]
        );
      },
      [pattern, patternStart, patternEnd, hasShifts, patternLength, currentMonth, onApplyPattern]
    );

    const targets: { key: RepeatTarget; label: string; icon: string }[] = [
      { key: 'month', label: 'Rest of this month', icon: 'calendar-month' },
      { key: '3months', label: 'Next 3 months', icon: 'calendar-range' },
      { key: '6months', label: 'Next 6 months', icon: 'calendar-multiple' },
      { key: 'year', label: 'Rest of year', icon: 'calendar-star' },
    ];

    const isReady = patternStart && patternEnd && hasShifts;
    const hasRange = patternStart && patternEnd;

    // Step indicator
    const step = !patternStart ? 1 : !patternEnd ? 2 : 3;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.primary, width: 36 }}
      >
        <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="repeat" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Repeat Pattern</Text>
          </View>

          {/* Steps indicator */}
          <View style={styles.steps}>
            <StepDot n={1} active={step >= 1} done={step > 1} colors={colors} label="Start" />
            <View style={[styles.stepLine, { backgroundColor: step > 1 ? colors.primary : colors.border }]} />
            <StepDot n={2} active={step >= 2} done={step > 2} colors={colors} label="End" />
            <View style={[styles.stepLine, { backgroundColor: step > 2 ? colors.primary : colors.border }]} />
            <StepDot n={3} active={step >= 3} done={false} colors={colors} label="Apply" />
          </View>

          {/* Date range display */}
          <View style={[styles.rangeCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <View style={styles.rangeRow}>
              <View style={[styles.rangeDateChip, { backgroundColor: patternStart ? colors.primary + '15' : colors.background, borderColor: patternStart ? colors.primary + '40' : colors.border }]}>
                <Text style={[styles.rangeDateLabel, { color: colors.textSecondary }]}>From</Text>
                <Text style={[styles.rangeDateValue, { color: patternStart ? colors.text : colors.textSecondary }]}>
                  {patternStart ? format(parseISO(patternStart), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              <View style={[styles.rangeDateChip, { backgroundColor: patternEnd ? colors.primary + '15' : colors.background, borderColor: patternEnd ? colors.primary + '40' : colors.border }]}>
                <Text style={[styles.rangeDateLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.rangeDateValue, { color: patternEnd ? colors.text : colors.textSecondary }]}>
                  {patternEnd ? format(parseISO(patternEnd), 'MMM d, yyyy') : '—'}
                </Text>
              </View>
            </View>
            {hasRange && (
              <TouchableOpacity style={styles.clearRange} onPress={onClearPattern}>
                <MaterialCommunityIcons name="close" size={14} color={colors.textSecondary} />
                <Text style={[styles.clearRangeText, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Pattern preview */}
          {pattern.length > 0 && (
            <View style={[styles.patternCard, { borderColor: colors.border }]}>
              <View style={styles.patternHeader}>
                <Text style={[styles.patternTitle, { color: colors.text }]}>
                  {patternLength}-day pattern
                </Text>
                <Text style={[styles.patternSub, { color: colors.textSecondary }]}>
                  {shiftCount} shift{shiftCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.patternGrid}>
                {pattern.map((day, i) => (
                  <View key={i} style={styles.patternDay}>
                    <Text style={[styles.patternDayLabel, { color: colors.textSecondary }]}>
                      {day.dayName}
                    </Text>
                    <View
                      style={[
                        styles.patternBadge,
                        { backgroundColor: day.shift ? day.shift.color : colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.patternBadgeText,
                          { color: day.shift ? '#FFF' : colors.textSecondary },
                        ]}
                      >
                        {day.code || '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {!hasShifts && (
                <View style={[styles.noShiftsHint, { backgroundColor: '#F59E0B10' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#F59E0B" />
                  <Text style={[styles.noShiftsText, { color: '#F59E0B' }]}>
                    No shifts in this range. Assign shifts to these dates first.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Repeat targets */}
          {hasRange && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REPEAT TO</Text>
              {targets.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.targetButton,
                    {
                      backgroundColor: isReady ? colors.surfaceVariant : colors.surfaceVariant + '60',
                      borderColor: isReady ? colors.border : 'transparent',
                    },
                  ]}
                  onPress={() => applyRepeat(t.key)}
                  activeOpacity={isReady ? 0.7 : 1}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={22}
                    color={isReady ? colors.primary : colors.textSecondary + '50'}
                  />
                  <Text
                    style={[
                      styles.targetLabel,
                      { color: isReady ? colors.text : colors.textSecondary + '50' },
                    ]}
                  >
                    {t.label}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={isReady ? colors.textSecondary : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

function StepDot({
  n,
  active,
  done,
  colors,
  label,
}: {
  n: number;
  active: boolean;
  done: boolean;
  colors: any;
  label: string;
}) {
  return (
    <View style={stepStyles.container}>
      <View
        style={[
          stepStyles.dot,
          {
            backgroundColor: done ? colors.primary : active ? colors.primary + '25' : colors.surfaceVariant,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        {done ? (
          <MaterialCommunityIcons name="check" size={12} color="#FFF" />
        ) : (
          <Text style={[stepStyles.dotText, { color: active ? colors.primary : colors.textSecondary }]}>
            {n}
          </Text>
        )}
      </View>
      <Text style={[stepStyles.label, { color: active ? colors.text : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 0,
  },
  stepLine: {
    height: 2,
    width: 40,
    borderRadius: 1,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  rangeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeDateChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  rangeDateLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rangeDateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  clearRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patternTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  patternSub: {
    fontSize: 13,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  patternDay: {
    alignItems: 'center',
    gap: 4,
  },
  patternDayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  patternBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  noShiftsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  noShiftsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  targetLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
