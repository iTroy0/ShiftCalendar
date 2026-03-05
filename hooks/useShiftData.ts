import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftType, DEFAULT_SHIFTS } from '../constants/shifts';

const CUSTOM_SHIFTS_KEY = 'custom_shifts';
const CALENDARS_KEY = 'calendars_list';
const ACTIVE_CALENDAR_KEY = 'active_calendar';

function dataKey(calId: string) {
  return `shift_data_${calId}`;
}
function notesKey(calId: string) {
  return `shift_notes_${calId}`;
}
function overtimeKey(calId: string) {
  return `shift_overtime_${calId}`;
}

export type ShiftData = Record<string, string>;
export type NotesData = Record<string, string>;
export type OvertimeData = Record<string, number>; // date -> overtime hours

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_CALENDAR: CalendarInfo = { id: 'default', name: 'My Shifts', color: '#6366F1' };

export function useShiftData() {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([DEFAULT_CALENDAR]);
  const [activeCalendarId, setActiveCalendarId] = useState('default');
  const [shiftData, setShiftData] = useState<ShiftData>({});
  const [notesData, setNotesData] = useState<NotesData>({});
  const [overtimeData, setOvertimeData] = useState<OvertimeData>({});
  const [customShifts, setCustomShiftsState] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);

  const allShifts = [...DEFAULT_SHIFTS, ...customShifts];

  const getShiftByCode = useCallback(
    (code: string): ShiftType | undefined => {
      return [...DEFAULT_SHIFTS, ...customShifts].find((s) => s.code === code);
    },
    [customShifts]
  );

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId) || DEFAULT_CALENDAR;

  // --- Load everything on mount ---
  useEffect(() => {
    (async () => {
      try {
        const [rawCals, rawActive, rawCustom] = await Promise.all([
          AsyncStorage.getItem(CALENDARS_KEY),
          AsyncStorage.getItem(ACTIVE_CALENDAR_KEY),
          AsyncStorage.getItem(CUSTOM_SHIFTS_KEY),
        ]);
        const cals: CalendarInfo[] = rawCals ? JSON.parse(rawCals) : [DEFAULT_CALENDAR];
        const active = rawActive || 'default';
        setCalendars(cals);
        setActiveCalendarId(active);
        if (rawCustom) setCustomShiftsState(JSON.parse(rawCustom));

        // Load data for active calendar
        const [rawShifts, rawNotes, rawOT] = await Promise.all([
          AsyncStorage.getItem(dataKey(active)),
          AsyncStorage.getItem(notesKey(active)),
          AsyncStorage.getItem(overtimeKey(active)),
        ]);
        if (rawShifts) setShiftData(JSON.parse(rawShifts));
        if (rawNotes) setNotesData(JSON.parse(rawNotes));
        if (rawOT) setOvertimeData(JSON.parse(rawOT));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Switch calendar ---
  const switchCalendar = useCallback(async (calId: string) => {
    // Save current first (already saved incrementally, but just in case)
    setActiveCalendarId(calId);
    AsyncStorage.setItem(ACTIVE_CALENDAR_KEY, calId).catch(console.error);
    try {
      const [rawShifts, rawNotes, rawOT] = await Promise.all([
        AsyncStorage.getItem(dataKey(calId)),
        AsyncStorage.getItem(notesKey(calId)),
        AsyncStorage.getItem(overtimeKey(calId)),
      ]);
      setShiftData(rawShifts ? JSON.parse(rawShifts) : {});
      setNotesData(rawNotes ? JSON.parse(rawNotes) : {});
      setOvertimeData(rawOT ? JSON.parse(rawOT) : {});
    } catch (e) {
      console.error('Failed to switch calendar', e);
    }
  }, []);

  const addCalendar = useCallback(async (cal: CalendarInfo) => {
    setCalendars((prev) => {
      const next = [...prev, cal];
      AsyncStorage.setItem(CALENDARS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  const deleteCalendar = useCallback(async (calId: string) => {
    if (calId === 'default') return; // can't delete default
    setCalendars((prev) => {
      const next = prev.filter((c) => c.id !== calId);
      AsyncStorage.setItem(CALENDARS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
    // Clean up data
    AsyncStorage.removeItem(dataKey(calId)).catch(console.error);
    AsyncStorage.removeItem(notesKey(calId)).catch(console.error);
    AsyncStorage.removeItem(overtimeKey(calId)).catch(console.error);
    // Switch to default if we deleted the active one
    if (calId === activeCalendarId) {
      switchCalendar('default');
    }
  }, [activeCalendarId, switchCalendar]);

  const renameCalendar = useCallback(async (calId: string, name: string, color: string) => {
    setCalendars((prev) => {
      const next = prev.map((c) => (c.id === calId ? { ...c, name, color } : c));
      AsyncStorage.setItem(CALENDARS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  // --- Shift operations ---
  const persist = useCallback((key: string, data: any) => {
    AsyncStorage.setItem(key, JSON.stringify(data)).catch(console.error);
  }, []);

  const setShift = useCallback((date: string, code: string) => {
    setShiftData((prev) => {
      const next = { ...prev, [date]: code };
      persist(dataKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const clearShift = useCallback((date: string) => {
    setShiftData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(dataKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const setShiftsBulk = useCallback((entries: Record<string, string>) => {
    setShiftData((prev) => {
      const next = { ...prev, ...entries };
      persist(dataKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  // --- Note operations ---
  const setNote = useCallback((date: string, note: string) => {
    setNotesData((prev) => {
      const next = { ...prev };
      if (note.trim()) {
        next[date] = note.trim();
      } else {
        delete next[date];
      }
      persist(notesKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const clearNote = useCallback((date: string) => {
    setNotesData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(notesKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  // --- Overtime operations ---
  const setOvertime = useCallback((date: string, hours: number) => {
    setOvertimeData((prev) => {
      const next = { ...prev };
      if (hours > 0) {
        next[date] = hours;
      } else {
        delete next[date];
      }
      persist(overtimeKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  // --- Custom shift operations ---
  const addCustomShift = useCallback((shift: ShiftType) => {
    setCustomShiftsState((prev) => {
      const next = [...prev, { ...shift, isDefault: false }];
      AsyncStorage.setItem(CUSTOM_SHIFTS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  const updateCustomShift = useCallback((code: string, shift: ShiftType) => {
    setCustomShiftsState((prev) => {
      const next = prev.map((s) => (s.code === code ? { ...shift, isDefault: false } : s));
      AsyncStorage.setItem(CUSTOM_SHIFTS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  const deleteCustomShift = useCallback((code: string) => {
    setCustomShiftsState((prev) => {
      const next = prev.filter((s) => s.code !== code);
      AsyncStorage.setItem(CUSTOM_SHIFTS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
    setShiftData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((date) => {
        if (next[date] === code) delete next[date];
      });
      persist(dataKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  return {
    shiftData,
    notesData,
    overtimeData,
    loading,
    setShift,
    clearShift,
    setShiftsBulk,
    setNote,
    clearNote,
    setOvertime,
    allShifts,
    customShifts,
    addCustomShift,
    updateCustomShift,
    deleteCustomShift,
    getShiftByCode,
    // Calendar management
    calendars,
    activeCalendar,
    activeCalendarId,
    switchCalendar,
    addCalendar,
    deleteCalendar,
    renameCalendar,
  };
}
