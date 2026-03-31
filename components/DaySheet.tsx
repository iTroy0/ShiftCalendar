import React, { useCallback, useMemo, forwardRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Keyboard, Share } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { ShiftType } from '../constants/shifts';
import { SwapRequest } from '../hooks/useShiftData';
import { LeaveType } from '../constants/leaveTypes';
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
  currentSwap: SwapRequest | undefined;
  allShiftCodes: { code: string; label: string }[];
  onOfferSwap: (swap: SwapRequest) => void;
  onCancelSwap: (date: string) => void;
  currentLeaveId: string | undefined;
  leaveTypes: LeaveType[];
  onSetLeave: (leaveTypeId: string) => void;
  onClearLeave: (date: string) => void;
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
      currentSwap,
      allShiftCodes,
      onOfferSwap,
      onCancelSwap,
      currentLeaveId,
      leaveTypes,
      onSetLeave,
      onClearLeave,
      colors,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ['50%', '85%'], []);
    const [noteText, setNoteText] = useState(currentNote);
    const [showSwapForm, setShowSwapForm] = useState(false);
    const [swapWant, setSwapWant] = useState('any');
    const [swapNote, setSwapNote] = useState('');
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

    useEffect(() => {
      setShowSwapForm(false);
      setSwapWant('any');
      setSwapNote('');
    }, [selectedDate]);

    const handleOfferSwap = useCallback(() => {
      if (!selectedDate || !currentShift) return;
      const swap: SwapRequest = {
        date: selectedDate,
        shiftCode: currentShift.code,
        wantCode: swapWant,
        note: swapNote.trim(),
        status: 'offered',
        createdAt: new Date().toISOString(),
      };
      onOfferSwap(swap);
      setShowSwapForm(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [selectedDate, currentShift, swapWant, swapNote, onOfferSwap]);

    const handleShareSwap = useCallback(async () => {
      if (!selectedDate || !currentShift) return;
      const dateLabel = format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d MMMM');
      const wantLabel = swapWant === 'any'
        ? 'any shift'
        : allShiftCodes.find((s) => s.code === swapWant)?.label || swapWant;
      const activeSwap = currentSwap;
      const note = activeSwap?.note || swapNote.trim();
      let msg = `Shift Swap Request\n\nI'm looking to swap my ${currentShift.label} shift on ${dateLabel}.`;
      if (wantLabel !== 'any shift') msg += `\nLooking for: ${wantLabel}`;
      if (note) msg += `\nNote: ${note}`;
      msg += '\n\nSent from Shift Calendar';
      try {
        await Share.share({ message: msg });
      } catch {}
    }, [selectedDate, currentShift, currentSwap, swapWant, swapNote, allShiftCodes]);

    const handleCancelSwap = useCallback(() => {
      if (selectedDate) {
        onCancelSwap(selectedDate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, [selectedDate, onCancelSwap]);

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

          {/* Add Note button (above overtime, only when note section is hidden) */}
          {!showNote && !currentNote && (
            <TouchableOpacity
              style={[styles.addNoteBtn, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}
              onPress={() => {
                setShowNote(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons name="note-plus-outline" size={20} color="#F59E0B" />
              <Text style={[styles.addNoteBtnText, { color: '#F59E0B' }]}>Add Note</Text>
            </TouchableOpacity>
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

          {/* Leave section */}
          {currentLeaveId ? (
            (() => {
              const lt = leaveTypes.find((t) => t.id === currentLeaveId);
              return lt ? (
                <View style={[styles.leaveSection, { borderColor: lt.color + '40', backgroundColor: lt.color + '08' }]}>
                  <MaterialCommunityIcons name={lt.icon as any} size={18} color={lt.color} />
                  <Text style={[styles.leaveName, { color: lt.color }]}>{lt.label}</Text>
                  <TouchableOpacity
                    onPress={() => { if (selectedDate) onClearLeave(selectedDate); }}
                    style={[styles.leaveClearBtn, { backgroundColor: lt.color + '20' }]}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="close" size={14} color={lt.color} />
                  </TouchableOpacity>
                </View>
              ) : null;
            })()
          ) : (
            <View style={styles.leaveRow}>
              {leaveTypes.map((lt) => (
                <TouchableOpacity
                  key={lt.id}
                  style={[styles.leaveChip, { backgroundColor: lt.color + '15', borderColor: lt.color + '40' }]}
                  onPress={() => { onSetLeave(lt.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name={lt.icon as any} size={14} color={lt.color} />
                  <Text style={[styles.leaveChipText, { color: lt.color }]}>{lt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Swap section */}
          {currentShift && currentShift.startTime && (
            currentSwap ? (
              <View style={[styles.swapSection, { borderColor: '#8B5CF630' }]}>
                <View style={styles.swapHeader}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color="#8B5CF6" />
                  <Text style={[styles.swapTitle, { color: '#8B5CF6' }]}>Swap Offered</Text>
                  <View style={[styles.swapStatusBadge, { backgroundColor: '#8B5CF620' }]}>
                    <Text style={[styles.swapStatusText, { color: '#8B5CF6' }]}>
                      {currentSwap.status === 'accepted' ? 'Accepted' : 'Active'}
                    </Text>
                  </View>
                </View>
                {currentSwap.note ? (
                  <Text style={[styles.swapNotePreview, { color: colors.textSecondary }]}>
                    {currentSwap.note}
                  </Text>
                ) : null}
                <View style={styles.swapActions}>
                  <TouchableOpacity
                    style={[styles.swapActionBtn, { backgroundColor: '#8B5CF615' }]}
                    onPress={handleShareSwap}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="share-variant-outline" size={16} color="#8B5CF6" />
                    <Text style={[styles.swapActionText, { color: '#8B5CF6' }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swapActionBtn, { backgroundColor: colors.surfaceVariant }]}
                    onPress={handleCancelSwap}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                    <Text style={[styles.swapActionText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : showSwapForm ? (
              <View style={[styles.swapSection, { borderColor: '#8B5CF630' }]}>
                <View style={styles.swapHeader}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color="#8B5CF6" />
                  <Text style={[styles.swapTitle, { color: '#8B5CF6' }]}>Offer Swap</Text>
                </View>
                <Text style={[styles.swapLabel, { color: colors.textSecondary }]}>Want in return</Text>
                <View style={styles.swapChips}>
                  <TouchableOpacity
                    style={[
                      styles.swapChip,
                      {
                        backgroundColor: swapWant === 'any' ? '#8B5CF6' : colors.surfaceVariant,
                        borderColor: swapWant === 'any' ? '#8B5CF6' : colors.border,
                      },
                    ]}
                    onPress={() => setSwapWant('any')}
                  >
                    <Text style={[styles.swapChipText, { color: swapWant === 'any' ? '#FFF' : colors.text }]}>
                      Any
                    </Text>
                  </TouchableOpacity>
                  {allShiftCodes
                    .filter((s) => s.code !== currentShift.code && s.code !== 'O')
                    .map((s) => (
                      <TouchableOpacity
                        key={s.code}
                        style={[
                          styles.swapChip,
                          {
                            backgroundColor: swapWant === s.code ? '#8B5CF6' : colors.surfaceVariant,
                            borderColor: swapWant === s.code ? '#8B5CF6' : colors.border,
                          },
                        ]}
                        onPress={() => setSwapWant(s.code)}
                      >
                        <Text style={[styles.swapChipText, { color: swapWant === s.code ? '#FFF' : colors.text }]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                  style={[styles.swapNoteInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: '#8B5CF630' }]}
                  value={swapNote}
                  onChangeText={setSwapNote}
                  placeholder="Add a message (optional)"
                  placeholderTextColor={colors.textSecondary}
                  onFocus={handleFocus}
                />
                <View style={styles.swapActions}>
                  <TouchableOpacity
                    style={[styles.swapActionBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={handleOfferSwap}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    <Text style={[styles.swapActionText, { color: '#FFF' }]}>Offer Swap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.swapActionBtn, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => setShowSwapForm(false)}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.swapActionText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addNoteBtn, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}
                onPress={() => {
                  setShowSwapForm(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="swap-horizontal" size={20} color="#8B5CF6" />
                <Text style={[styles.addNoteBtnText, { color: '#8B5CF6' }]}>Offer Swap</Text>
              </TouchableOpacity>
            )
          )}

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
          {currentShift && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionPill, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClear();
                }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.actionPillText, { color: colors.textSecondary }]}>Clear Shift</Text>
              </TouchableOpacity>
            </View>
          )}

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
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  addNoteBtnText: { fontSize: 14, fontWeight: '700' },
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
  leaveSection: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12, gap: 8 },
  leaveName: { flex: 1, fontSize: 14, fontWeight: '700' },
  leaveClearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  leaveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  leaveChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, gap: 5 },
  leaveChipText: { fontSize: 12, fontWeight: '700' },
  swapSection: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  swapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swapTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  swapStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  swapStatusText: { fontSize: 11, fontWeight: '700' },
  swapNotePreview: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  swapLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  swapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  swapChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  swapChipText: { fontSize: 12, fontWeight: '700' },
  swapNoteInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 10, minHeight: 38 },
  swapActions: { flexDirection: 'row', gap: 8 },
  swapActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, gap: 6 },
  swapActionText: { fontSize: 13, fontWeight: '700' },
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
