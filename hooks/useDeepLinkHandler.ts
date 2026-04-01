import { useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, NativeModules, DeviceEventEmitter } from 'react-native';
import * as Linking from 'expo-linking';
import { readAsStringAsync, cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { ShiftType } from '../constants/shifts';
import { parseCSVContent, restoreBackupFromContent } from '../utils/exportImport';

interface Deps {
  loading: boolean;
  allShifts: ShiftType[];
  setShiftsBulk: (entries: Record<string, string>) => void;
  setNote: (date: string, note: string) => void;
  setOvertime: (date: string, hours: number) => void;
}

export function useDeepLinkHandler({ loading, allShifts, setShiftsBulk, setNote, setOvertime }: Deps) {
  const handledUrl = useRef<string | null>(null);

  const handleIncomingURL = useCallback(async (url: string) => {
    if (!url) return;
    if (handledUrl.current === url) return;
    handledUrl.current = url;

    if (!url.startsWith('file://') && !url.startsWith('content://')) return;

    try {
      let readableUri = url;
      if (Platform.OS === 'android' && url.startsWith('content://')) {
        const tempPath = cacheDirectory + 'incoming_file_' + Date.now();
        await copyAsync({ from: url, to: tempPath });
        readableUri = tempPath;
      }
      const content = await readAsStringAsync(readableUri);

      // Try JSON backup first
      try {
        const parsed = JSON.parse(content);
        if (parsed.data && typeof parsed.data === 'object' && parsed.version) {
          Alert.alert(
            'Restore Backup',
            'This looks like a ShiftCalendar backup. Restore all data from this file?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Restore',
                onPress: async () => {
                  try {
                    const result = await restoreBackupFromContent(content);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Restore Complete', `Restored ${result.keyCount} entries. Please restart the app for changes to take effect.`);
                  } catch (e: any) {
                    Alert.alert('Restore Failed', e.message || 'Invalid backup file');
                  }
                },
              },
            ]
          );
          return;
        }
      } catch {
        // Not valid JSON — try CSV below
      }

      // Try CSV import
      const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
      if (lines.length >= 2 && lines[0].toLowerCase().includes('date')) {
        const result = parseCSVContent(content, allShifts);
        if (result && result.rowCount > 0) {
          Alert.alert(
            'Import CSV',
            `Found ${result.rowCount} rows of shift data. Import into the active calendar?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Import',
                onPress: () => {
                  if (Object.keys(result.shiftEntries).length > 0) setShiftsBulk(result.shiftEntries);
                  Object.entries(result.noteEntries).forEach(([date, note]) => setNote(date, note));
                  Object.entries(result.overtimeEntries).forEach(([date, hours]) => setOvertime(date, hours));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Done', `Imported ${result.rowCount} days into the active calendar.`);
                },
              },
            ]
          );
          return;
        }
      }

      Alert.alert('Unknown File', 'This file does not appear to be a ShiftCalendar CSV or backup file.');
    } catch (e: any) {
      console.error('Failed to process incoming file:', e);
      Alert.alert('Error', 'Could not read the file. It may be in an unsupported format.');
    }
  }, [allShifts, setShiftsBulk, setNote, setOvertime]);

  useEffect(() => {
    if (loading) return;

    if (Platform.OS === 'android' && NativeModules.FileIntentModule) {
      NativeModules.FileIntentModule.getFileUri().then((uri: string | null) => {
        if (uri) {
          NativeModules.FileIntentModule.clearFileUri();
          handleIncomingURL(uri);
        }
      });
    } else {
      Linking.getInitialURL().then((url) => {
        if (url) handleIncomingURL(url);
      });
    }

    const fileIntentSub = Platform.OS === 'android'
      ? DeviceEventEmitter.addListener('onFileIntent', (uri: string) => {
          NativeModules.FileIntentModule?.clearFileUri();
          handleIncomingURL(uri);
        })
      : null;

    const linkingSub = Linking.addEventListener('url', (event) => {
      handleIncomingURL(event.url);
    });

    return () => {
      linkingSub.remove();
      fileIntentSub?.remove();
    };
  }, [loading, handleIncomingURL]);
}
