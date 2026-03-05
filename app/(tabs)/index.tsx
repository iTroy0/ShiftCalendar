import React, { useState, useCallback, useRef, useMemo } from 'react';
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
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { useAppTheme } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { MonthHeader } from '../../components/MonthHeader';
import { DaySheet } from '../../components/DaySheet';
import { RepeatSheet } from '../../components/RepeatSheet';
import { CalendarDay } from '../../components/CalendarDay';
import { Toast } from '../../components/Toast';
import { CalendarSwitcher } from '../../components/CalendarSwitcher';

const SWIPE_THRESHOLD = 50;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CalendarScreen() {
  const { colors, weekStart } = useAppTheme();
  const {
    shiftData,
    notesData,
    overtimeData,
    setShift,
    clearShift,
    setShiftsBulk,
    setNote,
    setOvertime,
    allShifts,
    getShiftByCode,
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
  const daySheetRef = useRef<BottomSheet>(null);
  const repeatSheetRef = useRef<BottomSheet>(null);

  const monthKey = format(currentMonth, 'yyyy-MM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Animation shared values
  const translateX = useSharedValue(0);
  const animOpacity = useSharedValue(1);

  const SPRING_CONFIG = { damping: 20, stiffness: 220, mass: 0.8 };

  const changeMonth = useCallback((dir: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((d) => (dir > 0 ? addMonths(d, 1) : subMonths(d, 1)));
  }, []);

  // Button handlers – spring animation runs on UI thread before heavy re-render
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

  // Swipe gesture for month navigation
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
      const s = parseISO(patternStart);
      const e = parseISO(patternEnd);
      const cur = new Date(s);
      while (cur <= e) {
        set.add(format(cur, 'yyyy-MM-dd'));
        cur.setDate(cur.getDate() + 1);
      }
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
    [repeatMode, patternStart, patternEnd]
  );

  const handleSelectShift = useCallback(
    (code: string) => {
      if (selectedDate) setShift(selectedDate, code);
    },
    [selectedDate, setShift]
  );

  const handleClear = useCallback(() => {
    if (selectedDate) clearShift(selectedDate);
  }, [selectedDate, clearShift]);

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
      setShiftsBulk(entries);
      const count = Object.keys(entries).length;
      setToastMsg(`Pattern applied to ${count} days`);
      setToastVisible(true);
      setRepeatMode(false);
      setPatternStart(null);
      setPatternEnd(null);
      repeatSheetRef.current?.close();
    },
    [setShiftsBulk]
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
      daySheetRef.current?.close();
      repeatSheetRef.current?.snapToIndex(0);
    }
  }, [repeatMode]);

  const clearPattern = useCallback(() => {
    setPatternStart(null);
    setPatternEnd(null);
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

  const renderDay = useCallback(
    (date: any, state: any) => {
      const ds = date?.dateString;
      const code = ds ? shiftData[ds] : undefined;
      const shift = code ? getShiftByCode(code) : undefined;
      const hasNote = ds ? !!notesData[ds] : false;
      const hasOvertime = ds ? (overtimeData[ds] || 0) > 0 : false;
      const inPattern = ds ? patternDates.has(ds) : false;

      return (
        <CalendarDay
          date={date}
          state={state}
          shift={shift}
          hasNote={hasNote}
          hasOvertime={hasOvertime}
          isToday={ds === todayStr}
          isSelected={!repeatMode && ds === selectedDate}
          isPatternStart={repeatMode && ds === patternStart}
          isPatternEnd={repeatMode && ds === patternEnd}
          isInPattern={repeatMode && inPattern}
          onPress={handleDayPress}
          colors={colors}
        />
      );
    },
    [shiftData, notesData, overtimeData, getShiftByCode, todayStr, selectedDate, patternDates, repeatMode, patternStart, patternEnd, handleDayPress, colors]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <MonthHeader
        currentDate={currentMonth}
        onPrev={handlePrev}
        onNext={handleNext}
        textColor={colors.text}
      />

      <CalendarSwitcher
        calendars={calendars}
        activeCalendarId={activeCalendar.id}
        onSwitch={switchCalendar}
        colors={colors}
      />

      {/* Repeat toggle */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[
            styles.repeatToggle,
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
            size={16}
            color={repeatMode ? '#FFF' : colors.textSecondary}
          />
          <Text style={[styles.repeatToggleText, { color: repeatMode ? '#FFF' : colors.textSecondary }]}>
            {repeatMode ? 'Cancel' : 'Repeat'}
          </Text>
        </TouchableOpacity>
      </View>

      {repeatMode && (
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

      {/* Swipeable calendar with animation */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.calendarWrap, calendarAnimStyle]}>
          <Calendar
            key={monthKey + weekStart + activeCalendar.id}
            current={monthKey + '-01'}
            markingType="custom"
            markedDates={markedDates}
            dayComponent={({ date, state }: any) => renderDay(date, state)}
            hideArrows
            hideExtraDays
            firstDay={weekStart}
            theme={calendarTheme}
            style={styles.calendar}
          />
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

      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarWrap: { flex: 1, overflow: 'hidden' },
  calendar: { marginHorizontal: 4 },
  toolbar: { paddingHorizontal: 16, marginBottom: 4 },
  repeatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  repeatToggleText: { fontSize: 13, fontWeight: '700' },
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
