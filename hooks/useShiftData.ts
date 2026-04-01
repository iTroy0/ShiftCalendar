import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftType, DEFAULT_SHIFTS } from '../constants/shifts';
import { LeaveType, DEFAULT_LEAVE_TYPES } from '../constants/leaveTypes';

const SCHEMA_VERSION_KEY = 'schema_version';
const CURRENT_SCHEMA = 2;
const CUSTOM_SHIFTS_KEY = 'custom_shifts';
const ALL_SHIFTS_KEY = 'all_shifts_v2';
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
function swapsKey(calId: string) {
  return `shift_swaps_${calId}`;
}
function leaveKey(calId: string) {
  return `leave_data_${calId}`;
}
function leaveBalancesKey(calId: string) {
  return `leave_balances_${calId}`;
}

export type ShiftData = Record<string, string>;
export type NotesData = Record<string, string>;
export type OvertimeData = Record<string, number>; // date -> overtime hours

export interface SwapRequest {
  date: string;
  shiftCode: string;
  wantCode: string; // desired shift code or 'any'
  note: string;
  status: 'offered' | 'accepted' | 'cancelled';
  createdAt: string;
}
export type SwapsData = Record<string, SwapRequest>; // date -> swap
export type LeaveData = Record<string, string>;    // date -> leave type id
export type LeaveBalances = Record<string, number>; // leave type id -> allocated days

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_CALENDAR: CalendarInfo = { id: 'default', name: 'My Shifts', color: '#6366F1' };

