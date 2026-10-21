import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCHEMA_VERSION_KEY = 'schema_version';
export const CURRENT_SCHEMA = 3;

let pending: Promise<void> | null = null;

/**
 * One-time storage upgrades. The data and settings loaders both wait on this, so neither can read
 * half-migrated state; it runs once per app session.
 */
export function runMigrations(): Promise<void> {
  if (!pending) pending = migrate().catch((e) => console.error('Storage migration failed', e));
  return pending;
}

/** Runs the upgrades again after storage was replaced wholesale (restoring a backup). */
export function rerunMigrations(): Promise<void> {
  pending = null;
  return runMigrations();
}

async function migrate() {
  const stored = new Map(await AsyncStorage.multiGet([SCHEMA_VERSION_KEY, 'active_calendar', 'primary_calendar']));
  const version = parseInt(stored.get(SCHEMA_VERSION_KEY) ?? '', 10) || 0;
  if (version >= CURRENT_SCHEMA) return;

  const writes: [string, string][] = [[SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA)]];
  // 2 → 3: reminders and the widget used to follow whichever calendar was open; keep using that one.
  const active = stored.get('active_calendar');
  if (active && !stored.get('primary_calendar')) writes.push(['primary_calendar', active]);
  await AsyncStorage.multiSet(writes);
}
