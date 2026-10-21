import React, { createContext, useContext } from 'react';
import { useSettings, SettingsApi } from './useSettings';

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): SettingsApi {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside SettingsProvider');
  return ctx;
}
