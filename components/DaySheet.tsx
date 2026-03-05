import React, { useCallback, useMemo, forwardRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Keyboard } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { ShiftType } from '../constants/shifts';
import { ShiftButton } from './ShiftButton';

interface Props {
  selectedDate: string | null;
  currentShift: ShiftType | undefined;
  currentNote: string;
  currentOvertime: number;
  allShifts: ShiftType[];
  onSelectShift: (code: string) => void;
  onClear: () => void;
  onSaveNote: (note: string) => void;
  onSetOvertime: (hours: number) => void;
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

export const DaySheet = forwardRef<BottomSheet, Props>(
  (
    {
      selectedDate,
      currentShift,
      currentNote,
      currentOvertime,
      allShifts,
      onSelectShift,
      onClear,
      onSaveNote,
      onSetOvertime,
      colors,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ['50%', '85%'], []);
    const [noteText, setNoteText] = useState(currentNote);
    const [showNote, setShowNote] = useState(false);
    const [otEnabled, setOtEnabled] = useState(currentOvertime > 0);
    const [otHours, setOtHours] = useState(currentOvertime > 0 ? String(currentOvertime) : '');

    useEffect(() => {
      setNoteText(currentNote);
      setShowNote(!!currentNote);
      setOtEnabled(currentOvertime > 0);
      setOtHours(currentOvertime > 0 ? String(currentOvertime) : '');
    }, [currentNote, currentOvertime, selectedDate]);

    const handleShiftPress = useCallback(
      (code: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelectShift(code);
      },
      [onSelectShift]
    );

    const handleNoteSave = useCallback(() => {
      onSaveNote(noteText);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [noteText, onSaveNote]);

    const handleOtToggle = useCallback(() => {
      const next = !otEnabled;
      setOtEnabled(next);
      if (!next) {
        setOtHours('');
        onSetOvertime(0);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [otEnabled, onSetOvertime]);

    const handleOtChange = useCallback(
      (text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        setOtHours(cleaned);
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val >= 0) {
          onSetOvertime(val);
        }
      },
      [onSetOvertime]
    );

    // Expand sheet when keyboard opens so inputs stay visible
    const handleFocus = useCallback(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.snapToIndex(1);
      }
    }, [ref]);

    const dateLabel = selectedDate
      ? format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d MMMM yyyy')
      : '';

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary + '80', width: 36 }}
      >
        <BottomSheetScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.dateText, { color: colors.text }]}>{dateLabel}</Text>

          {/* Current shift card */}
          {currentShift && (
            <View
              style={[
                styles.shiftCard,
                { backgroundColor: currentShift.color + '12', borderColor: currentShift.color + '25' },
              ]}
            >
              <View style={[styles.shiftCodeBadge, { backgroundColor: currentShift.color }]}>
                <Text style={styles.shiftCodeText}>{currentShift.code}</Text>
              </View>
              <View style={styles.shiftCardInfo}>
                <Text style={[styles.shiftCardLabel, { color: currentShift.color }]}>
                  {currentShift.label}
                </Text>
                <Text style={[styles.shiftCardTime, { color: currentShift.color + 'AA' }]}>
                  {currentShift.startTime
                    ? `${currentShift.startTime} – ${currentShift.endTime}`
                    : 'Day Off'}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={currentShift.icon as any}
                size={28}
                color={currentShift.color + '60'}
              />
            </View>
          )}

          {/* Note section */}
          {(currentNote || showNote) && (
            <View style={[styles.noteSection, { borderColor: '#F59E0B30' }]}>
              <View style={styles.noteHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color="#F59E0B" />
                <Text style={[styles.noteTitle, { color: '#F59E0B' }]}>Note</Text>
                {noteText !== currentNote && (
                  <TouchableOpacity
                    style={[styles.saveNotePill, { backgroundColor: colors.primary }]}
                    onPress={handleNoteSave}
                  >
                    <Text style={styles.saveNotePillText}>Save</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[
                  styles.noteInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: '#F59E0B30' },
                ]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                onFocus={handleFocus}
                onBlur={() => {
                  if (noteText !== currentNote) handleNoteSave();
                }}
              />
            </View>
          )}

          {/* Overtime section */}
          <View style={[styles.otSection, { borderColor: otEnabled ? '#EF444430' : colors.border }]}>
            <TouchableOpacity style={styles.otToggleRow} onPress={handleOtToggle} activeOpacity={0.6}>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: otEnabled ? '#EF4444' : 'transparent',
                    borderColor: otEnabled ? '#EF4444' : colors.textSecondary,
                  },
                ]}
              >
                {otEnabled && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
              </View>
              <MaterialCommunityIcons
                name="clock-plus-outline"
                size={18}
                color={otEnabled ? '#EF4444' : colors.textSecondary}
              />
              <Text style={[styles.otLabel, { color: otEnabled ? '#EF4444' : colors.textSecondary }]}>
                Overtime
              </Text>
            </TouchableOpacity>
            {otEnabled && (
              <View style={styles.otInputRow}>
                <TextInput
                  style={[
                    styles.otInput,
                    { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: '#EF444430' },
                  ]}
                  value={otHours}
                  onChangeText={handleOtChange}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={5}
                  onFocus={handleFocus}
                />
                <Text style={[styles.otUnit, { color: colors.textSecondary }]}>hours</Text>
              </View>
            )}
          </View>

          {/* Shift selector */}
          <View style={styles.shiftGrid}>
            {allShifts.map((shift) => (
              <ShiftButton
                key={shift.code}
                shift={shift}
                selected={currentShift?.code === shift.code}
                onPress={() => handleShiftPress(shift.code)}
              />
            ))}
          </View>

          {/* Bottom actions */}
          <View style={styles.actionsRow}>
            {!showNote && (
              <TouchableOpacity
                style={[styles.actionPill, { backgroundColor: '#F59E0B18' }]}
                onPress={() => setShowNote(true)}
              >
                <MaterialCommunityIcons name="note-plus-outline" size={18} color="#F59E0B" />
                <Text style={[styles.actionPillText, { color: '#F59E0B' }]}>Add Note</Text>
              </TouchableOpacity>
            )}
            {currentShift && (
              <TouchableOpacity
                style={[styles.actionPill, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClear();
                }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.actionPillText, { color: colors.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Extra padding at bottom so inputs are never behind keyboard */}
          <View style={{ height: 120 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  dateText: { fontSize: 19, fontWeight: '800', marginBottom: 14 },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  shiftCodeBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftCodeText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  shiftCardInfo: { flex: 1, marginLeft: 12 },
  shiftCardLabel: { fontSize: 17, fontWeight: '800' },
  shiftCardTime: { fontSize: 13, marginTop: 1 },
  noteSection: { marginBottom: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noteTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  saveNotePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  saveNotePillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 50,
    lineHeight: 20,
  },
  otSection: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  otToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  otInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  otInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    width: 80,
    textAlign: 'center',
  },
  otUnit: { fontSize: 14, fontWeight: '600' },
  shiftGrid: { marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  actionPillText: { fontSize: 14, fontWeight: '600' },
});
