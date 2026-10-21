import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, BackHandler, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import BottomSheet, { BottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { useAppSettings } from '../../hooks/SettingsContext';
import { useShifts } from '../../hooks/ShiftContext';
import { useToday } from '../../hooks/useToday';
import { ShiftType } from '../../constants/shifts';
import { ShiftTemplate } from '../../constants/templates';
import { AssignmentSnapshot } from '../../hooks/useShiftData';
import {
  fromDateKey,
  monthFromIndex,
  monthIndexOf,
  monthKeyOf,
  toDateKey,
  weekIndexOf,
  weekStartFromIndex,
  WeekStart,
} from '../../utils/dates';
import { getUpcoming } from '../../utils/schedule';
import { computeStats, monthRange } from '../../utils/statsCalculation';
import { haptic } from '../../utils/haptics';
import { CalendarHeader } from '../../components/calendar/CalendarHeader';
import { Pager } from '../../components/calendar/Pager';
import { MonthGrid, WeekdayHeader } from '../../components/calendar/MonthGrid';
import { WeekAgenda } from '../../components/calendar/WeekAgenda';
import { CalendarMode, ModeBar, ToolRow } from '../../components/calendar/ToolRow';
import { Brush, PaintPalette } from '../../components/calendar/PaintPalette';
import { MonthPickerModal } from '../../components/calendar/MonthPickerModal';
import { MonthSummary } from '../../components/calendar/MonthSummary';
import { CalendarSwitcher } from '../../components/CalendarSwitcher';
import { DaySheet } from '../../components/DaySheet';
import { QUICK_FILL_COLLAPSED, RepeatSheet } from '../../components/RepeatSheet';
import { TemplateSheet } from '../../components/TemplateSheet';
import { NotesSearchSheet } from '../../components/NotesSearchSheet';
import { Toast, ToastMessage } from '../../components/Toast';

const GRID_PADDING = 8;
const PALETTE_SPACE = 76;
const SIDE_PANE_WIDTH = 330;

function weekTitle(index: number, weekStart: WeekStart) {
  const start = weekStartFromIndex(index, weekStart);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  return {
    title: sameMonth ? `${format(start, 'MMM d')} – ${format(end, 'd')}` : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`,
    year: format(end, 'yyyy'),
  };
}

export default function CalendarScreen() {
  const { colors, isDark, weekStart, timeFormat, showShiftTimes, baseRate, overtimeRate, paidLeaveHours } = useAppSettings();
  const {
    shiftData, leaveData, notesData, overtimeData, swapsData, allShifts, leaveTypes, getShiftByCode, getLeaveType,
    lastUsedShift, calendars, activeCalendarId, switchCalendar, setShift, clearShift, setLeave, clearLeave, clearDay,
    applyShiftEntries, restoreAssignments, snapshotAssignments,
  } = useShifts();
  const { width: winW, height: winH } = useWindowDimensions();
  const twoPane = winW > winH && winW >= 640;

  const today = useToday();
  const todayDate = fromDateKey(today);
  const todayMonthIdx = monthIndexOf(todayDate);
  const todayWeekIdx = weekIndexOf(todayDate, weekStart);

  const [view, setView] = useState<'month' | 'week'>('month');
  const [monthIdx, setMonthIdx] = useState(todayMonthIdx);
  const [weekIdx, setWeekIdx] = useState(todayWeekIdx);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mode, setMode] = useState<CalendarMode>('normal');
  const [brush, setBrush] = useState<Brush | null>(null);
  const [paintHistory, setPaintHistory] = useState<AssignmentSnapshot[]>([]);
  const [patternStart, setPatternStart] = useState<string | null>(null);
  const [patternEnd, setPatternEnd] = useState<string | null>(null);
  const [templateStart, setTemplateStart] = useState(today);
  const [activeTemplate, setActiveTemplate] = useState<ShiftTemplate | null>(null);
  const [preview, setPreview] = useState<Map<string, ShiftType | null> | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

  const daySheetRef = useRef<BottomSheetModal>(null);
  const notesRef = useRef<BottomSheetModal>(null);
  const repeatRef = useRef<BottomSheet>(null);
  const templateRef = useRef<BottomSheet>(null);
  const daySheetOpen = useRef(false);
  const notesOpen = useRef(false);
  const toastId = useRef(0);

  // Keep the visible week when the week-start preference changes.
  const prevWeekStart = useRef(weekStart);
  useEffect(() => {
    if (prevWeekStart.current === weekStart) return;
    const start = weekStartFromIndex(weekIdx, prevWeekStart.current);
    const mid = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 3);
    prevWeekStart.current = weekStart;
    setWeekIdx(weekIndexOf(mid, weekStart));
  }, [weekStart, weekIdx]);

  const showToast = useCallback((message: string, undo?: () => void, tone: ToastMessage['tone'] = 'success') => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, undo, tone });
  }, []);

  const openDaySheet = useCallback((key: string) => {
    setSelectedDate(key);
    if (!daySheetOpen.current) {
      daySheetOpen.current = true;
      daySheetRef.current?.present();
    }
  }, []);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Idempotent: sheets call this from onClose, which may fire again after we close them.
  const exitMode = useCallback(() => {
    const current = modeRef.current;
    if (current === 'normal') return;
    modeRef.current = 'normal';
    setMode('normal');
    setPreview(null);
    setPatternStart(null);
    setPatternEnd(null);
    setActiveTemplate(null);
    setPaintHistory([]);
    if (current === 'repeat') repeatRef.current?.close();
    if (current === 'template') templateRef.current?.close();
  }, []);

  const enterMode = useCallback(
    (next: CalendarMode) => {
      haptic.light();
      daySheetRef.current?.dismiss();
      setPreview(null);
      modeRef.current = next;
      setMode(next);
      if (next === 'paint') {
        setPaintHistory([]);
        setBrush((b) => b ?? (lastUsedShift && getShiftByCode(lastUsedShift) ? { kind: 'shift', code: lastUsedShift } : allShifts[0] ? { kind: 'shift', code: allShifts[0].code } : null));
      } else if (next === 'repeat') {
        setPatternStart(null);
        setPatternEnd(null);
        repeatRef.current?.snapToIndex(0);
      } else if (next === 'template') {
        const viewedMonth = monthFromIndex(monthIdx);
        setTemplateStart(monthIdx === todayMonthIdx || view === 'week' ? selectedDate ?? today : toDateKey(viewedMonth));
        templateRef.current?.snapToIndex(2);
      }
    },
    [allShifts, getShiftByCode, lastUsedShift, monthIdx, todayMonthIdx, selectedDate, today, view]
  );

  // --- Day interactions (read through a ref so cells keep stable callbacks) ---
  const paint = (key: string) => {
    if (!brush) return;
    const before = snapshotAssignments([key]);
    const cur = before[key];
    if (brush.kind === 'erase') {
      if (!cur.shift && !cur.leave) return;
      clearDay(key);
    } else if (brush.kind === 'shift') {
      if (cur.shift === brush.code && !cur.leave) clearShift(key);
      else setShift(key, brush.code);
    } else if (cur.leave === brush.id) {
      clearLeave(key);
    } else {
      setLeave(key, brush.id);
    }
    haptic.selection();
    setPaintHistory((h) => [...h.slice(-99), before]);
  };

  const selectPatternDay = (key: string) => {
    haptic.light();
    if (!patternStart || patternEnd) {
      setPatternStart(key);
      setPatternEnd(null);
      return;
    }
    if (key < patternStart) {
      setPatternEnd(patternStart);
      setPatternStart(key);
    } else {
      setPatternEnd(key);
    }
    // Stay collapsed so the repeated pattern can be previewed on the calendar.
    repeatRef.current?.snapToIndex(0);
  };

  const handleDayPress = (key: string) => {
    if (mode === 'paint') return paint(key);
    if (mode === 'repeat') return selectPatternDay(key);
    if (mode === 'template') {
      haptic.light();
      setTemplateStart(key);
      if (!activeTemplate) templateRef.current?.snapToIndex(2);
      return;
    }
    haptic.light();
    openDaySheet(key);
  };

  const handleDayLongPress = (key: string) => {
    if (mode === 'paint') return openDaySheet(key);
    if (mode !== 'normal') return;
    const shift = lastUsedShift ? getShiftByCode(lastUsedShift) : undefined;
    if (!shift) {
      showToast('Assign a shift once, then long-press any day to repeat it.', undefined, 'info');
      return;
    }
    const before = snapshotAssignments([key]);
    setShift(key, shift.code);
    haptic.heavy();
    showToast(`${shift.label} · ${format(fromDateKey(key), 'EEE, MMM d')}`, () => restoreAssignments(before));
  };

  // A swipe between months must never also count as a tap on the day where it started.
  const panUntil = useRef(0);
  const onPanStateChange = useCallback((active: boolean) => {
    panUntil.current = active ? Number.MAX_SAFE_INTEGER : Date.now() + 150;
  }, []);

  const pressRef = useRef(handleDayPress);
  const longPressRef = useRef(handleDayLongPress);
  pressRef.current = handleDayPress;
  longPressRef.current = handleDayLongPress;
  const onDayPress = useCallback((key: string) => {
    if (Date.now() < panUntil.current) return;
    pressRef.current(key);
  }, []);
  const onDayLongPress = useCallback((key: string) => {
    if (Date.now() < panUntil.current) return;
    longPressRef.current(key);
  }, []);

  const undoPaint = () => {
    const last = paintHistory[paintHistory.length - 1];
    if (!last) return;
    restoreAssignments(last);
    setPaintHistory((h) => h.slice(0, -1));
    haptic.light();
  };

  const handleApplyEntries = useCallback(
    (entries: Record<string, string | null>, summary: string) => {
      const before = applyShiftEntries(entries);
      haptic.success();
      showToast(summary, () => restoreAssignments(before));
      exitMode();
    },
    [applyShiftEntries, restoreAssignments, showToast, exitMode]
  );

  // --- Navigation ---
  const goToday = () => {
    haptic.light();
    setMonthIdx(todayMonthIdx);
    setWeekIdx(todayWeekIdx);
  };

  const step = (dir: 1 | -1) => {
    haptic.selection();
    if (view === 'month') setMonthIdx((i) => i + dir);
    else setWeekIdx((i) => i + dir);
  };

  const toggleView = () => {
    haptic.selection();
    if (view === 'month') {
      const month = monthFromIndex(monthIdx);
      let anchor = month;
      if (selectedDate && monthKeyOf(fromDateKey(selectedDate)) === monthKeyOf(month)) anchor = fromDateKey(selectedDate);
      else if (monthIdx === todayMonthIdx) anchor = todayDate;
      setWeekIdx(weekIndexOf(anchor, weekStart));
      setView('week');
    } else {
      const start = weekStartFromIndex(weekIdx, weekStart);
      setMonthIdx(monthIndexOf(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 3)));
      setView('month');
    }
  };

  const pickMonth = (index: number) => {
    setMonthPickerOpen(false);
    haptic.selection();
    setMonthIdx(index);
    setWeekIdx(weekIndexOf(monthFromIndex(index), weekStart));
  };

  const openNotes = () => {
    haptic.light();
    notesOpen.current = true;
    notesRef.current?.present();
  };

  const selectFromNotes = useCallback(
    (key: string) => {
      const d = fromDateKey(key);
      setMonthIdx(monthIndexOf(d));
      setWeekIdx(weekIndexOf(d, weekStart));
      setTimeout(() => openDaySheet(key), 250);
    },
    [weekStart, openDaySheet]
  );

  // Android back: close sheets and modes before leaving the screen.
  const backState = useRef({ mode, monthPickerOpen });
  backState.current = { mode, monthPickerOpen };
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (daySheetOpen.current) {
          daySheetRef.current?.dismiss();
          return true;
        }
        if (notesOpen.current) {
          notesRef.current?.dismiss();
          return true;
        }
        if (backState.current.mode !== 'normal') {
          exitMode();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [exitMode])
  );

  // --- Derived ---
  const upcoming = useMemo(
    () => getUpcoming({ shifts: shiftData, leave: leaveData, getShiftByCode, getLeaveType, timeFormat, now: todayDate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shiftData, leaveData, getShiftByCode, getLeaveType, timeFormat, today]
  );

  const monthStats = useMemo(() => {
    if (!twoPane) return null;
    const m = monthFromIndex(monthIdx);
    return computeStats({
      shifts: shiftData, overtime: overtimeData, leave: leaveData, allShifts, leaveTypes,
      baseRate, overtimeRate, paidLeaveHours, ...monthRange(m.getFullYear(), m.getMonth()),
    });
  }, [twoPane, monthIdx, shiftData, overtimeData, leaveData, allShifts, leaveTypes, baseRate, overtimeRate, paidLeaveHours]);

  const viewedMonth = monthFromIndex(monthIdx);
  const header =
    view === 'month' ? { title: format(viewedMonth, 'MMMM'), year: format(viewedMonth, 'yyyy') } : weekTitle(weekIdx, weekStart);
  const showToday = view === 'month' ? monthIdx !== todayMonthIdx : weekIdx !== todayWeekIdx;

  // Keep the whole month visible above the paint palette or a collapsed quick-fill sheet.
  // (In landscape there isn't enough height to shrink for a sheet; it can be dragged down instead.)
  const quickFill = (mode === 'repeat' || mode === 'template') && !twoPane;
  const bottomSpace = mode === 'paint' ? PALETTE_SPACE : quickFill ? QUICK_FILL_COLLAPSED : 0;
  const gridW = Math.max(gridSize.width - GRID_PADDING * 2, 0);
  const gridH = Math.max(gridSize.height - bottomSpace - 6, 0);
  const rangeStart = mode === 'repeat' ? patternStart : mode === 'template' ? templateStart : null;
  const rangeEnd = mode === 'repeat' ? patternEnd : null;
  const livePreview = mode === 'repeat' || mode === 'template' ? preview : null;

  const renderMonth = (index: number) => (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      <MonthGrid
        monthIndex={index}
        weekStart={weekStart}
        width={gridW}
        height={gridH}
        shifts={shiftData}
        leave={leaveData}
        notes={notesData}
        overtime={overtimeData}
        swaps={swapsData}
        getShiftByCode={getShiftByCode}
        getLeaveType={getLeaveType}
        todayKey={today}
        selectedDate={mode === 'normal' || mode === 'paint' ? selectedDate : null}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        preview={livePreview}
        showTime={showShiftTimes}
        timeFormat={timeFormat}
        colors={colors}
        isDark={isDark}
        onDayPress={onDayPress}
        onDayLongPress={onDayLongPress}
      />
    </View>
  );

  const renderWeek = (index: number) => (
    <WeekAgenda
      weekIndex={index}
      weekStart={weekStart}
      shifts={shiftData}
      leave={leaveData}
      notes={notesData}
      overtime={overtimeData}
      swaps={swapsData}
      getShiftByCode={getShiftByCode}
      getLeaveType={getLeaveType}
      todayKey={today}
      selectedDate={selectedDate}
      preview={livePreview}
      timeFormat={timeFormat}
      colors={colors}
      bottomInset={bottomSpace}
      onDayPress={onDayPress}
      onDayLongPress={onDayLongPress}
    />
  );

  const modeBar =
    mode === 'paint' ? (
      <ModeBar
        colors={colors}
        icon="brush-variant"
        text="Tap days to paint. Tap again to remove."
        doneLabel="Done"
        onDone={exitMode}
        onUndo={undoPaint}
        undoDisabled={paintHistory.length === 0}
      />
    ) : mode === 'repeat' ? (
      <ModeBar
        colors={colors}
        icon="repeat"
        text={!patternStart ? 'Tap the first day of the pattern' : !patternEnd ? 'Now tap the last day' : 'Previewing · apply below or tap to restart'}
        doneLabel="Cancel"
        onDone={exitMode}
      />
    ) : mode === 'template' ? (
      <ModeBar
        colors={colors}
        icon="view-grid-plus-outline"
        text={activeTemplate ? `Starts ${format(fromDateKey(templateStart), 'MMM d')} · tap a day to move` : 'Pick a rotation below'}
        doneLabel="Cancel"
        onDone={exitMode}
      />
    ) : null;

  const controls = (
    <>
      <CalendarHeader
        title={header.title}
        year={header.year}
        upcoming={upcoming}
        isEmpty={Object.keys(shiftData).length === 0 && Object.keys(leaveData).length === 0}
        showToday={showToday}
        view={view}
        colors={colors}
        compact={twoPane}
        onTitlePress={() => setMonthPickerOpen(true)}
        onToday={goToday}
        onSearch={openNotes}
        onToggleView={toggleView}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
      <CalendarSwitcher calendars={calendars} activeCalendarId={activeCalendarId} onSwitch={switchCalendar} colors={colors} />
      {modeBar ?? (
        <ToolRow
          colors={colors}
          onPaint={() => enterMode('paint')}
          onRepeat={() => enterMode('repeat')}
          onTemplate={() => enterMode('template')}
          canRepeat
        />
      )}
    </>
  );

  const onGridLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setGridSize((s) => (s.width === width && s.height === height ? s : { width, height }));
  };

  const calendarBody = (
    <View style={styles.flex}>
      {view === 'month' && (
        <View style={[styles.weekdays, { paddingHorizontal: GRID_PADDING }]}>
          {gridW > 0 && (
            <WeekdayHeader
              weekStart={weekStart}
              colors={colors}
              width={gridW}
              todayWeekday={monthIdx === todayMonthIdx ? todayDate.getDay() : null}
            />
          )}
        </View>
      )}
      <View style={styles.flex} onLayout={onGridLayout}>
        {gridSize.width > 0 && gridSize.height > 0 && (
          view === 'month' ? (
            <Pager
              key="month"
              index={monthIdx}
              onIndexChange={(i) => {
                haptic.selection();
                setMonthIdx(i);
              }}
              renderPage={renderMonth}
              width={gridSize.width}
              onPanStateChange={onPanStateChange}
            />
          ) : (
            <Pager
              key="week"
              index={weekIdx}
              onIndexChange={setWeekIdx}
              renderPage={renderWeek}
              width={gridSize.width}
              onPanStateChange={onPanStateChange}
            />
          )
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      {twoPane ? (
        <View style={styles.row}>
          <ScrollView style={{ width: SIDE_PANE_WIDTH, flexGrow: 0 }} contentContainerStyle={styles.sidePane} showsVerticalScrollIndicator={false}>
            {controls}
            {monthStats && view === 'month' && <MonthSummary stats={monthStats} allShifts={allShifts} leaveTypes={leaveTypes} colors={colors} />}
          </ScrollView>
          {calendarBody}
        </View>
      ) : (
        <>
          {controls}
          {calendarBody}
        </>
      )}

      {mode === 'paint' && (
        <PaintPalette shifts={allShifts} leaveTypes={leaveTypes} brush={brush} onSelect={(b) => { haptic.selection(); setBrush(b); }} colors={colors} />
      )}

      <RepeatSheet
        ref={repeatRef}
        active={mode === 'repeat'}
        patternStart={patternStart}
        patternEnd={patternEnd}
        onReset={() => {
          setPatternStart(null);
          setPatternEnd(null);
          repeatRef.current?.snapToIndex(0);
        }}
        onClose={exitMode}
        onApply={handleApplyEntries}
        onPreview={setPreview}
      />
      <TemplateSheet
        ref={templateRef}
        active={mode === 'template'}
        startKey={templateStart}
        onStartChange={setTemplateStart}
        onClose={exitMode}
        onApply={handleApplyEntries}
        onPreview={setPreview}
        onTemplateChange={setActiveTemplate}
      />
      <DaySheet
        ref={daySheetRef}
        dateKey={selectedDate}
        onDismiss={() => {
          daySheetOpen.current = false;
          setSelectedDate(null);
        }}
        onToast={showToast}
      />
      <NotesSearchSheet
        ref={notesRef}
        onSelectDate={selectFromNotes}
        onDismiss={() => {
          notesOpen.current = false;
        }}
      />
      <MonthPickerModal
        visible={monthPickerOpen}
        monthIndex={view === 'month' ? monthIdx : monthIndexOf(weekStartFromIndex(weekIdx, weekStart))}
        todayIndex={todayMonthIdx}
        colors={colors}
        onSelect={pickMonth}
        onClose={() => setMonthPickerOpen(false)}
      />
      <Toast toast={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  sidePane: { paddingBottom: 24 },
  weekdays: { minHeight: 26 },
});
