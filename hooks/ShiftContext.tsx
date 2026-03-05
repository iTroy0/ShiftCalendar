import React, { createContext, useContext } from 'react';
import { useShiftData, ShiftData, NotesData, OvertimeData, CalendarInfo } from './useShiftData';
import { ShiftType } from '../constants/shifts';

interface ShiftContextType {
  shiftData: ShiftData;
  notesData: NotesData;
  overtimeData: OvertimeData;
  loading: boolean;
  setShift: (date: string, code: string) => void;
  clearShift: (date: string) => void;
  setShiftsBulk: (entries: Record<string, string>) => void;
  setNote: (date: string, note: string) => void;
  clearNote: (date: string) => void;
  setOvertime: (date: string, hours: number) => void;
  allShifts: ShiftType[];
  customShifts: ShiftType[];
  addCustomShift: (shift: ShiftType) => void;
  updateCustomShift: (code: string, shift: ShiftType) => void;
  deleteCustomShift: (code: string) => void;
  getShiftByCode: (code: string) => ShiftType | undefined;
  calendars: CalendarInfo[];
  activeCalendar: CalendarInfo;
  activeCalendarId: string;
  switchCalendar: (calId: string) => void;
  addCalendar: (cal: CalendarInfo) => void;
  deleteCalendar: (calId: string) => void;
  renameCalendar: (calId: string, name: string, color: string) => void;
}

const ShiftContext = createContext<ShiftContextType>({
  shiftData: {},
  notesData: {},
  overtimeData: {},
  loading: true,
  setShift: () => {},
  clearShift: () => {},
  setShiftsBulk: () => {},
  setNote: () => {},
  clearNote: () => {},
  setOvertime: () => {},
  allShifts: [],
  customShifts: [],
  addCustomShift: () => {},
  updateCustomShift: () => {},
  deleteCustomShift: () => {},
  getShiftByCode: () => undefined,
  calendars: [],
  activeCalendar: { id: 'default', name: 'My Shifts', color: '#6366F1' },
  activeCalendarId: 'default',
  switchCalendar: () => {},
  addCalendar: () => {},
  deleteCalendar: () => {},
  renameCalendar: () => {},
});

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const data = useShiftData();
  return <ShiftContext.Provider value={data}>{children}</ShiftContext.Provider>;
}

export function useShifts() {
  return useContext(ShiftContext);
}
