import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Share, useWindowDimensions } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useShifts } from '../hooks/ShiftContext';
import { useAppSettings } from '../hooks/SettingsContext';
import { SwapRequest, AssignmentSnapshot } from '../hooks/useShiftData';
import { ShiftType, getShiftHours, isWorkingShift } from '../constants/shifts';
import { ThemeColors } from '../constants/colors';
import { Radius } from '../constants/theme';
import { fromDateKey, todayKey } from '../utils/dates';
import { formatHours, formatTimeRange } from '../utils/time';
import { readableTextColor, withAlpha } from '../utils/color';
import { haptic } from '../utils/haptics';
import { Tap } from './ui/Tap';
import { Button, Chip, SectionLabel } from './ui/primitives';
import { useSheetBackdrop, useSheetChrome } from './ui/sheet';

interface Props {
  dateKey: string | null;
  onDismiss: () => void;
  onToast: (message: string, undo?: () => void) => void;
}

const OT_STEP = 0.5;

function ShiftOption({
  shift,
  selected,
  onPress,
  colors,
  timeFormat,
}: {
  shift: ShiftType;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  timeFormat: '12h' | '24h';
}) {
  const fg = selected ? readableTextColor(shift.color) : colors.text;
  return (
    <Tap
      onPress={onPress}
      scale
      accessibilityLabel={`${shift.label}${isWorkingShift(shift) ? ', ' + formatTimeRange(shift.startTime, shift.endTime, timeFormat) : ', day off'}`}
      accessibilityState={{ selected }}
      style={[
        styles.shiftOption,
        {
          backgroundColor: selected ? shift.color : withAlpha(shift.color, 0.1),
          borderColor: selected ? shift.color : withAlpha(shift.color, 0.28),
        },
      ]}
    >
      <View style={[styles.shiftCode, { backgroundColor: selected ? withAlpha(readableTextColor(shift.color), 0.18) : shift.color }]}>
        <Text style={[styles.shiftCodeText, { color: selected ? fg : readableTextColor(shift.color) }]}>{shift.code}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={[styles.shiftLabel, { color: fg }]} numberOfLines={1}>
          {shift.label}
        </Text>
        <Text style={[styles.shiftTime, { color: selected ? withAlpha(fg, 0.8) : colors.textSecondary }]} numberOfLines={1}>
          {isWorkingShift(shift) ? formatTimeRange(shift.startTime, shift.endTime, timeFormat) : 'Day off'}
        </Text>
      </View>
      {selected && <MaterialCommunityIcons name="check-circle" size={18} color={fg} />}
    </Tap>
  );
}

