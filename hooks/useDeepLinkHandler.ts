import { useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, NativeModules, DeviceEventEmitter } from 'react-native';
import * as Linking from 'expo-linking';
import { readAsStringAsync, cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import { haptic } from '../utils/haptics';
import { t } from '../i18n';
import { useShifts } from './ShiftContext';
import { useAppSettings } from './SettingsContext';
import { calendarName } from './useShiftData';
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
        Alert.alert(t('Could not open file'), t('The file could not be read. It may be in an unsupported format.'));
        return;
      }

      const trimmed = content.trimStart().replace(/^﻿/, '');
      if (trimmed.startsWith('{')) {
        try {
          const summary = inspectBackup(trimmed);
          Alert.alert(t('Restore backup?'), describeBackup(summary), [
            { text: t('Cancel'), style: 'cancel' },
            {
              text: t('Restore'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await restoreBackup(summary);
                  await Promise.all([reload(), reloadSettings()]);
                  haptic.success();
                  Alert.alert(t('Backup restored'), t('Your calendars and settings are back.'));
                } catch (e: any) {
                  Alert.alert(t('Restore failed'), e?.message || t('The backup could not be restored.'));
                }
              },
            },
          ]);
        } catch (e: any) {
          Alert.alert(t('Unrecognized file'), e?.message || t('This file is not a ShiftCalendar backup.'));
        }
        return;
      }

      const result = parseCSVContent(content, allShifts, leaveTypes);
      if (result && result.days > 0) {
        const calendar = calendarName(activeCalendar);
        Alert.alert(
          t('Import CSV?'),
          `${describeImport(result)}\n\n${t('Import into "{calendar}"? Matching dates are replaced.', { calendar })}`,
          [
            { text: t('Cancel'), style: 'cancel' },
            {
              text: t('Import'),
              onPress: () => {
                importDays(result);
                haptic.success();
                Alert.alert(t('Import complete'), t('Imported {n} days into "{calendar}".', { n: result.days, calendar }));
              },
            },
          ]
        );
        return;
      }

      Alert.alert(t('Unrecognized file'), t('This file does not look like a ShiftCalendar CSV export or backup.'));
    },
    [allShifts, leaveTypes, importDays, activeCalendar, reload, reloadSettings]
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
