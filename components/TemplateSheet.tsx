import React, { useMemo, forwardRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  format,
  addDays,
  parseISO,
  endOfMonth,
  addMonths,
  endOfYear,
  differenceInDays,
} from 'date-fns';
import { ShiftType } from '../constants/shifts';
import { ShiftTemplate, SHIFT_TEMPLATES } from '../constants/templates';

interface Props {
  allShifts: ShiftType[];
  getShiftByCode: (code: string) => ShiftType | undefined;
  selectedTemplate: ShiftTemplate | null;
  templateStart: string | null;
  onSelectTemplate: (template: ShiftTemplate) => void;
  onApply: (entries: Record<string, string>) => void;
  onClose: () => void;
  onBack: () => void;
  currentMonth: Date;
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

type ApplyTarget = 'month' | '3months' | '6months' | 'year';

export const TemplateSheet = forwardRef<BottomSheet, Props>(
  (
    {
      allShifts,
      getShiftByCode,
      selectedTemplate,
      templateStart,
      onSelectTemplate,
      onApply,
      onClose,
      onBack,
      currentMonth,
      colors,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ['12%', '60%', '85%'], []);

    // Auto-minimize when template is selected but no start date (user needs to tap calendar)
    useEffect(() => {
      if (selectedTemplate && !templateStart && ref && typeof ref !== 'function' && ref.current) {
        ref.current.snapToIndex(0);
      }
    }, [selectedTemplate, templateStart]);

    // Auto-expand when start date is picked (user needs apply options)
    useEffect(() => {
      if (selectedTemplate && templateStart && ref && typeof ref !== 'function' && ref.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        ref.current.snapToIndex(2);
      }
    }, [templateStart]);

    // Build a mapping from template codes (M/A/N/O) to user's actual shift codes
    const codeMap = useMemo(() => {
      const map = new Map<string, string>();
      const workingShifts = allShifts.filter((s) => s.startTime).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const offShifts = allShifts.filter((s) => !s.startTime);

      // Default template slots mapped by position
      const templateSlots = ['M', 'A', 'N']; // morning, afternoon, night
      templateSlots.forEach((slot, i) => {
        // Exact match first
        if (allShifts.find((s) => s.code === slot)) {
          map.set(slot, slot);
        } else if (workingShifts[i]) {
          map.set(slot, workingShifts[i].code);
        }
      });
      // Off slot
      if (allShifts.find((s) => s.code === 'O')) {
        map.set('O', 'O');
      } else if (offShifts.length > 0) {
        map.set('O', offShifts[0].code);
      }

      return map;
    }, [allShifts]);

    const applyTemplate = useCallback(
      (target: ApplyTarget) => {
        if (!selectedTemplate || !templateStart) return;

        const pattern = selectedTemplate.pattern;
        const patternLength = pattern.length;

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

        const startDate = parseISO(templateStart);
        const totalDays = differenceInDays(endDate, startDate) + 1;

        if (totalDays <= 0) {
          Alert.alert('Nothing to Fill', 'The selected period has already passed.');
          return;
        }

        const entries: Record<string, string> = {};
        for (let i = 0; i < totalDays; i++) {
          const day = addDays(startDate, i);
          const templateCode = pattern[i % patternLength];
          const resolvedCode = templateCode ? codeMap.get(templateCode) : undefined;
          if (resolvedCode) {
            entries[format(day, 'yyyy-MM-dd')] = resolvedCode;
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
          'Apply Template',
          `Apply "${selectedTemplate.name}" to ${count} days?\n\n${format(startDate, 'MMM d')} \u2192 ${targetLabel}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Apply',
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onApply(entries);
              },
            },
          ]
        );
      },
      [selectedTemplate, templateStart, currentMonth, onApply]
    );

    const targets: { key: ApplyTarget; label: string; icon: string }[] = [
      { key: 'month', label: 'Rest of this month', icon: 'calendar-month' },
      { key: '3months', label: 'Next 3 months', icon: 'calendar-range' },
      { key: '6months', label: 'Next 6 months', icon: 'calendar-multiple' },
      { key: 'year', label: 'Rest of year', icon: 'calendar-star' },
    ];

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.primary, width: 36 }}
      >
        <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {selectedTemplate && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <MaterialCommunityIcons name="view-grid-outline" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>
              {selectedTemplate ? selectedTemplate.name : 'Shift Templates'}
            </Text>
          </View>

          {!selectedTemplate ? (
            /* ── Browse Templates ── */
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pick a rotation pattern to apply
              </Text>
              {SHIFT_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelectTemplate(template);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
                      {template.description}
                    </Text>
                    <Text style={[styles.templateCycle, { color: colors.primary }]}>
                      {template.pattern.length}-day cycle
                    </Text>
                  </View>
                  <View style={styles.templatePreview}>
                    {template.pattern.map((code, i) => {
                      const shift = getShiftByCode(code);
                      return (
                        <View
                          key={i}
                          style={[
                            styles.previewDot,
                            { backgroundColor: shift?.color || colors.border },
                          ]}
                        />
                      );
                    })}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </>
          ) : !templateStart ? (
            /* ── Template Selected, Pick Start Date ── */
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {selectedTemplate.description}
              </Text>

              <View style={[styles.patternPreview, { borderColor: colors.border }]}>
                <Text style={[styles.patternLabel, { color: colors.textSecondary }]}>PATTERN</Text>
                <View style={styles.patternRow}>
                  {selectedTemplate.pattern.map((code, i) => {
                    const shift = getShiftByCode(code);
                    return (
                      <View key={i} style={styles.patternItem}>
                        <View
                          style={[
                            styles.patternBadge,
                            { backgroundColor: shift?.color || colors.border },
                          ]}
                        >
                          {shift && (
                            <MaterialCommunityIcons
                              name={shift.icon as any}
                              size={12}
                              color="#FFFFFFDD"
                            />
                          )}
                          <Text style={styles.patternBadgeText}>{code}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View
                style={[
                  styles.hintCard,
                  { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
                ]}
              >
                <MaterialCommunityIcons name="gesture-tap" size={24} color={colors.primary} />
                <Text style={[styles.hintText, { color: colors.primary }]}>
                  Tap a start date on the calendar
                </Text>
              </View>
            </>
          ) : (
            /* ── Template + Start Date, Show Apply Options ── */
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {selectedTemplate.description}
              </Text>

              <View style={[styles.patternPreview, { borderColor: colors.border }]}>
                <Text style={[styles.patternLabel, { color: colors.textSecondary }]}>PATTERN</Text>
                <View style={styles.patternRow}>
                  {selectedTemplate.pattern.map((code, i) => {
                    const shift = getShiftByCode(code);
                    return (
                      <View key={i} style={styles.patternItem}>
                        <View
                          style={[
                            styles.patternBadge,
                            { backgroundColor: shift?.color || colors.border },
                          ]}
                        >
                          {shift && (
                            <MaterialCommunityIcons
                              name={shift.icon as any}
                              size={12}
                              color="#FFFFFFDD"
                            />
                          )}
                          <Text style={styles.patternBadgeText}>{code}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View
                style={[
                  styles.startChip,
                  { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' },
                ]}
              >
                <MaterialCommunityIcons name="calendar-start" size={18} color={colors.primary} />
                <Text style={[styles.startChipText, { color: colors.primary }]}>
                  Starting {format(parseISO(templateStart), 'EEEE, MMM d, yyyy')}
                </Text>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPLY TO</Text>
              {targets.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.targetButton,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  onPress={() => applyTemplate(t.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={[styles.targetLabel, { color: colors.text }]}>{t.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
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

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '800',
  },
  templateDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  templateCycle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  templatePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    maxWidth: 60,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  patternPreview: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  patternLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  patternRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  patternItem: {
    alignItems: 'center',
  },
  patternBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  patternBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  startChipText: {
    fontSize: 14,
    fontWeight: '700',
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
