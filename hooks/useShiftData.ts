import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShiftType, DEFAULT_SHIFTS } from '../constants/shifts';
import { LeaveType, DEFAULT_LEAVE_TYPES, defaultLeaveBalances } from '../constants/leaveTypes';
import { CURRENT_SCHEMA, SCHEMA_VERSION_KEY, runMigrations } from '../utils/migrations';

const CUSTOM_SHIFTS_KEY = 'custom_shifts';
const ALL_SHIFTS_KEY = 'all_shifts_v2';
const CALENDARS_KEY = 'calendars_list';
const ACTIVE_CALENDAR_KEY = 'active_calendar';
const LAST_USED_SHIFT_KEY = 'last_used_shift';

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

export interface CalendarData {
  shifts: ShiftData;
  notes: NotesData;
  overtime: OvertimeData;
  swaps: SwapsData;
  leave: LeaveData;
  leaveBalances: LeaveBalances;
}

type Field = keyof CalendarData;

const FIELDS: Field[] = ['shifts', 'notes', 'overtime', 'swaps', 'leave', 'leaveBalances'];

/** Storage keys are unchanged from earlier versions so existing data and backups keep working. */
const STORAGE_KEY: Record<Field, (calId: string) => string> = {
  shifts: (id) => `shift_data_${id}`,
  notes: (id) => `shift_notes_${id}`,
  overtime: (id) => `shift_overtime_${id}`,
  swaps: (id) => `shift_swaps_${id}`,
  leave: (id) => `leave_data_${id}`,
  leaveBalances: (id) => `leave_balances_${id}`,
};

/** A day's shift/leave assignment, used to undo bulk edits exactly. */
export interface DayAssignment {
  shift?: string;
  leave?: string;
}
export type AssignmentSnapshot = Record<string, DayAssignment>;

export interface ImportPayload {
  shifts?: Record<string, string>;
  notes?: Record<string, string>;
  overtime?: Record<string, number>;
  leave?: Record<string, string>;
}

export const DEFAULT_CALENDAR: CalendarInfo = { id: 'default', name: 'My Shifts', color: '#6366F1' };

export function emptyCalendarData(): CalendarData {
  return { shifts: {}, notes: {}, overtime: {}, swaps: {}, leave: {}, leaveBalances: defaultLeaveBalances() };
}

function safeParse(json: string | null): unknown {
  if (!json) return undefined;
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function asRecord<T>(value: unknown, isValid: (v: unknown) => boolean): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isValid(v)) out[k] = v as T;
  }
  return out;
}

const isString = (v: unknown) => typeof v === 'string';
const isPositiveNumber = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isNonNegativeNumber = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isSwap = (v: unknown) => !!v && typeof v === 'object' && typeof (v as SwapRequest).shiftCode === 'string';

function parseCalendars(raw: string | null): CalendarInfo[] {
  const parsed = safeParse(raw);
  const list = Array.isArray(parsed)
    ? parsed.filter(
        (c): c is CalendarInfo =>
          !!c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.color === 'string'
      )
    : [];
  if (!list.some((c) => c.id === DEFAULT_CALENDAR.id)) list.unshift(DEFAULT_CALENDAR);
  return list;
}

function parseShiftTypes(raw: string | null): ShiftType[] | null {
  const parsed = safeParse(raw);
  if (!Array.isArray(parsed)) return null;
  const seen = new Set<string>();
  const list = parsed
    .filter((s): s is ShiftType => !!s && typeof s.code === 'string' && s.code.length > 0 && typeof s.label === 'string')
    .filter((s) => (seen.has(s.code) ? false : (seen.add(s.code), true)))
    .map((s) => ({
      code: s.code,
      label: s.label,
      color: typeof s.color === 'string' ? s.color : '#6B7280',
      startTime: typeof s.startTime === 'string' ? s.startTime : '',
      endTime: typeof s.endTime === 'string' ? s.endTime : '',
      icon: typeof s.icon === 'string' ? s.icon : 'briefcase',
      isDefault: !!s.isDefault,
    }));
  return list.length > 0 ? list : null;
}

