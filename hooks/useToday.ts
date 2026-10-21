import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayKey } from '../utils/dates';

/** Today's date key; updates across midnight and when the app returns to the foreground. */
export function useToday(): string {
  const [key, setKey] = useState(todayKey);
  useEffect(() => {
    const tick = () => {
      const now = todayKey();
      setKey((prev) => (prev === now ? prev : now));
    };
    const id = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return key;
}
