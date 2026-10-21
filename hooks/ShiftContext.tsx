import React, { createContext, useContext, useMemo } from 'react';
import { useShiftData, ShiftDataApi } from './useShiftData';

const ShiftContext = createContext<ShiftDataApi | null>(null);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const data = useShiftData();
  // The hook returns the same set of keys every render, so its values form a stable dependency list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => data, Object.values(data));
  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
}

export function useShifts(): ShiftDataApi {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error('useShifts must be used inside ShiftProvider');
  return ctx;
}