function parseCalendarData(get: (key: string) => string | null, calId: string): CalendarData {
  const balances = asRecord<number>(safeParse(get(STORAGE_KEY.leaveBalances(calId))), isNonNegativeNumber);
  return {
    shifts: asRecord<string>(safeParse(get(STORAGE_KEY.shifts(calId))), isString),
    notes: asRecord<string>(safeParse(get(STORAGE_KEY.notes(calId))), isString),
    overtime: asRecord<number>(safeParse(get(STORAGE_KEY.overtime(calId))), isPositiveNumber),
    swaps: asRecord<SwapRequest>(safeParse(get(STORAGE_KEY.swaps(calId))), isSwap),
    leave: asRecord<string>(safeParse(get(STORAGE_KEY.leave(calId))), isString),
    leaveBalances: { ...defaultLeaveBalances(), ...balances },
  };
}

interface LoadedState {
  calendars: CalendarInfo[];
  activeId: string;
  allShifts: ShiftType[];
  store: Record<string, CalendarData>;
  lastUsedShift: string | null;
}

async function loadFromStorage(): Promise<LoadedState> {
  await runMigrations();

  const head = await AsyncStorage.multiGet([
    CALENDARS_KEY, ACTIVE_CALENDAR_KEY, ALL_SHIFTS_KEY, CUSTOM_SHIFTS_KEY, LAST_USED_SHIFT_KEY,
  ]);
  const headMap = new Map(head);
  const calendars = parseCalendars(headMap.get(CALENDARS_KEY) ?? null);
  const rawActive = headMap.get(ACTIVE_CALENDAR_KEY);
  const activeId = rawActive && calendars.some((c) => c.id === rawActive) ? rawActive : DEFAULT_CALENDAR.id;

  // v0 → v1: older versions kept custom shifts separately from the defaults.
  let allShifts = parseShiftTypes(headMap.get(ALL_SHIFTS_KEY) ?? null);
  if (!allShifts) {
    const customs = parseShiftTypes(headMap.get(CUSTOM_SHIFTS_KEY) ?? null) ?? [];
    allShifts = [...DEFAULT_SHIFTS, ...customs.filter((c) => !DEFAULT_SHIFTS.some((d) => d.code === c.code))];
    await AsyncStorage.setItem(ALL_SHIFTS_KEY, JSON.stringify(allShifts));
  }

  const keys = calendars.flatMap((c) => FIELDS.map((f) => STORAGE_KEY[f](c.id)));
  const pairs = await AsyncStorage.multiGet(keys);
  const dataMap = new Map(pairs);
  const get = (key: string) => dataMap.get(key) ?? null;
  const store: Record<string, CalendarData> = {};
  for (const cal of calendars) store[cal.id] = parseCalendarData(get, cal.id);

  const lastUsed = headMap.get(LAST_USED_SHIFT_KEY) ?? null;
  return {
    calendars,
    activeId,
    allShifts,
    store,
    lastUsedShift: lastUsed && allShifts.some((s) => s.code === lastUsed) ? lastUsed : null,
  };
}

function initialStore(): Record<string, CalendarData> {
  return { [DEFAULT_CALENDAR.id]: emptyCalendarData() };
}

const EMPTY_DATA: CalendarData = emptyCalendarData();