function DayContent({ dateKey, onToast, onClose }: { dateKey: string; onToast: Props['onToast']; onClose: () => void }) {
  const { colors, timeFormat } = useAppSettings();
  const {
    shiftData, leaveData, notesData, overtimeData, swapsData, allShifts, leaveTypes, getShiftByCode, getLeaveType,
    setShift, clearShift, setLeave, clearLeave, clearDay, restoreAssignments, setNote, setOvertime, offerSwap, cancelSwap,
  } = useShifts();
  const { width } = useWindowDimensions();

  const shift = shiftData[dateKey] ? getShiftByCode(shiftData[dateKey]) : undefined;
  const leave = leaveData[dateKey] ? getLeaveType(leaveData[dateKey]) : undefined;
  const overtime = overtimeData[dateKey] || 0;
  const swap = swapsData[dateKey];
  const date = fromDateKey(dateKey);
  const isToday = dateKey === todayKey();
  const columns = width >= 600 ? 3 : 2;

  // --- Note: autosaved shortly after typing stops, and flushed when the day changes or the sheet closes.
  const savedNote = notesData[dateKey] ?? '';
  const [noteText, setNoteText] = useState(savedNote);
  const [noteOpen, setNoteOpen] = useState(!!savedNote);
  const noteRef = useRef({ text: savedNote, dirty: false });
  const setNoteRef = useRef(setNote);
  setNoteRef.current = setNote;

  const flushNote = useCallback(() => {
    if (noteRef.current.dirty) {
      noteRef.current.dirty = false;
      setNoteRef.current(dateKey, noteRef.current.text);
    }
  }, [dateKey]);

  useEffect(() => {
    if (!noteRef.current.dirty) return;
    const t = setTimeout(flushNote, 700);
    return () => clearTimeout(t);
  }, [noteText, flushNote]);

  useEffect(() => flushNote, [flushNote]);

  const onNoteChange = (text: string) => {
    noteRef.current = { text, dirty: true };
    setNoteText(text);
  };

  // --- Overtime
  const [otText, setOtText] = useState(overtime ? String(overtime) : '');
  useEffect(() => {
    setOtText((prev) => (parseFloat(prev || '0') === overtime ? prev : overtime ? String(overtime) : ''));
  }, [overtime]);
  const stepOvertime = (delta: number) => {
    const next = Math.max(0, Math.round((overtime + delta) * 2) / 2);
    haptic.selection();
    setOvertime(dateKey, next);
    setOtText(next ? String(next) : '');
  };
  const onOtChange = (text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    setOtText(cleaned);
    const value = parseFloat(cleaned);
    setOvertime(dateKey, Number.isFinite(value) ? Math.min(value, 24) : 0);
  };

  // --- Swap
  const [swapFormOpen, setSwapFormOpen] = useState(false);
  const [swapWant, setSwapWant] = useState('any');
  const [swapNote, setSwapNote] = useState('');
  const working = !leave && isWorkingShift(shift);

  const pickShift = (code: string) => {
    if (shift?.code === code) {
      haptic.light();
      clearShift(dateKey);
      return;
    }
    haptic.medium();
    setShift(dateKey, code);
  };

  const pickLeave = (id: string) => {
    if (leave?.id === id) {
      haptic.light();
      clearLeave(dateKey);
      return;
    }
    haptic.medium();
    setLeave(dateKey, id);
  };

  const handleClearDay = () => {
    const message = leave ? `${leave.label} removed` : 'Shift cleared';
    const snap: AssignmentSnapshot = clearDay(dateKey);
    haptic.light();
    // Close first: the sheet would otherwise sit on top of the undo toast.
    onClose();
    onToast(message, () => restoreAssignments(snap));
  };

  const shareSwap = async (request: { wantCode: string; note: string }) => {
    if (!shift) return;
    const want = request.wantCode === 'any' ? null : getShiftByCode(request.wantCode)?.label ?? request.wantCode;
    let msg = `Shift swap request\n\nI'm looking to swap my ${shift.label} shift (${formatTimeRange(shift.startTime, shift.endTime, timeFormat)}) on ${format(date, 'EEEE, d MMMM')}.`;
    if (want) msg += `\nLooking for: ${want}`;
    if (request.note) msg += `\nNote: ${request.note}`;
    msg += '\n\nSent from ShiftCalendar';
    try {
      await Share.share({ message: msg });
    } catch {
      // Share sheet dismissed.
    }
  };

  const submitSwap = () => {
    if (!shift) return;
    const request: SwapRequest = {
      date: dateKey,
      shiftCode: shift.code,
      wantCode: swapWant,
      note: swapNote.trim(),
      status: 'offered',
      createdAt: new Date().toISOString(),
    };
    offerSwap(request);
    setSwapFormOpen(false);
    haptic.success();
    shareSwap(request);
  };

  const status = leave
    ? { color: leave.color, icon: leave.icon, title: leave.label, detail: leave.paid ? 'Paid leave' : 'Unpaid leave' }
    : shift
      ? {
          color: shift.color,
          icon: shift.icon,
          title: shift.label,
          detail: working ? `${formatTimeRange(shift.startTime, shift.endTime, timeFormat)} · ${formatHours(getShiftHours(shift))}` : 'Day off',
        }
      : null;

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.flex}>
          <View style={styles.headerTop}>
            <Text style={[styles.weekday, { color: colors.textMuted }]}>{format(date, 'EEEE')}</Text>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                <Text style={[styles.todayBadgeText, { color: colors.primaryText }]}>Today</Text>
              </View>
            )}
          </View>
          <Text style={[styles.dateTitle, { color: colors.text }]}>{format(date, 'd MMMM yyyy')}</Text>
        </View>
        <Tap onPress={onClose} accessibilityLabel="Close" style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="close" size={20} color={colors.text} />
        </Tap>
      </View>

      <View
        style={[
          styles.statusCard,
          status
            ? { backgroundColor: withAlpha(status.color, 0.12), borderColor: withAlpha(status.color, 0.3) }
            : { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderStyle: 'dashed' },
        ]}
      >
        <View style={[styles.statusIcon, { backgroundColor: status ? status.color : colors.surface }]}>
          <MaterialCommunityIcons
            name={(status?.icon ?? 'calendar-blank-outline') as any}
            size={22}
            color={status ? readableTextColor(status.color) : colors.textMuted}
          />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>{status ? status.title : 'Nothing assigned'}</Text>
          <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
            {status ? status.detail : 'Pick a shift or leave type below'}
            {overtime > 0 ? `  ·  +${formatHours(overtime)} overtime` : ''}
          </Text>
        </View>
      </View>

      <SectionLabel colors={colors} style={styles.firstSection}>Shift</SectionLabel>
      <View style={styles.grid}>
        {allShifts.map((s) => (
          <View key={s.code} style={{ width: `${100 / columns}%`, padding: 4 }}>
            <ShiftOption
              shift={s}
              selected={!leave && shift?.code === s.code}
              onPress={() => pickShift(s.code)}
              colors={colors}
              timeFormat={timeFormat}
            />
          </View>
        ))}
      </View>

      <SectionLabel colors={colors}>Leave</SectionLabel>
      <View style={styles.chipWrap}>
        {leaveTypes.map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            icon={t.icon as any}
            color={t.color}
            selected={leave?.id === t.id}
            onPress={() => pickLeave(t.id)}
            colors={colors}
          />
        ))}
      </View>

      <SectionLabel colors={colors}>Overtime</SectionLabel>
      <View style={[styles.otRow, { backgroundColor: colors.surfaceVariant }]}>
        <MaterialCommunityIcons name="clock-plus-outline" size={20} color={overtime > 0 ? colors.overtimeAccent : colors.textSecondary} />
        <Text style={[styles.otLabel, { color: colors.text }]}>Extra hours</Text>
        <Tap
          onPress={() => stepOvertime(-OT_STEP)}
          disabled={overtime <= 0}
          accessibilityLabel="Decrease overtime"
          style={[styles.stepBtn, { backgroundColor: colors.surface, opacity: overtime <= 0 ? 0.4 : 1 }]}
        >
          <MaterialCommunityIcons name="minus" size={18} color={colors.text} />
        </Tap>
        <BottomSheetTextInput
          value={otText}
          onChangeText={onOtChange}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          maxLength={5}
          accessibilityLabel="Overtime hours"
          style={[styles.otInput, { color: overtime > 0 ? colors.overtimeAccent : colors.text }]}
        />
        <Tap
          onPress={() => stepOvertime(OT_STEP)}
          accessibilityLabel="Increase overtime"
          style={[styles.stepBtn, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
        </Tap>
      </View>

      <SectionLabel
        colors={colors}
        right={
          !noteOpen ? null : savedNote !== noteText.trim() ? (
            <Text style={[styles.saving, { color: colors.textMuted }]}>Saving…</Text>
          ) : savedNote ? (
            <Text style={[styles.saving, { color: colors.success }]}>Saved</Text>
          ) : null
        }
      >
        Note
      </SectionLabel>
      {noteOpen ? (
        <BottomSheetTextInput
          value={noteText}
          onChangeText={onNoteChange}
          onBlur={flushNote}
          placeholder="Add a note for this day…"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Note"
          autoFocus={!savedNote}
          style={[styles.noteInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: withAlpha(colors.noteAccent, 0.4) }]}
        />
      ) : (
        <Tap
          onPress={() => {
            haptic.light();
            setNoteOpen(true);
          }}
          accessibilityLabel="Add a note"
          style={[styles.addRow, { borderColor: withAlpha(colors.noteAccent, 0.4), backgroundColor: withAlpha(colors.noteAccent, 0.08) }]}
        >
          <MaterialCommunityIcons name="note-plus-outline" size={20} color={colors.noteAccent} />
          <Text style={[styles.addRowText, { color: colors.noteAccent }]}>Add a note</Text>
        </Tap>
      )}

      {working && shift && (
        <>
          <SectionLabel colors={colors}>Swap</SectionLabel>
          {swap ? (
            <View style={[styles.swapCard, { borderColor: withAlpha(colors.swapAccent, 0.35), backgroundColor: withAlpha(colors.swapAccent, 0.08) }]}>
              <View style={styles.swapHeader}>
                <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.swapAccent} />
                <Text style={[styles.swapTitle, { color: colors.text }]}>Swap offered</Text>
                <View style={[styles.swapBadge, { backgroundColor: withAlpha(colors.swapAccent, 0.18) }]}>
                  <Text style={[styles.swapBadgeText, { color: colors.swapAccent }]}>{swap.status === 'accepted' ? 'Accepted' : 'Open'}</Text>
                </View>
              </View>
              <Text style={[styles.swapDetail, { color: colors.textSecondary }]}>
                Wants: {swap.wantCode === 'any' ? 'any shift' : getShiftByCode(swap.wantCode)?.label ?? swap.wantCode}
                {swap.note ? `\n“${swap.note}”` : ''}
              </Text>
              <View style={styles.swapActions}>
                <Button label="Share" icon="share-variant-outline" onPress={() => shareSwap(swap)} colors={colors} color={colors.swapAccent} style={styles.flex} />
                <Button
                  label="Withdraw"
                  variant="secondary"
                  onPress={() => {
                    cancelSwap(dateKey);
                    haptic.light();
                  }}
                  colors={colors}
                  style={styles.flex}
                />
              </View>
            </View>
          ) : swapFormOpen ? (
            <View style={[styles.swapCard, { borderColor: withAlpha(colors.swapAccent, 0.35), backgroundColor: withAlpha(colors.swapAccent, 0.08) }]}>
              <Text style={[styles.swapPrompt, { color: colors.textSecondary }]}>What would you like instead?</Text>
              <View style={styles.chipWrap}>
                <Chip label="Any shift" selected={swapWant === 'any'} onPress={() => setSwapWant('any')} colors={colors} color={colors.swapAccent} compact />
                {allShifts
                  .filter((s) => s.code !== shift.code)
                  .map((s) => (
                    <Chip key={s.code} label={s.label} selected={swapWant === s.code} onPress={() => setSwapWant(s.code)} colors={colors} color={colors.swapAccent} compact />
                  ))}
              </View>
              <BottomSheetTextInput
                value={swapNote}
                onChangeText={setSwapNote}
                placeholder="Message (optional)"
                placeholderTextColor={colors.textMuted}
                style={[styles.swapInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              />
              <View style={styles.swapActions}>
                <Button label="Offer & share" icon="send-outline" onPress={submitSwap} colors={colors} color={colors.swapAccent} style={styles.flex} />
                <Button label="Cancel" variant="secondary" onPress={() => setSwapFormOpen(false)} colors={colors} />
              </View>
            </View>
          ) : (
            <Tap
              onPress={() => {
                haptic.light();
                setSwapFormOpen(true);
              }}
              accessibilityLabel="Offer this shift for a swap"
              style={[styles.addRow, { borderColor: withAlpha(colors.swapAccent, 0.4), backgroundColor: withAlpha(colors.swapAccent, 0.08) }]}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.swapAccent} />
              <Text style={[styles.addRowText, { color: colors.swapAccent }]}>Offer a swap</Text>
            </Tap>
          )}
        </>
      )}

      {(shift || leave) && (
        <Button
          label={leave ? 'Remove leave' : 'Clear shift'}
          icon="close-circle-outline"
          variant="danger"
          onPress={handleClearDay}
          colors={colors}
          style={styles.clearBtn}
        />
      )}
    </View>
  );
}

