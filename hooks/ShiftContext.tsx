import React, { createContext, useContext, useMemo } from 'react';
import { useShiftData, ShiftData, NotesData, OvertimeData, SwapsData, SwapRequest, LeaveData, LeaveBalances, CalendarInfo } from './useShiftData';
import { LeaveType } from '../constants/leaveTypes';
import { ShiftType } from '../constants/shifts';

interface ShiftContextType {
  shiftData: ShiftData;
  notesData: NotesData;
  overtimeData: OvertimeData;
  swapsData: SwapsData;
  loading: boolean;
  writeError: boolean;
  setShift: (date: string, code: string) => void;
  clearShift: (date: string) => void;
  setShiftsBulk: (entries: Record<string, string>) => void;
  setNote: (date: string, note: string) => void;
  clearNote: (date: string) => void;
  setOvertime: (date: string, hours: number) => void;
  allShifts: ShiftType[];
  addCustomShift: (shift: ShiftType) => void;
  updateCustomShift: (code: string, shift: ShiftType) => void;
  deleteCustomShift: (code: string) => void;
  moveShift: (code: string, direction: 'up' | 'down') => void;
  getShiftByCode: (code: string) => ShiftType | undefined;
  lastUsedShift: string | null;
  leaveData: LeaveData;
  leaveBalances: LeaveBalances;
  leaveTypes: LeaveType[];
  setLeave: (date: string, leaveTypeId: string) => void;
  clearLeave: (date: string) => void;
  setLeaveBalance: (leaveTypeId: string, days: number) => void;
  offerSwap: (swap: SwapRequest) => void;
  cancelSwap: (date: string) => void;
  acceptSwap: (date: string) => void;
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
  swapsData: {},
  loading: true,
  writeError: false,
  setShift: () => {},
  clearShift: () => {},
  setShiftsBulk: () => {},
  setNote: () => {},
  clearNote: () => {},
  setOvertime: () => {},
  allShifts: [],
  addCustomShift: () => {},
  updateCustomShift: () => {},
  deleteCustomShift: () => {},
  moveShift: () => {},
  getShiftByCode: () => undefined,
  lastUsedShift: null,
  leaveData: {},
  leaveBalances: {},
  leaveTypes: [],
  setLeave: () => {},
  clearLeave: () => {},
  setLeaveBalance: () => {},
  offerSwap: () => {},
  cancelSwap: () => {},
  acceptSwap: () => {},
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
  const value = useMemo(() => data, [
    data.shiftData, data.notesData, data.overtimeData, data.swapsData,
    data.leaveData, data.leaveBalances, data.leaveTypes,
    data.allShifts, data.loading, data.writeError, data.lastUsedShift,
    data.calendars, data.activeCalendar, data.activeCalendarId,
    data.setShift, data.clearShift, data.setShiftsBulk,
    data.setNote, data.clearNote, data.setOvertime,
    data.addCustomShift, data.updateCustomShift, data.deleteCustomShift, data.moveShift,
    data.getShiftByCode, data.setLeave, data.clearLeave, data.setLeaveBalance,
    data.offerSwap, data.cancelSwap, data.acceptSwap,
    data.switchCalendar, data.addCalendar, data.deleteCalendar, data.renameCalendar,
  ]);
  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShifts() {
  return useContext(ShiftContext);
}
