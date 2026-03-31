import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftType, DEFAULT_SHIFTS } from '../constants/shifts';
import { LeaveType, DEFAULT_LEAVE_TYPES } from '../constants/leaveTypes';

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
  const customShifts = allShiftsState.filter((s) => !s.isDefault);

  const getShiftByCode = useCallback(
    (code: string): ShiftType | undefined => {
      return allShiftsState.find((s) => s.code === code);
    },
    [allShiftsState]
  );

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId) || DEFAULT_CALENDAR;

  // --- Persist helpers ---
  const persist = useCallback((key: string, data: any) => {
    AsyncStorage.setItem(key, JSON.stringify(data)).catch(console.error);
  }, []);

  const persistShifts = useCallback((shifts: ShiftType[]) => {
    AsyncStorage.setItem(ALL_SHIFTS_KEY, JSON.stringify(shifts)).catch(console.error);
  }, []);

  // --- Load everything on mount ---
  useEffect(() => {
    (async () => {
      try {
        const [rawCals, rawActive, rawAllShifts, rawCustom] = await Promise.all([
          AsyncStorage.getItem(CALENDARS_KEY),
          AsyncStorage.getItem(ACTIVE_CALENDAR_KEY),
          AsyncStorage.getItem(ALL_SHIFTS_KEY),
          AsyncStorage.getItem(CUSTOM_SHIFTS_KEY),
        ]);
        const cals: CalendarInfo[] = rawCals ? JSON.parse(rawCals) : [DEFAULT_CALENDAR];
        const active = rawActive || 'default';
        setCalendars(cals);
        setActiveCalendarId(active);

        if (rawAllShifts) {
          setAllShiftsState(JSON.parse(rawAllShifts));
        } else {
          // Migration from old format (DEFAULT_SHIFTS + custom_shifts)
          const customs: ShiftType[] = rawCustom ? JSON.parse(rawCustom) : [];
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
        if (rawShifts) setShiftData(JSON.parse(rawShifts));
        if (rawNotes) setNotesData(JSON.parse(rawNotes));
        if (rawOT) setOvertimeData(JSON.parse(rawOT));
        if (rawSwaps) setSwapsData(JSON.parse(rawSwaps));
        if (rawLeave) setLeaveData(JSON.parse(rawLeave));
        if (rawLeaveBalances) setLeaveBalancesState(JSON.parse(rawLeaveBalances));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Switch calendar ---
  const switchCalendar = useCallback(async (calId: string) => {
    setActiveCalendarId(calId);
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
      setShiftData(rawShifts ? JSON.parse(rawShifts) : {});
      setNotesData(rawNotes ? JSON.parse(rawNotes) : {});
      setOvertimeData(rawOT ? JSON.parse(rawOT) : {});
      setSwapsData(rawSwaps ? JSON.parse(rawSwaps) : {});
      setLeaveData(rawLeave ? JSON.parse(rawLeave) : {});
      setLeaveBalancesState(rawLeaveBal ? JSON.parse(rawLeaveBal) : Object.fromEntries(DEFAULT_LEAVE_TYPES.map((t) => [t.id, t.defaultDays])));
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
    AsyncStorage.removeItem(dataKey(calId)).catch(console.error);
    AsyncStorage.removeItem(notesKey(calId)).catch(console.error);
    AsyncStorage.removeItem(overtimeKey(calId)).catch(console.error);
    AsyncStorage.removeItem(swapsKey(calId)).catch(console.error);
    AsyncStorage.removeItem(leaveKey(calId)).catch(console.error);
    AsyncStorage.removeItem(leaveBalancesKey(calId)).catch(console.error);
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
    // If code changed, update all shift data references
    if (code !== shift.code) {
      setShiftData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((date) => {
          if (next[date] === code) next[date] = shift.code;
        });
        persist(dataKey(activeCalendarId), next);
        return next;
      });
    }
  }, [persistShifts, activeCalendarId, persist]);

  const deleteCustomShift = useCallback((code: string) => {
    setAllShiftsState((prev) => {
      if (prev.length <= 1) return prev; // prevent deleting last shift
      const next = prev.filter((s) => s.code !== code);
      persistShifts(next);
      return next;
    });
    // Clean up shift assignments
    setShiftData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((date) => {
        if (next[date] === code) delete next[date];
      });
      persist(dataKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist, persistShifts]);

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
      persist(leaveKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const clearLeave = useCallback((date: string) => {
    setLeaveData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(leaveKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const setLeaveBalance = useCallback((leaveTypeId: string, days: number) => {
    setLeaveBalancesState((prev) => {
      const next = { ...prev, [leaveTypeId]: days };
      persist(leaveBalancesKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  // --- Swap operations ---
  const offerSwap = useCallback((swap: SwapRequest) => {
    setSwapsData((prev) => {
      const next = { ...prev, [swap.date]: swap };
      persist(swapsKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const cancelSwap = useCallback((date: string) => {
    setSwapsData((prev) => {
      const next = { ...prev };
      delete next[date];
      persist(swapsKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  const acceptSwap = useCallback((date: string) => {
    setSwapsData((prev) => {
      if (!prev[date]) return prev;
      const next = { ...prev, [date]: { ...prev[date], status: 'accepted' as const } };
      persist(swapsKey(activeCalendarId), next);
      return next;
    });
  }, [activeCalendarId, persist]);

  return {
    shiftData,
    notesData,
    overtimeData,
    swapsData,
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
