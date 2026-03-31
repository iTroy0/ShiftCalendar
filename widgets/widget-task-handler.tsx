import React from 'react';
import { Appearance } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftWeekWidget } from './ShiftWeekWidget';

interface ShiftType {
  code: string;
  label: string;
  color: string;
  icon: string;
}

function getShiftByCode(allShifts: ShiftType[], code: string): ShiftType | undefined {
  return allShifts.find((s) => s.code === code);
}

function getCurrentWeekDays(weekStart: number) {
  const today = new Date();
  const todayDay = today.getDay();
  const diff = (todayDay - weekStart + 7) % 7;
  const weekStartDate = new Date(today);
  weekStartDate.setDate(today.getDate() - diff);
  weekStartDate.setHours(0, 0, 0, 0);

  const todayStr = formatDate(today);
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    const dateStr = formatDate(d);
    days.push({
      dateStr,
      dayLetter: dayLetters[d.getDay()],
      dayNum: String(d.getDate()),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getWidgetData() {
  const [weekStartStr, activeCalId, allShiftsJson, themeMode] = await Promise.all([
    AsyncStorage.getItem('week_start'),
    AsyncStorage.getItem('active_calendar'),
    AsyncStorage.getItem('all_shifts_v2'),
    AsyncStorage.getItem('theme_mode'),
  ]);

  const weekStart = weekStartStr === '1' ? 1 : 0;
  const calId = activeCalId || 'default';
  let allShifts: ShiftType[] = [];
  try { if (allShiftsJson) allShifts = JSON.parse(allShiftsJson); } catch {}

  // Resolve theme: respect user preference, fall back to system
  let isDark = true;
  if (themeMode === 'light') {
    isDark = false;
  } else if (themeMode === 'dark') {
    isDark = true;
  } else {
    // 'system' or unset — detect from system
    isDark = Appearance.getColorScheme() !== 'light';
  }

  const shiftDataJson = await AsyncStorage.getItem(`shift_data_${calId}`);
  let shiftData: Record<string, string> = {};
  try { if (shiftDataJson) shiftData = JSON.parse(shiftDataJson); } catch {}

  return { weekStart, shiftData, allShifts, isDark };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK': {
      const { weekStart, shiftData, allShifts, isDark } = await getWidgetData();
      const weekDays = getCurrentWeekDays(weekStart);

      const days = weekDays.map((day) => {
        const code = shiftData[day.dateStr];
        const shift = code ? getShiftByCode(allShifts, code) : undefined;
        return {
          ...day,
          shiftCode: shift?.code || '',
          shiftColor: shift?.color || '',
        };
      });

      props.renderWidget(<ShiftWeekWidget days={days} isDark={isDark} />);
      break;
    }
    default:
      break;
  }
}
