import { useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, NativeModules, DeviceEventEmitter } from 'react-native';
import * as Linking from 'expo-linking';
import { readAsStringAsync, cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { haptic } from '../utils/haptics';
import { useShifts } from './ShiftContext';
import { useAppSettings } from './SettingsContext';
import {
  parseCSVContent,
  describeImport,
  inspectBackup,
  describeBackup,
  restoreBackup,
} from '../utils/exportImport';

/** Handles CSV and backup files opened with the app from a file manager or another app. */
export function useDeepLinkHandler() {
  const { loading, allShifts, leaveTypes, importDays, activeCalendar, reload } = useShifts();
  const { reloadSettings } = useAppSettings();
  const handledUrl = useRef<string | null>(null);

  const handleIncomingURL = useCallback(
    async (url: string) => {
      if (!url || handledUrl.current === url) return;
      if (!url.startsWith('file://') && !url.startsWith('content://')) return;
      handledUrl.current = url;

      let content: string;
      try {
        let readableUri = url;
        if (Platform.OS === 'android' && url.startsWith('content://')) {
          const tempPath = cacheDirectory + 'incoming_file_' + Date.now();
          await copyAsync({ from: url, to: tempPath });
          readableUri = tempPath;
        }
        content = await readAsStringAsync(readableUri);
      } catch (e) {
        console.error('Failed to read incoming file:', e);
        Alert.alert('Could not open file', 'The file could not be read. It may be in an unsupported format.');
        return;
      }

      const trimmed = content.trimStart().replace(/^﻿/, '');
      if (trimmed.startsWith('{')) {
        try {
          const summary = inspectBackup(trimmed);
          Alert.alert('Restore backup?', describeBackup(summary), [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                try {
                  await restoreBackup(summary);
                  await Promise.all([reload(), reloadSettings()]);
                  haptic.success();
                  Alert.alert('Backup restored', 'Your calendars and settings are back.');
                } catch (e: any) {
                  Alert.alert('Restore failed', e?.message || 'The backup could not be restored.');
                }
              },
            },
          ]);
        } catch (e: any) {
          Alert.alert('Unrecognized file', e?.message || 'This file is not a ShiftCalendar backup.');
        }
        return;
      }

      const result = parseCSVContent(content, allShifts, leaveTypes);
      if (result && result.days > 0) {
        Alert.alert('Import CSV?', `${describeImport(result)}\n\nImport into "${activeCalendar.name}"? Matching dates are replaced.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => {
              importDays(result);
              haptic.success();
              Alert.alert('Import complete', `Imported ${result.days} days into "${activeCalendar.name}".`);
            },
          },
        ]);
        return;
      }

      Alert.alert('Unrecognized file', 'This file does not look like a ShiftCalendar CSV export or backup.');
    },
    [allShifts, leaveTypes, importDays, activeCalendar.name, reload, reloadSettings]
  );

  // Listeners always call the latest handler without re-subscribing (and re-reading the launch URL).
  const handlerRef = useRef(handleIncomingURL);
  handlerRef.current = handleIncomingURL;

  useEffect(() => {
    if (loading) return;
    const handle = (url: string) => handlerRef.current(url);

    if (Platform.OS === 'android' && NativeModules.FileIntentModule) {
      NativeModules.FileIntentModule.getFileUri()
        .then((uri: string | null) => {
          if (uri) {
            NativeModules.FileIntentModule.clearFileUri();
            handle(uri);
          }
        })
        .catch(() => {});
    } else {
      Linking.getInitialURL()
        .then((url) => {
          if (url) handle(url);
        })
        .catch(() => {});
    }

    const fileIntentSub =
      Platform.OS === 'android'
        ? DeviceEventEmitter.addListener('onFileIntent', (uri: string) => {
            NativeModules.FileIntentModule?.clearFileUri();
            handle(uri);
          })
        : null;

    const linkingSub = Linking.addEventListener('url', (event) => handle(event.url));

    return () => {
      linkingSub.remove();
      fileIntentSub?.remove();
    };
  }, [loading]);
}
