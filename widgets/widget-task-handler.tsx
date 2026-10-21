import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SHIFTS, ShiftType } from '../constants/shifts';
import { DEFAULT_LEAVE_TYPES } from '../constants/leaveTypes';
import { WeekStart } from '../utils/dates';
import { buildWidgetModel } from './widgetModel';
import { renderShiftWidget } from './ShiftWeekWidget';

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Reads what the widget needs straight from storage (runs headless, without the app UI). */
async function loadWidget() {
  const pairs = new Map(
    await AsyncStorage.multiGet(['week_start', 'time_format', 'theme_mode', 'primary_calendar', 'all_shifts_v2', 'calendars_list'])
  );
  const calendars = parse<{ id: string; name: string }[]>(pairs.get('calendars_list'), []);
  const wanted = pairs.get('primary_calendar') || 'default';
  const calendar = calendars.find((c) => c.id === wanted) ?? calendars.find((c) => c.id === 'default');
  const calId = calendar?.id ?? 'default';
  const data = new Map(await AsyncStorage.multiGet([`shift_data_${calId}`, `leave_data_${calId}`]));
  const week = pairs.get('week_start');

  const model = buildWidgetModel({
    shifts: parse<Record<string, string>>(data.get(`shift_data_${calId}`), {}),
    leave: parse<Record<string, string>>(data.get(`leave_data_${calId}`), {}),
    allShifts: parse<ShiftType[]>(pairs.get('all_shifts_v2'), DEFAULT_SHIFTS),
    leaveTypes: DEFAULT_LEAVE_TYPES,
    weekStart: (week === '1' || week === '6' ? Number(week) : 0) as WeekStart,
    timeFormat: pairs.get('time_format') === '12h' ? '12h' : '24h',
    calendarName: calendar?.name ?? 'My Shifts',
  });
  return renderShiftWidget(model, pairs.get('theme_mode') || 'system');
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK':
      props.renderWidget(await loadWidget());
      break;
    default:
      break;
  }
}
