import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format, addMonths, subMonths, addWeeks, subWeeks, parseISO, eachDayOfInterval } from 'date-fns';
import { useAppSettings } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { MonthHeader } from '../../components/MonthHeader';
import { DaySheet } from '../../components/DaySheet';
import { RepeatSheet } from '../../components/RepeatSheet';
import { CalendarDay } from '../../components/CalendarDay';
import { Toast } from '../../components/Toast';
import { CalendarSwitcher } from '../../components/CalendarSwitcher';
import { WeekView } from '../../components/WeekView';
import { TemplateSheet } from '../../components/TemplateSheet';
import { NotesSearchSheet } from '../../components/NotesSearchSheet';
import { ShiftTemplate } from '../../constants/templates';
import { SwapRequest } from '../../hooks/useShiftData';

const SWIPE_THRESHOLD = 50;
const SCREEN_WIDTH = Dimensions.get('window').width;

function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function CalendarScreen() {
  const { colors, weekStart } = useAppSettings();
  const {
    shiftData,
    notesData,
    overtimeData,
    swapsData,
    leaveData,
    leaveTypes,
    setShift,
    clearShift,
    setShiftsBulk,
    setNote,
    setOvertime,
    setLeave,
    clearLeave,
    allShifts,
    getShiftByCode,
    lastUsedShift,
    offerSwap,
    cancelSwap,
    calendars,
    activeCalendar,
    switchCalendar,
  } = useShifts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [repeatMode, setRepeatMode] = useState(false);
  const [patternStart, setPatternStart] = useState<string | null>(null);
  const [patternEnd, setPatternEnd] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastUndo, setToastUndo] = useState<(() => void) | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [templateMode, setTemplateMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [templateStart, setTemplateStart] = useState<string | null>(null);
  const daySheetRef = useRef<BottomSheet>(null);
  const repeatSheetRef = useRef<BottomSheet>(null);
  const templateSheetRef = useRef<BottomSheet>(null);
  const notesSearchRef = useRef<BottomSheet>(null);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const [todayStr, setTodayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  // Refresh todayStr across midnight
  useEffect(() => {
    const check = () => {
      const now = format(new Date(), 'yyyy-MM-dd');
      if (now !== todayStr) setTodayStr(now);
    };
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [todayStr]);

  const goToToday = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date());
  }, []);

  const showToast = useCallback((msg: string, undoFn?: () => void) => {
    setToastMsg(msg);
    setToastUndo(() => undoFn);
    setToastVisible(true);
  }, []);

  // Animation shared values
  const translateX = useSharedValue(0);
  const animOpacity = useSharedValue(1);

  const SPRING_CONFIG = { damping: 20, stiffness: 220, mass: 0.8 };

  const changeMonth = useCallback((dir: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMode === 'week') {
      setCurrentMonth((d) => (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1)));
    } else {
      setCurrentMonth((d) => (dir > 0 ? addMonths(d, 1) : subMonths(d, 1)));
    }
  }, [viewMode]);

  const handlePrev = useCallback(() => {
    translateX.value = -SCREEN_WIDTH * 0.35;
    animOpacity.value = 0.15;
    translateX.value = withSpring(0, SPRING_CONFIG);
    animOpacity.value = withTiming(1, { duration: 280 });
    changeMonth(-1);
  }, [changeMonth]);

  const handleNext = useCallback(() => {
    translateX.value = SCREEN_WIDTH * 0.35;
    animOpacity.value = 0.15;
    translateX.value = withSpring(0, SPRING_CONFIG);
    animOpacity.value = withTiming(1, { duration: 280 });
    changeMonth(1);
  }, [changeMonth]);

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.5;
      animOpacity.value = interpolate(
        Math.abs(e.translationX),
        [0, SCREEN_WIDTH * 0.4],
        [1, 0.5],
        'clamp'
      );
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = SCREEN_WIDTH * 0.35;
        animOpacity.value = 0.15;
        translateX.value = withSpring(0, SPRING_CONFIG);
        animOpacity.value = withTiming(1, { duration: 280 });
        runOnJS(changeMonth)(1);
      } else if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = -SCREEN_WIDTH * 0.35;
        animOpacity.value = 0.15;
        translateX.value = withSpring(0, SPRING_CONFIG);
        animOpacity.value = withTiming(1, { duration: 280 });
        runOnJS(changeMonth)(-1);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        animOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const calendarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: animOpacity.value,
  }));

  const patternDates = useMemo(() => {
    if (!patternStart) return new Set<string>();
    const set = new Set<string>();
    if (patternEnd) {
      eachDayOfInterval({ start: parseISO(patternStart), end: parseISO(patternEnd) })
        .forEach((d) => set.add(format(d, 'yyyy-MM-dd')));
    } else {
      set.add(patternStart);
    }
    return set;
  }, [patternStart, patternEnd]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const days = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      marks[`${monthKey}-${String(d).padStart(2, '0')}`] = { customStyles: {} };
    }
    return marks;
  }, [monthKey, currentMonth]);

  const handleDayPress = useCallback(
    (dateString: string) => {
      if (templateMode && selectedTemplate) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTemplateStart(dateString);
        templateSheetRef.current?.snapToIndex(1);
        return;
      }
      if (repeatMode) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!patternStart || (patternStart && patternEnd)) {
          setPatternStart(dateString);
          setPatternEnd(null);
          repeatSheetRef.current?.snapToIndex(0);
        } else {
          if (dateString === patternStart) return;
          if (dateString < patternStart) {
            setPatternEnd(patternStart);
            setPatternStart(dateString);
          } else {
            setPatternEnd(dateString);
          }
        }
        return;
      }
      setSelectedDate(dateString);
      daySheetRef.current?.snapToIndex(0);
    },
    [repeatMode, patternStart, patternEnd, templateMode, selectedTemplate]
  );

  // Long-press quick-assign
  const handleDayLongPress = useCallback(
    (dateString: string) => {
      if (repeatMode || templateMode) return;
      if (!lastUsedShift) {
        showToast('No recent shift. Tap a day to assign one first.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const prevCode = shiftData[dateString];
      setShift(dateString, lastUsedShift);
      const shift = getShiftByCode(lastUsedShift);
      const label = shift?.label || lastUsedShift;
      showToast(`${label} assigned`, () => {
        // Undo: restore previous state
        if (prevCode) {
          setShift(dateString, prevCode);
        } else {
          clearShift(dateString);
        }
      });
    },
    [repeatMode, templateMode, lastUsedShift, shiftData, setShift, clearShift, getShiftByCode, showToast]
  );

  const handleSelectShift = useCallback(
    (code: string) => {
      if (selectedDate) {
        setShift(selectedDate, code);
        clearLeave(selectedDate);
      }
    },
    [selectedDate, setShift, clearLeave]
  );

  const handleClear = useCallback(() => {
    if (!selectedDate) return;
    const prevCode = shiftData[selectedDate];
    const prevLeaveId = leaveData[selectedDate];
    clearShift(selectedDate);
    clearLeave(selectedDate);
    if (prevCode || prevLeaveId) {
      showToast('Day cleared', () => {
        if (prevCode) setShift(selectedDate, prevCode);
        if (prevLeaveId) setLeave(selectedDate, prevLeaveId);
      });
    }
  }, [selectedDate, shiftData, leaveData, clearShift, clearLeave, setShift, setLeave, showToast]);

  const handleSaveNote = useCallback(
    (note: string) => {
      if (selectedDate) setNote(selectedDate, note);
    },
    [selectedDate, setNote]
  );

  const handleSetOvertime = useCallback(
    (hours: number) => {
      if (selectedDate) setOvertime(selectedDate, hours);
    },
    [selectedDate, setOvertime]
  );

  const handleApplyPattern = useCallback(
    (entries: Record<string, string>) => {
      // Save previous state for undo
      const prevEntries: Record<string, string | undefined> = {};
      Object.keys(entries).forEach((date) => {
        prevEntries[date] = shiftData[date];
      });

      setShiftsBulk(entries);
      const count = Object.keys(entries).length;
      showToast(`Pattern applied to ${count} days`, () => {
        // Undo: restore previous entries
        const restore: Record<string, string> = {};
        const toClear: string[] = [];
        Object.entries(prevEntries).forEach(([date, code]) => {
          if (code) restore[date] = code;
          else toClear.push(date);
        });
        if (Object.keys(restore).length > 0) setShiftsBulk(restore);
        toClear.forEach((d) => clearShift(d));
      });
      setRepeatMode(false);
      setPatternStart(null);
      setPatternEnd(null);
      repeatSheetRef.current?.close();
    },
    [shiftData, setShiftsBulk, clearShift, showToast]
  );

  const toggleRepeatMode = useCallback(() => {
    if (repeatMode) {
      setRepeatMode(false);
      setPatternStart(null);
      setPatternEnd(null);
      repeatSheetRef.current?.close();
    } else {
      setRepeatMode(true);
      setPatternStart(null);
      setPatternEnd(null);
      setTemplateMode(false);
      setSelectedTemplate(null);
      setTemplateStart(null);
      templateSheetRef.current?.close();
      daySheetRef.current?.close();
      repeatSheetRef.current?.snapToIndex(0);
    }
  }, [repeatMode]);

  const toggleTemplateMode = useCallback(() => {
    if (templateMode) {
      setTemplateMode(false);
      setSelectedTemplate(null);
      setTemplateStart(null);
      templateSheetRef.current?.close();
    } else {
      setTemplateMode(true);
      setSelectedTemplate(null);
      setTemplateStart(null);
      setRepeatMode(false);
      setPatternStart(null);
      setPatternEnd(null);
      repeatSheetRef.current?.close();
      daySheetRef.current?.close();
      templateSheetRef.current?.snapToIndex(0);
    }
  }, [templateMode]);

  const handleSelectTemplate = useCallback((template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setTemplateStart(null);
  }, []);

  const handleApplyTemplate = useCallback(
    (entries: Record<string, string>) => {
      const prevEntries: Record<string, string | undefined> = {};
      Object.keys(entries).forEach((date) => {
        prevEntries[date] = shiftData[date];
      });
      setShiftsBulk(entries);
      const count = Object.keys(entries).length;
      showToast(`Template applied to ${count} days`, () => {
        const restore: Record<string, string> = {};
        const toClear: string[] = [];
        Object.entries(prevEntries).forEach(([date, code]) => {
          if (code) restore[date] = code;
          else toClear.push(date);
        });
        if (Object.keys(restore).length > 0) setShiftsBulk(restore);
        toClear.forEach((d) => clearShift(d));
      });
      setTemplateMode(false);
      setSelectedTemplate(null);
      setTemplateStart(null);
      templateSheetRef.current?.close();
    },
    [shiftData, setShiftsBulk, clearShift, showToast]
  );

  const handleTemplateBack = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateStart(null);
  }, []);

  const handleTemplateClose = useCallback(() => {
    setTemplateMode(false);
    setSelectedTemplate(null);
    setTemplateStart(null);
  }, []);

  const allShiftCodes = useMemo(
    () => allShifts.map((s) => ({ code: s.code, label: s.label })),
    [allShifts]
  );

  const handleNotesSearchSelect = useCallback((date: string) => {
    setSelectedDate(date);
    daySheetRef.current?.snapToIndex(0);
  }, []);

  const openNotesSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    notesSearchRef.current?.snapToIndex(0);
  }, []);

  const clearPattern = useCallback(() => {
    setPatternStart(null);
    setPatternEnd(null);
  }, []);

  const handleSetLeave = useCallback(
    (id: string) => {
      if (selectedDate) {
        setLeave(selectedDate, id);
        clearShift(selectedDate);
      }
    },
    [selectedDate, setLeave, clearShift]
  );

  const handleToastHide = useCallback(() => {
    setToastVisible(false);
    setToastUndo(undefined);
  }, []);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent',
      calendarBackground: 'transparent',
      textSectionTitleColor: colors.textSecondary,
      dayTextColor: colors.text,
      textDisabledColor: colors.textSecondary + '40',
      monthTextColor: colors.text,
      todayTextColor: colors.primary,
    }),
    [colors]
  );

  const leaveInfoMap = useMemo(() => {
    const map = new Map<string, { color: string; icon: string; code: string }>();
    leaveTypes.forEach(lt => map.set(lt.id, { color: lt.color, icon: lt.icon, code: lt.code }));
    return map;
  }, [leaveTypes]);

  const renderDay = useCallback(
    ({ date, state }: any) => {
      const ds = date?.dateString;
      const code = ds ? shiftData[ds] : undefined;
      const shift = code ? getShiftByCode(code) : undefined;
      const hasNote = ds ? !!notesData[ds] : false;
      const hasOvertime = ds ? (overtimeData[ds] || 0) > 0 : false;
      const hasSwap = ds ? !!swapsData[ds] : false;
      const leaveId = ds ? leaveData[ds] : undefined;
      const leaveInfo = leaveId ? leaveInfoMap.get(leaveId) : undefined;
      const inPattern = ds ? patternDates.has(ds) : false;

      return (
        <CalendarDay
          date={date}
          state={state}
          shift={shift}
          hasNote={hasNote}
          hasOvertime={hasOvertime}
          hasSwap={hasSwap}
          leaveInfo={leaveInfo}
          isToday={ds === todayStr}
          isSelected={!repeatMode && ds === selectedDate}
          isPatternStart={repeatMode && ds === patternStart}
          isPatternEnd={repeatMode && ds === patternEnd}
          isInPattern={repeatMode && inPattern}
          onPress={handleDayPress}
          onLongPress={handleDayLongPress}
          colors={colors}
        />
      );
    },
    [shiftData, notesData, overtimeData, swapsData, leaveData, leaveInfoMap, getShiftByCode, todayStr, selectedDate, patternDates, repeatMode, patternStart, patternEnd, handleDayPress, handleDayLongPress, colors]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <MonthHeader
        currentDate={currentMonth}
        onPrev={handlePrev}
        onNext={handleNext}
        textColor={colors.text}
      />

      {/* Top row: Today pill + View mode toggle */}
      <View style={styles.topRow}>
        {!isCurrentMonth ? (
          <TouchableOpacity
            style={[styles.todayPill, { backgroundColor: colors.primary }]}
            onPress={goToToday}
            activeOpacity={0.7}
            accessibilityLabel="Go to today"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="calendar-today" size={14} color="#FFF" />
            <Text style={styles.todayPillText}>Today</Text>
          </TouchableOpacity>
        ) : <View />}

        <View style={styles.topRowRight}>
        <TouchableOpacity
          style={[styles.templatePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openNotesSearch}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="note-search-outline" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
        {viewMode === 'month' && (
          <TouchableOpacity
            style={[
              styles.templatePill,
              {
                backgroundColor: templateMode ? colors.primary : colors.surface,
                borderColor: templateMode ? colors.primary : colors.border,
              },
            ]}
            onPress={toggleTemplateMode}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={templateMode ? 'close' : 'view-grid-outline'}
              size={14}
              color={templateMode ? '#FFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {viewMode === 'month' && (
          <TouchableOpacity
            style={[
              styles.repeatPill,
              {
                backgroundColor: repeatMode ? colors.primary : colors.surface,
                borderColor: repeatMode ? colors.primary : colors.border,
              },
            ]}
            onPress={toggleRepeatMode}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={repeatMode ? 'close' : 'repeat'}
              size={14}
              color={repeatMode ? '#FFF' : colors.textSecondary}
            />
            <Text style={[styles.repeatPillText, { color: repeatMode ? '#FFF' : colors.textSecondary }]}>
              {repeatMode ? 'Cancel' : 'Repeat'}
            </Text>
          </TouchableOpacity>
        )}
        <View style={[styles.viewToggle, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'month' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('month')}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={16}
              color={viewMode === 'month' ? '#FFF' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'week' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('week')}
          >
            <MaterialCommunityIcons
              name="view-week-outline"
              size={16}
              color={viewMode === 'week' ? '#FFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        </View>
      </View>

      <CalendarSwitcher
        calendars={calendars}
        activeCalendarId={activeCalendar.id}
        onSwitch={switchCalendar}
        colors={colors}
      />

      {templateMode && viewMode === 'month' && (
        <View style={[styles.hintBar, { backgroundColor: colors.primary + '0C' }]}>
          <View style={[styles.hintDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.hintText, { color: colors.primary }]}>
            {!selectedTemplate
              ? 'Pick a template from the sheet below'
              : !templateStart
              ? 'Now tap a start date on the calendar'
              : 'Choose how far to apply'}
          </Text>
        </View>
      )}

      {repeatMode && viewMode === 'month' && (
        <View style={[styles.hintBar, { backgroundColor: colors.primary + '0C' }]}>
          <View style={[styles.hintDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.hintText, { color: colors.primary }]}>
            {!patternStart
              ? 'Tap the first day of your pattern'
              : !patternEnd
              ? 'Now tap the last day'
              : `${patternDates.size} days selected`}
          </Text>
        </View>
      )}

      {/* Swipeable calendar / week view */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.calendarWrap, calendarAnimStyle]}>
          {viewMode === 'month' ? (
            <Calendar
              key={monthKey + weekStart + activeCalendar.id}
              current={monthKey + '-01'}
              markingType="custom"
              markedDates={markedDates}
              dayComponent={renderDay}
              hideArrows
              firstDay={weekStart}
              theme={calendarTheme}
              style={styles.calendar}
            />
          ) : (
            <WeekView
              currentDate={currentMonth}
              weekStart={weekStart}
              shiftData={shiftData}
              notesData={notesData}
              overtimeData={overtimeData}
              getShiftByCode={getShiftByCode}
              onDayPress={handleDayPress}
              selectedDate={selectedDate}
              colors={colors}
            />
          )}
        </Animated.View>
      </GestureDetector>

      <DaySheet
        ref={daySheetRef}
        selectedDate={selectedDate}
        currentShift={
          selectedDate && shiftData[selectedDate] ? getShiftByCode(shiftData[selectedDate]) : undefined
        }
        currentNote={selectedDate ? notesData[selectedDate] || '' : ''}
        currentOvertime={selectedDate ? overtimeData[selectedDate] || 0 : 0}
        allShifts={allShifts}
        onSelectShift={handleSelectShift}
        onClear={handleClear}
        onSaveNote={handleSaveNote}
        onSetOvertime={handleSetOvertime}
        currentSwap={selectedDate ? swapsData[selectedDate] : undefined}
        allShiftCodes={allShiftCodes}
        onOfferSwap={offerSwap}
        onCancelSwap={cancelSwap}
        currentLeaveId={selectedDate ? leaveData[selectedDate] : undefined}
        leaveTypes={leaveTypes}
        onSetLeave={handleSetLeave}
        onClearLeave={clearLeave}
        colors={colors}
      />

      <RepeatSheet
        ref={repeatSheetRef}
        shiftData={shiftData}
        getShiftByCode={getShiftByCode}
        onApplyPattern={handleApplyPattern}
        onClearPattern={clearPattern}
        currentMonth={currentMonth}
        patternStart={patternStart}
        patternEnd={patternEnd}
        colors={colors}
      />

      <TemplateSheet
        ref={templateSheetRef}
        getShiftByCode={getShiftByCode}
        selectedTemplate={selectedTemplate}
        templateStart={templateStart}
        onSelectTemplate={handleSelectTemplate}
        onApply={handleApplyTemplate}
        onClose={handleTemplateClose}
        onBack={handleTemplateBack}
        currentMonth={currentMonth}
        colors={colors}
      />

      <NotesSearchSheet
        ref={notesSearchRef}
        notesData={notesData}
        onSelectDate={handleNotesSearchSelect}
        colors={colors}
      />

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={handleToastHide}
        onUndo={toastUndo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  todayPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  viewToggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  calendarWrap: { flex: 1, overflow: 'hidden' },
  calendar: { marginHorizontal: 6 },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templatePill: {
    width: 44,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  repeatPillText: { fontSize: 12, fontWeight: '700' },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  hintDot: { width: 6, height: 6, borderRadius: 3 },
  hintText: { fontSize: 12, fontWeight: '600' },
});