export function useShiftData() {
  const [calendars, setCalendarsState] = useState<CalendarInfo[]>([DEFAULT_CALENDAR]);
  const [activeCalendarId, setActiveCalendarIdState] = useState(DEFAULT_CALENDAR.id);
  const [store, setStoreState] = useState<Record<string, CalendarData>>(initialStore);
  const [allShifts, setAllShiftsState] = useState<ShiftType[]>(DEFAULT_SHIFTS);
  const [lastUsedShift, setLastUsedShiftState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [writeError, setWriteError] = useState(false);

  // Refs mirror the latest state so consecutive mutations compose without stale closures.
  const calendarsRef = useRef(calendars);
  const activeIdRef = useRef(activeCalendarId);
  const storeRef = useRef(store);
  const allShiftsRef = useRef(allShifts);
  const lastUsedRef = useRef(lastUsedShift);
  const writeAlertShown = useRef(false);

  const leaveTypes: LeaveType[] = DEFAULT_LEAVE_TYPES;

  const handleWriteError = useCallback((e: unknown) => {
    console.error('Storage write failed', e);
    setWriteError(true);
    if (!writeAlertShown.current) {
      writeAlertShown.current = true;
      Alert.alert('Could not save', 'Your latest change could not be saved. Your device storage may be full.');
    }
  }, []);

  const write = useCallback(
    (pairs: [string, string][]) => {
      if (pairs.length === 0) return;
      AsyncStorage.multiSet(pairs).catch(handleWriteError);
    },
    [handleWriteError]
  );

  const setStore = useCallback((next: Record<string, CalendarData>) => {
    storeRef.current = next;
    setStoreState(next);
  }, []);

  const setCalendars = useCallback(
    (next: CalendarInfo[]) => {
      calendarsRef.current = next;
      setCalendarsState(next);
      write([[CALENDARS_KEY, JSON.stringify(next)]]);
    },
    [write]
  );

  const setAllShifts = useCallback(
    (next: ShiftType[]) => {
      allShiftsRef.current = next;
      setAllShiftsState(next);
      write([[ALL_SHIFTS_KEY, JSON.stringify(next)]]);
    },
    [write]
  );

  const setLastUsed = useCallback(
    (code: string | null) => {
      if (lastUsedRef.current === code) return;
      lastUsedRef.current = code;
      setLastUsedShiftState(code);
      if (code) write([[LAST_USED_SHIFT_KEY, code]]);
      else AsyncStorage.removeItem(LAST_USED_SHIFT_KEY).catch(handleWriteError);
    },
    [write, handleWriteError]
  );

  /** Applies field changes to several calendars at once and persists only what changed. */
  const commitMany = useCallback(
    (changes: Record<string, Partial<CalendarData>>) => {
      const next = { ...storeRef.current };
      const pairs: [string, string][] = [];
      for (const [calId, patch] of Object.entries(changes)) {
        const merged = { ...(next[calId] ?? emptyCalendarData()), ...patch };
        next[calId] = merged;
        for (const field of Object.keys(patch) as Field[]) {
          pairs.push([STORAGE_KEY[field](calId), JSON.stringify(merged[field])]);
        }
      }
      setStore(next);
      write(pairs);
    },
    [setStore, write]
  );

  const commit = useCallback(
    (patch: Partial<CalendarData>, calId: string = activeIdRef.current) => commitMany({ [calId]: patch }),
    [commitMany]
  );

  const current = useCallback(
    (calId: string = activeIdRef.current) => storeRef.current[calId] ?? emptyCalendarData(),
    []
  );

  const applyLoaded = useCallback((loaded: LoadedState) => {
    calendarsRef.current = loaded.calendars;
    activeIdRef.current = loaded.activeId;
    storeRef.current = loaded.store;
    allShiftsRef.current = loaded.allShifts;
    lastUsedRef.current = loaded.lastUsedShift;
    setCalendarsState(loaded.calendars);
    setActiveCalendarIdState(loaded.activeId);
    setStoreState(loaded.store);
    setAllShiftsState(loaded.allShifts);
    setLastUsedShiftState(loaded.lastUsedShift);
  }, []);

  const reload = useCallback(async () => {
    try {
      applyLoaded(await loadFromStorage());
    } catch (e) {
      console.error('Failed to load data', e);
    }
  }, [applyLoaded]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  /** Wipes every stored key and returns the app to a fresh state, without needing a restart. */
  const resetAllData = useCallback(async () => {
    await AsyncStorage.clear();
    applyLoaded({
      calendars: [DEFAULT_CALENDAR],
      activeId: DEFAULT_CALENDAR.id,
      allShifts: DEFAULT_SHIFTS,
      store: initialStore(),
      lastUsedShift: null,
    });
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA));
  }, [applyLoaded]);

  // --- Lookups ---
  const shiftMap = useMemo(() => new Map(allShifts.map((s) => [s.code, s])), [allShifts]);
  const getShiftByCode = useCallback((code: string): ShiftType | undefined => shiftMap.get(code), [shiftMap]);
  const leaveTypeMap = useMemo(() => new Map(leaveTypes.map((t) => [t.id, t])), [leaveTypes]);
  const getLeaveType = useCallback((id: string) => leaveTypeMap.get(id), [leaveTypeMap]);

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId) ?? DEFAULT_CALENDAR;
  const activeData = store[activeCalendarId] ?? EMPTY_DATA;

  const getCalendarData = useCallback((calId: string) => storeRef.current[calId], []);

  // --- Calendars ---
  const switchCalendar = useCallback((calId: string) => {
    if (!calendarsRef.current.some((c) => c.id === calId) || activeIdRef.current === calId) return;
    activeIdRef.current = calId;
    setActiveCalendarIdState(calId);
    AsyncStorage.setItem(ACTIVE_CALENDAR_KEY, calId).catch(console.error);
  }, []);

  const addCalendar = useCallback(
    (cal: CalendarInfo) => {
      if (calendarsRef.current.some((c) => c.id === cal.id)) return;
      setStore({ ...storeRef.current, [cal.id]: emptyCalendarData() });
      setCalendars([...calendarsRef.current, cal]);
    },
    [setCalendars, setStore]
  );

  const deleteCalendar = useCallback(
    (calId: string) => {
      if (calId === DEFAULT_CALENDAR.id) return;
      setCalendars(calendarsRef.current.filter((c) => c.id !== calId));
      const { [calId]: _removed, ...rest } = storeRef.current;
      setStore(rest);
      AsyncStorage.multiRemove(FIELDS.map((f) => STORAGE_KEY[f](calId))).catch(console.error);
      if (activeIdRef.current === calId) {
        activeIdRef.current = DEFAULT_CALENDAR.id;
        setActiveCalendarIdState(DEFAULT_CALENDAR.id);
        AsyncStorage.setItem(ACTIVE_CALENDAR_KEY, DEFAULT_CALENDAR.id).catch(console.error);
      }
    },
    [setCalendars, setStore]
  );

  const renameCalendar = useCallback(
    (calId: string, name: string, color: string) => {
      setCalendars(calendarsRef.current.map((c) => (c.id === calId ? { ...c, name, color } : c)));
    },
    [setCalendars]
  );

  // --- Day assignments (a day holds either a shift or a leave, never both) ---
  const snapshotAssignments = useCallback(
    (dates: string[]): AssignmentSnapshot => {
      const data = current();
      const snap: AssignmentSnapshot = {};
      for (const d of dates) snap[d] = { shift: data.shifts[d], leave: data.leave[d] };
      return snap;
    },
    [current]
  );

  const setShift = useCallback(
    (date: string, code: string) => {
      const data = current();
      const patch: Partial<CalendarData> = { shifts: { ...data.shifts, [date]: code } };
      if (data.leave[date]) {
        const leave = { ...data.leave };
        delete leave[date];
        patch.leave = leave;
      }
      commit(patch);
      setLastUsed(code);
    },
    [commit, current, setLastUsed]
  );

  const clearShift = useCallback(
    (date: string) => {
      const data = current();
      if (!(date in data.shifts)) return;
      const shifts = { ...data.shifts };
      delete shifts[date];
      commit({ shifts });
    },
    [commit, current]
  );

  const setLeave = useCallback(
    (date: string, leaveTypeId: string) => {
      const data = current();
      const patch: Partial<CalendarData> = { leave: { ...data.leave, [date]: leaveTypeId } };
      if (data.shifts[date]) {
        const shifts = { ...data.shifts };
        delete shifts[date];
        patch.shifts = shifts;
      }
      commit(patch);
    },
    [commit, current]
  );

  const clearLeave = useCallback(
    (date: string) => {
      const data = current();
      if (!(date in data.leave)) return;
      const leave = { ...data.leave };
      delete leave[date];
      commit({ leave });
    },
    [commit, current]
  );

  /** Removes the shift and leave of a day; returns what was there for undo. */
  const clearDay = useCallback(
    (date: string): AssignmentSnapshot => {
      const snap = snapshotAssignments([date]);
      const data = current();
      const shifts = { ...data.shifts };
      const leave = { ...data.leave };
      delete shifts[date];
      delete leave[date];
      commit({ shifts, leave });
      return snap;
    },
    [commit, current, snapshotAssignments]
  );

  /**
   * Sets many days at once (`null` clears the shift). Any leave on those days is removed.
   * Returns the previous assignments so the change can be undone with `restoreAssignments`.
   */
  const applyShiftEntries = useCallback(
    (entries: Record<string, string | null>): AssignmentSnapshot => {
      const dates = Object.keys(entries);
      const snap = snapshotAssignments(dates);
      const data = current();
      const shifts = { ...data.shifts };
      const leave = { ...data.leave };
      let leaveChanged = false;
      for (const date of dates) {
        const code = entries[date];
        if (code) {
          shifts[date] = code;
          if (leave[date]) {
            delete leave[date];
            leaveChanged = true;
          }
        } else {
          delete shifts[date];
        }
      }
      commit(leaveChanged ? { shifts, leave } : { shifts });
      return snap;
    },
    [commit, current, snapshotAssignments]
  );

  const restoreAssignments = useCallback(
    (snapshot: AssignmentSnapshot) => {
      const data = current();
      const shifts = { ...data.shifts };
      const leave = { ...data.leave };
      for (const [date, a] of Object.entries(snapshot)) {
        if (a.shift) shifts[date] = a.shift;
        else delete shifts[date];
        if (a.leave) leave[date] = a.leave;
        else delete leave[date];
      }
      commit({ shifts, leave });
    },
    [commit, current]
  );

  // --- Notes & overtime ---
  const setNote = useCallback(
    (date: string, note: string) => {
      const data = current();
      const trimmed = note.trim();
      if ((data.notes[date] ?? '') === trimmed) return;
      const notes = { ...data.notes };
      if (trimmed) notes[date] = trimmed;
      else delete notes[date];
      commit({ notes });
    },
    [commit, current]
  );

  const clearNote = useCallback((date: string) => setNote(date, ''), [setNote]);

  const setOvertime = useCallback(
    (date: string, hours: number) => {
      const data = current();
      const value = Number.isFinite(hours) && hours > 0 ? Math.round(hours * 100) / 100 : 0;
      if ((data.overtime[date] ?? 0) === value) return;
      const overtime = { ...data.overtime };
      if (value > 0) overtime[date] = value;
      else delete overtime[date];
      commit({ overtime });
    },
    [commit, current]
  );

  /** Merges imported days into the active calendar in a single write. */
  const importDays = useCallback(
    (payload: ImportPayload) => {
      const data = current();
      const shifts = { ...data.shifts };
      const notes = { ...data.notes };
      const overtime = { ...data.overtime };
      const leave = { ...data.leave };
      for (const [date, code] of Object.entries(payload.shifts ?? {})) {
        shifts[date] = code;
        delete leave[date];
      }
      for (const [date, id] of Object.entries(payload.leave ?? {})) {
        leave[date] = id;
        delete shifts[date];
      }
      for (const [date, note] of Object.entries(payload.notes ?? {})) {
        if (note.trim()) notes[date] = note.trim();
      }
      for (const [date, hours] of Object.entries(payload.overtime ?? {})) {
        if (hours > 0) overtime[date] = hours;
      }
      commit({ shifts, notes, overtime, leave });
    },
    [commit, current]
  );

  // --- Leave balances ---
  const setLeaveBalance = useCallback(
    (leaveTypeId: string, days: number) => {
      const data = current();
      const value = Math.max(0, Math.round(days));
      if (data.leaveBalances[leaveTypeId] === value) return;
      commit({ leaveBalances: { ...data.leaveBalances, [leaveTypeId]: value } });
    },
    [commit, current]
  );

  // --- Swaps ---
  const offerSwap = useCallback(
    (swap: SwapRequest) => {
      commit({ swaps: { ...current().swaps, [swap.date]: swap } });
    },
    [commit, current]
  );

  const cancelSwap = useCallback(
    (date: string) => {
      const swaps = { ...current().swaps };
      if (!swaps[date]) return;
      delete swaps[date];
      commit({ swaps });
    },
    [commit, current]
  );

  const acceptSwap = useCallback(
    (date: string) => {
      const swaps = current().swaps;
      if (!swaps[date]) return;
      commit({ swaps: { ...swaps, [date]: { ...swaps[date], status: 'accepted' } } });
    },
    [commit, current]
  );

  // --- Shift types ---
  const addCustomShift = useCallback(
    (shift: ShiftType) => {
      if (allShiftsRef.current.some((s) => s.code === shift.code)) return;
      setAllShifts([...allShiftsRef.current, shift]);
    },
    [setAllShifts]
  );

  const updateCustomShift = useCallback(
    (code: string, shift: ShiftType) => {
      setAllShifts(allShiftsRef.current.map((s) => (s.code === code ? { ...shift } : s)));
      if (code === shift.code) return;
      // The code changed: re-point assignments and swaps in every calendar.
      const changes: Record<string, Partial<CalendarData>> = {};
      for (const [calId, data] of Object.entries(storeRef.current)) {
        let shiftsChanged = false;
        const shifts = { ...data.shifts };
        for (const date of Object.keys(shifts)) {
          if (shifts[date] === code) {
            shifts[date] = shift.code;
            shiftsChanged = true;
          }
        }
        let swapsChanged = false;
        const swaps = { ...data.swaps };
        for (const date of Object.keys(swaps)) {
          const s = swaps[date];
          if (s.shiftCode === code || s.wantCode === code) {
            swaps[date] = {
              ...s,
              shiftCode: s.shiftCode === code ? shift.code : s.shiftCode,
              wantCode: s.wantCode === code ? shift.code : s.wantCode,
            };
            swapsChanged = true;
          }
        }
        if (shiftsChanged || swapsChanged) {
          changes[calId] = {
            ...(shiftsChanged ? { shifts } : {}),
            ...(swapsChanged ? { swaps } : {}),
          };
        }
      }
      commitMany(changes);
      if (lastUsedRef.current === code) setLastUsed(shift.code);
    },
    [commitMany, setAllShifts, setLastUsed]
  );

  /** Deletes a shift type and its assignments in every calendar. Returns false if it was the last one. */
  const deleteCustomShift = useCallback(
    (code: string): boolean => {
      const list = allShiftsRef.current;
      if (list.length <= 1 || !list.some((s) => s.code === code)) return false;
      setAllShifts(list.filter((s) => s.code !== code));
      const changes: Record<string, Partial<CalendarData>> = {};
      for (const [calId, data] of Object.entries(storeRef.current)) {
        const shifts = { ...data.shifts };
        const swaps = { ...data.swaps };
        let changed = false;
        for (const date of Object.keys(shifts)) {
          if (shifts[date] === code) {
            delete shifts[date];
            changed = true;
          }
        }
        for (const date of Object.keys(swaps)) {
          if (swaps[date].shiftCode === code) {
            delete swaps[date];
            changed = true;
          } else if (swaps[date].wantCode === code) {
            swaps[date] = { ...swaps[date], wantCode: 'any' };
            changed = true;
          }
        }
        if (changed) changes[calId] = { shifts, swaps };
      }
      commitMany(changes);
      if (lastUsedRef.current === code) setLastUsed(null);
      return true;
    },
    [commitMany, setAllShifts, setLastUsed]
  );

  const moveShift = useCallback(
    (code: string, direction: 'up' | 'down') => {
      const list = allShiftsRef.current;
      const idx = list.findIndex((s) => s.code === code);
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= list.length) return;
      const next = [...list];
      [next[idx], next[target]] = [next[target], next[idx]];
      setAllShifts(next);
    },
    [setAllShifts]
  );

  return {
    loading,
    writeError,
    reload,
    resetAllData,
    // Active calendar data
    shiftData: activeData.shifts,
    notesData: activeData.notes,
    overtimeData: activeData.overtime,
    swapsData: activeData.swaps,
    leaveData: activeData.leave,
    leaveBalances: activeData.leaveBalances,
    getCalendarData,
    // Day operations
    setShift,
    clearShift,
    setLeave,
    clearLeave,
    clearDay,
    applyShiftEntries,
    restoreAssignments,
    snapshotAssignments,
    setNote,
    clearNote,
    setOvertime,
    importDays,
    setLeaveBalance,
    offerSwap,
    cancelSwap,
    acceptSwap,
    // Shift types
    allShifts,
    getShiftByCode,
    addCustomShift,
    updateCustomShift,
    deleteCustomShift,
    moveShift,
    lastUsedShift,
    // Leave types
    leaveTypes,
    getLeaveType,
    // Calendars
    calendars,
    activeCalendar,
    activeCalendarId: activeCalendar.id,
    switchCalendar,
    addCalendar,
    deleteCalendar,
    renameCalendar,
  };
}

export type ShiftDataApi = ReturnType<typeof useShiftData>;