/** Day details: assign a shift or leave, log overtime, write a note, offer a swap. */
export const DaySheet = forwardRef<BottomSheetModal, Props>(function DaySheet({ dateKey, onDismiss, onToast }, ref) {
  const { colors } = useAppSettings();
  const chrome = useSheetChrome(colors);
  const backdrop = useSheetBackdrop(1);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['64%', '92%'], []);
  const close = useCallback(() => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  }, [ref]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onDismiss}
      backdropComponent={backdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      {...chrome}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {dateKey ? <DayContent key={dateKey} dateKey={dateKey} onToast={onToast} onClose={close} /> : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekday: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  todayBadgeText: { fontSize: 11, fontWeight: '800' },
  dateTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 17, fontWeight: '800' },
  statusDetail: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  firstSection: { marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  shiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 58,
  },
  shiftCode: { minWidth: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  shiftCodeText: { fontSize: 13, fontWeight: '800' },
  shiftLabel: { fontSize: 14, fontWeight: '700' },
  shiftTime: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  otRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  otLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  stepBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  otInput: { width: 56, textAlign: 'center', fontSize: 20, fontWeight: '800', paddingVertical: 4 },
  saving: { fontSize: 11, fontWeight: '700' },
  noteInput: { minHeight: 88, borderRadius: Radius.md, borderWidth: 1, padding: 12, fontSize: 15, lineHeight: 21 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addRowText: { fontSize: 14, fontWeight: '700' },
  swapCard: { borderWidth: 1, borderRadius: Radius.lg, padding: 14, gap: 10 },
  swapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swapTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  swapBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  swapBadgeText: { fontSize: 11, fontWeight: '800' },
  swapDetail: { fontSize: 13, lineHeight: 19 },
  swapPrompt: { fontSize: 13, fontWeight: '600' },
  swapInput: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  swapActions: { flexDirection: 'row', gap: 8 },
  clearBtn: { marginTop: 24 },
});