export function useShiftData() {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([DEFAULT_CALENDAR]);
  const [activeCalendarId, setActiveCalendarId] = useState('default');
  const calIdRef = useRef('default');
  const [shiftData, setShiftData] = useState<ShiftData>({});
  const [notesData, setNotesData] = useState<NotesData>({});
  const [overtimeData, setOvertimeData] = useState<OvertimeData>({});
  const [swapsData, setSwapsData] = useState<SwapsData>({});
  const [leaveData, setLeaveData] = useState<LeaveData>({});
  const [leaveBalances, setLeaveBalancesState] = useState<LeaveBalances>(() =>
    Object.fromEntries(DEFAULT_LEAVE_TYPES.map((t) => [t.id, t.defaultDays]))
  );
  const leaveTypes: LeaveType[] = DEFAULT_LEAVE_TYPES;
  const [allShiftsState, setAllShiftsState] = useState<ShiftType[]>([...DEFAULT_SHIFTS]);
  const [loading, setLoading] = useState(true);
  const [lastUsedShift, setLastUsedShift] = useState<string | null>(null);

  const allShifts = allShiftsState;

  const shiftMap = useMemo(
    () => new Map(allShiftsState.map((s) => [s.code, s])),
    [allShiftsState]
  );

  const getShiftByCode = useCallback(
    (code: string): ShiftType | undefined => shiftMap.get(code),
    [shiftMap]
  );

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId) || DEFAULT_CALENDAR;

  const switchGen = useRef(0);

  // --- Safe parse helper ---
  function safeParse<T>(json: string | null, fallback: T): T {
    if (!json) return fallback;
    try { return JSON.parse(json) as T; } catch { return fallback; }
  }

  // --- Persist helpers ---
  const [writeError, setWriteError] = useState(false);

  const persist = useCallback((key: string, data: any) => {
    AsyncStorage.setItem(key, JSON.stringify(data)).catch((e) => {
      console.error('Storage write failed:', key, e);
      setWriteError(true);
    });
  }, []);

  const persistShifts = useCallback((shifts: ShiftType[]) => {
    AsyncStorage.setItem(ALL_SHIFTS_KEY, JSON.stringify(shifts)).catch(console.error);
  }, []);

  // --- Schema migrations ---
  async function runMigrations() {
    const rawVersion = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
    const version = rawVersion ? parseInt(rawVersion, 10) : 0;
    if (version < 1) {
      // v0→v1: migrate custom_shifts to all_shifts_v2 (handled in load path below)
    }
    // Future migrations go here: if (version < 3) { ... }
    if (version < CURRENT_SCHEMA) {
      await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA));
    }
  }

  // --- Load everything on mount ---
  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        const [rawCals, rawActive, rawAllShifts, rawCustom] = await Promise.all([
          AsyncStorage.getItem(CALENDARS_KEY),
          AsyncStorage.getItem(ACTIVE_CALENDAR_KEY),
          AsyncStorage.getItem(ALL_SHIFTS_KEY),
          AsyncStorage.getItem(CUSTOM_SHIFTS_KEY),
        ]);
        const cals = safeParse<CalendarInfo[]>(rawCals, [DEFAULT_CALENDAR]);
        const active = rawActive || 'default';
        setCalendars(cals);
        setActiveCalendarId(active);
        calIdRef.current = active;

        if (rawAllShifts) {
          setAllShiftsState(safeParse<ShiftType[]>(rawAllShifts, [...DEFAULT_SHIFTS]));
        } else {
          const customs = safeParse<ShiftType[]>(rawCustom, []);
          const merged = [...DEFAULT_SHIFTS, ...customs];
          setAllShiftsState(merged);
          await AsyncStorage.setItem(ALL_SHIFTS_KEY, JSON.stringify(merged));
        }

        // Load data for active calendar
        const [rawShifts, rawNotes, rawOT, rawSwaps, rawLeave, rawLeaveBalances] = await Promise.all([
          AsyncStorage.getItem(dataKey(active)),
          AsyncStorage.getItem(notesKey(active)),
          AsyncStorage.getItem(overtimeKey(active)),
          AsyncStorage.getItem(swapsKey(active)),
          AsyncStorage.getItem(leaveKey(active)),
          AsyncStorage.getItem(leaveBalancesKey(active)),
        ]);
        setShiftData(safeParse<ShiftData>(rawShifts, {}));
        setNotesData(safeParse<NotesData>(rawNotes, {}));
        setOvertimeData(safeParse<OvertimeData>(rawOT, {}));
        setSwapsData(safeParse<SwapsData>(rawSwaps, {}));
        setLeaveData(safeParse<LeaveData>(rawLeave, {}));
        setLeaveBalancesState(safeParse<LeaveBalances>(rawLeaveBalances, Object.fromEntries(DEFAULT_LEAVE_TYPES.map((t) => [t.id, t.defaultDays]))));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Switch calendar ---
  const switchCalendar = useCallback(async (calId: string) => {
    const gen = ++switchGen.current;
    setActiveCalendarId(calId);
    calIdRef.current = calId;
    AsyncStorage.setItem(ACTIVE_CALENDAR_KEY, calId).catch(console.error);
    try {
      const [rawShifts, rawNotes, rawOT, rawSwaps, rawLeave, rawLeaveBal] = await Promise.all([
        AsyncStorage.getItem(dataKey(calId)),
        AsyncStorage.getItem(notesKey(calId)),
        AsyncStorage.getItem(overtimeKey(calId)),
        AsyncStorage.getItem(swapsKey(calId)),
        AsyncStorage.getItem(leaveKey(calId)),
        AsyncStorage.getItem(leaveBalancesKey(calId)),
      ]);
      // Discard stale results if another switch happened during the await
      if (switchGen.current !== gen) return;
      setShiftData(safeParse<ShiftData>(rawShifts, {}));
      setNotesData(safeParse<NotesData>(rawNotes, {}));
      setOvertimeData(safeParse<OvertimeData>(rawOT, {}));
      setSwapsData(safeParse<SwapsData>(rawSwaps, {}));
      setLeaveData(safeParse<LeaveData>(rawLeave, {}));
      setLeaveBalancesState(safeParse<LeaveBalances>(rawLeaveBal, Object.fromEntries(DEFAULT_LEAVE_TYPES.map((t) => [t.id, t.defaultDays]))));
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
    if (calId === 'default') return;
    setCalendars((prev) => {
      const next = prev.filter((c) => c.id !== calId);
      AsyncStorage.setItem(CALENDARS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
    AsyncStorage.multiRemove([
      dataKey(calId), notesKey(calId), overtimeKey(calId),
      swapsKey(calId), leaveKey(calId), leaveBalancesKey(calId),
    ]).catch(console.error);
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
  const setShift = useCallback((date: string, code: string) => {
    setLastUsedShift(code);
    setShiftData((prev) => {
      const next = { ...prev, [date]: code };
      persist(dataKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const clearShift = useCallback((date: string) => {
    setShiftData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(dataKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const setShiftsBulk = useCallback((entries: Record<string, string>) => {
    setShiftData((prev) => {
      const next = { ...prev, ...entries };
      persist(dataKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  // --- Note operations ---
  const setNote = useCallback((date: string, note: string) => {
    setNotesData((prev) => {
      const next = { ...prev };
      if (note.trim()) {
        next[date] = note.trim();
      } else {
        delete next[date];
      }
      persist(notesKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const clearNote = useCallback((date: string) => {
    setNotesData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(notesKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  // --- Overtime operations ---
  const setOvertime = useCallback((date: string, hours: number) => {
    setOvertimeData((prev) => {
      const next = { ...prev };
      if (hours > 0) {
        next[date] = hours;
      } else {
        delete next[date];
      }
      persist(overtimeKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  // --- Shift type operations (unified list) ---
  const addCustomShift = useCallback((shift: ShiftType) => {
    setAllShiftsState((prev) => {
      const next = [...prev, shift];
      persistShifts(next);
      return next;
    });
  }, [persistShifts]);

  const updateCustomShift = useCallback((code: string, shift: ShiftType) => {
    setAllShiftsState((prev) => {
      const next = prev.map((s) => (s.code === code ? { ...shift } : s));
      persistShifts(next);
      return next;
    });
    // If code changed, update shift data references across ALL calendars
    if (code !== shift.code) {
      // Update active calendar in memory
      setShiftData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((date) => {
          if (next[date] === code) next[date] = shift.code;
        });
        persist(dataKey(calIdRef.current), next);
        return next;
      });
      // Update other calendars in storage
      calendars.forEach(async (cal) => {
        if (cal.id === calIdRef.current) return;
        try {
          const raw = await AsyncStorage.getItem(dataKey(cal.id));
          if (!raw) return;
          const data = JSON.parse(raw);
          let changed = false;
          Object.keys(data).forEach((date) => {
            if (data[date] === code) { data[date] = shift.code; changed = true; }
          });
          if (changed) await AsyncStorage.setItem(dataKey(cal.id), JSON.stringify(data));
        } catch (e) { console.error('Failed to update calendar', cal.id, e); }
      });
    }
  }, [persistShifts, persist, calendars]);

  const deleteCustomShift = useCallback((code: string) => {
    let didDelete = false;
    setAllShiftsState((prev) => {
      if (prev.length <= 1) return prev; // prevent deleting last shift
      didDelete = true;
      const next = prev.filter((s) => s.code !== code);
      persistShifts(next);
      return next;
    });
    if (!didDelete) return;
    // Clean up shift assignments only if deletion actually happened
    setShiftData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((date) => {
        if (next[date] === code) delete next[date];
      });
      persist(dataKey(calIdRef.current), next);
      return next;
    });
  }, [persist, persistShifts]);

  const moveShift = useCallback((code: string, direction: 'up' | 'down') => {
    setAllShiftsState((prev) => {
      const idx = prev.findIndex((s) => s.code === code);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      persistShifts(next);
      return next;
    });
  }, [persistShifts]);

  // --- Leave operations ---
  const setLeave = useCallback((date: string, leaveTypeId: string) => {
    setLeaveData((prev) => {
      const next = { ...prev, [date]: leaveTypeId };
      persist(leaveKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const clearLeave = useCallback((date: string) => {
    setLeaveData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(leaveKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const setLeaveBalance = useCallback((leaveTypeId: string, days: number) => {
    setLeaveBalancesState((prev) => {
      const next = { ...prev, [leaveTypeId]: days };
      persist(leaveBalancesKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  // --- Swap operations ---
  const offerSwap = useCallback((swap: SwapRequest) => {
    setSwapsData((prev) => {
      const next = { ...prev, [swap.date]: swap };
      persist(swapsKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const cancelSwap = useCallback((date: string) => {
    setSwapsData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(swapsKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  const acceptSwap = useCallback((date: string) => {
    setSwapsData((prev) => {
      if (!prev[date]) return prev;
      const next = { ...prev, [date]: { ...prev[date], status: 'accepted' as const } };
      persist(swapsKey(calIdRef.current), next);
      return next;
    });
  }, [persist]);

  return {
    shiftData,
    notesData,
    overtimeData,
    swapsData,
    loading,
    writeError,
    setShift,
    clearShift,
    setShiftsBulk,
    setNote,
    clearNote,
    setOvertime,
    allShifts,
    addCustomShift,
    updateCustomShift,
    deleteCustomShift,
    moveShift,
    getShiftByCode,
    lastUsedShift,
    leaveData,
    leaveBalances,
    leaveTypes,
    setLeave,
    clearLeave,
    setLeaveBalance,
    offerSwap,
    cancelSwap,
    acceptSwap,
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
