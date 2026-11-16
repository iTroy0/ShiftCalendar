import React, { useCallback, useRef, useState } from 'react';
import { Text, StyleSheet, ScrollView, Alert, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAppSettings } from '../../hooks/SettingsContext';
import { useShifts } from '../../hooks/ShiftContext';
import { CalendarInfo, calendarName } from '../../hooks/useShiftData';
import { ShiftType, shiftName } from '../../constants/shifts';
import { Type } from '../../constants/theme';
import { haptic } from '../../utils/haptics';
import { plural, t } from '../../i18n';
import { requestNotificationPermissions, sendTestNotification } from '../../utils/notifications';
import {
  ExportOptions,
  backupAll,
  describeBackup,
  describeImport,
  exportCSV,
  exportPDF,
  inspectBackup,
  parseCSVContent,
  pickBackupFile,
  pickCSVFile,
  restoreBackup,
} from '../../utils/exportImport';
import { ShiftEditor } from '../../components/ShiftEditor';
import { Toast, ToastMessage } from '../../components/Toast';
import { ShiftsSection } from '../../components/settings/ShiftsSection';
import { CalendarsSection } from '../../components/settings/CalendarsSection';
import { CalendarEditor } from '../../components/settings/CalendarEditor';
import { CurrencySheet } from '../../components/settings/CurrencySheet';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import { PayEarningsSection } from '../../components/settings/PayEarningsSection';
import { LeaveBalanceSection } from '../../components/settings/LeaveBalanceSection';
import { AppearanceSection } from '../../components/settings/AppearanceSection';
import { DataSection } from '../../components/settings/DataSection';
import { AboutSection } from '../../components/settings/AboutSection';

export default function SettingsScreen() {
  const settings = useAppSettings();
  const { colors, updateSetting, reloadSettings } = settings;
  const data = useShifts();
  const { width } = useWindowDimensions();

  const shiftEditorRef = useRef<BottomSheetModal>(null);
  const calendarEditorRef = useRef<BottomSheetModal>(null);
  const currencyRef = useRef<BottomSheetModal>(null);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [editingCalendar, setEditingCalendar] = useState<CalendarInfo | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState<number | null>(new Date().getMonth());
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, tone: ToastMessage['tone'] = 'success') => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, tone });
  }, []);

  // --- Shift types ---
  const openShiftEditor = (shift: ShiftType | null) => {
    setEditingShift(shift);
    shiftEditorRef.current?.present();
  };
  const saveShift = (shift: ShiftType) => {
    if (editingShift) data.updateCustomShift(editingShift.code, shift);
    else data.addCustomShift(shift);
    showToast(editingShift ? t('{name} updated', { name: shiftName(shift) }) : t('{name} added', { name: shiftName(shift) }));
  };
  const deleteShift = (code: string) => {
    const shift = data.allShifts.find((s) => s.code === code);
    if (data.deleteCustomShift(code)) showToast(t('{name} deleted', { name: shift ? shiftName(shift) : code }));
  };

  // --- Calendars ---
  const openCalendarEditor = (calendar: CalendarInfo | null) => {
    setEditingCalendar(calendar);
    calendarEditorRef.current?.present();
  };
  const saveCalendar = (name: string, color: string) => {
    if (editingCalendar) {
      data.renameCalendar(editingCalendar.id, name, color);
      showToast(t('Calendar updated'));
    } else {
      const id = `cal_${Date.now()}`;
      data.addCalendar({ id, name, color });
      data.switchCalendar(id);
      showToast(t('{name} created', { name }));
    }
  };
  const deleteCalendar = (calendar: CalendarInfo) => {
    const name = calendarName(calendar);
    Alert.alert(t('Delete calendar?'), t('“{name}” and all of its shifts, notes and leave will be permanently deleted.', { name }), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: () => {
          haptic.heavy();
          data.deleteCalendar(calendar.id);
          if (settings.primaryCalendarId === calendar.id) updateSetting('primaryCalendarId', 'default');
          showToast(t('{name} deleted', { name }));
        },
      },
    ]);
  };

  // --- Notifications ---
  const ensurePermission = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert(t('Notifications are off'), t('Allow notifications for ShiftCalendar in your device settings to get reminders.'), [
        { text: t('Not now'), style: 'cancel' },
        { text: t('Open settings'), onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
    }
    return granted;
  };
  const toggleReminders = async (value: boolean) => {
    if (value && !(await ensurePermission())) return;
    haptic.light();
    updateSetting('notificationsEnabled', value);
  };
  const toggleAlarm = async (value: boolean) => {
    if (value && !(await ensurePermission())) return;
    haptic.light();
    updateSetting('preShiftAlarm', value);
  };
  const sendTest = async () => {
    const ok = await sendTestNotification(settings.preShiftAlarm ? 'alarm' : 'reminder');
    if (ok) showToast(t('Test notification on its way'), 'info');
    else Alert.alert(t('Could not send'), t('Notifications are unavailable or not allowed on this device.'));
  };

  // --- Data ---
  const exportOptions = (): ExportOptions => ({
    year: exportYear,
    month: exportMonth,
    data: { shifts: data.shiftData, notes: data.notesData, overtime: data.overtimeData, leave: data.leaveData },
    allShifts: data.allShifts,
    leaveTypes: data.leaveTypes,
    calendarName: calendarName(data.activeCalendar),
    weekStart: settings.weekStart,
    timeFormat: settings.timeFormat,
    baseRate: settings.baseRate,
    overtimeRate: settings.overtimeRate,
    paidLeaveHours: settings.paidLeaveHours,
    currencyCode: settings.currencyCode,
  });

  const run = async (key: string, task: () => Promise<boolean | void>, success?: string) => {
    setBusy(key);
    try {
      const done = await task();
      if (done !== false && success) {
        haptic.success();
        showToast(success);
      }
    } catch (e: any) {
      Alert.alert(t('Something went wrong'), e?.message || t('Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const importCSV = async () => {
    setBusy('import');
    let content: string | null = null;
    try {
      content = await pickCSVFile();
    } catch (e: any) {
      Alert.alert(t('Could not open file'), e?.message || t('Please try again.'));
    } finally {
      setBusy(null);
    }
    if (!content) return;
    const result = parseCSVContent(content, data.allShifts, data.leaveTypes);
    if (!result || result.days === 0) {
      Alert.alert(t('Nothing to import'), t('This file has no ShiftCalendar days in it. Export a CSV from the app to see the expected format.'));
      return;
    }
    const calendar = calendarName(data.activeCalendar);
    Alert.alert(
      t('Import spreadsheet?'),
      `${describeImport(result)}\n\n${t('Importing into “{calendar}”. Matching dates are replaced.', { calendar })}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Import'),
          onPress: () => {
            data.importDays(result);
            haptic.success();
            showToast(plural(result.days, 'Imported 1 day', 'Imported {n} days'));
          },
        },
      ]
    );
  };

  const restore = async () => {
    setBusy('restore');
    let content: string | null = null;
    try {
      content = await pickBackupFile();
    } catch (e: any) {
      Alert.alert(t('Could not open file'), e?.message || t('Please try again.'));
    } finally {
      setBusy(null);
    }
    if (!content) return;
    let summary;
    try {
      summary = inspectBackup(content);
    } catch (e: any) {
      Alert.alert(t('Not a backup'), e?.message || t('This file can’t be restored.'));
      return;
    }
    Alert.alert(t('Restore backup?'), describeBackup(summary), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Restore'),
        style: 'destructive',
        onPress: () =>
          run(
            'restore',
            async () => {
              await restoreBackup(summary);
              await Promise.all([data.reload(), reloadSettings()]);
            },
            t('Backup restored')
          ),
      },
    ]);
  };

  const resetAll = () => {
    Alert.alert(t('Erase all data?'), t('Every calendar, shift, note and setting will be deleted from this device. Make a backup first if you might want it back.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Erase everything'),
        style: 'destructive',
        onPress: async () => {
          haptic.heavy();
          await data.resetAllData();
          await reloadSettings();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, width >= 700 && styles.scrollWide]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[Type.display, styles.title, { color: colors.text }]} accessibilityRole="header">
          {t('Settings')}
        </Text>

        <ShiftsSection
          colors={colors}
          timeFormat={settings.timeFormat}
          allShifts={data.allShifts}
          onNewShift={() => openShiftEditor(null)}
          onEditShift={openShiftEditor}
          onMoveShift={data.moveShift}
        />

        <CalendarsSection
          colors={colors}
          calendars={data.calendars}
          activeCalendarId={data.activeCalendarId}
          primaryCalendarId={settings.primaryCalendarId}
          onSwitch={data.switchCalendar}
          onEdit={openCalendarEditor}
          onNew={() => openCalendarEditor(null)}
        />

        <NotificationsSection
          colors={colors}
          timeFormat={settings.timeFormat}
          remindersEnabled={settings.notificationsEnabled}
          onToggleReminders={toggleReminders}
          reminderHour={settings.notificationHour}
          onReminderHour={(h) => {
            haptic.selection();
            updateSetting('notificationHour', h);
          }}
          alarmEnabled={settings.preShiftAlarm}
          onToggleAlarm={toggleAlarm}
          alarmLead={settings.alarmLeadMinutes}
          onAlarmLead={(m) => {
            haptic.selection();
            updateSetting('alarmLeadMinutes', m);
          }}
          calendars={data.calendars}
          primaryCalendarId={data.calendars.some((c) => c.id === settings.primaryCalendarId) ? settings.primaryCalendarId : 'default'}
          onPrimaryCalendar={(id) => {
            haptic.selection();
            updateSetting('primaryCalendarId', id);
          }}
          onTest={sendTest}
        />

        <PayEarningsSection
          colors={colors}
          currencyCode={settings.currencyCode}
          onCurrencyPress={() => currencyRef.current?.present()}
          baseRate={settings.baseRate}
          setBaseRate={(v) => updateSetting('baseRate', v)}
          overtimeRate={settings.overtimeRate}
          setOvertimeRate={(v) => updateSetting('overtimeRate', v)}
          paidLeaveHours={settings.paidLeaveHours}
          setPaidLeaveHours={(v) => updateSetting('paidLeaveHours', v)}
        />

        <LeaveBalanceSection
          colors={colors}
          calendarName={calendarName(data.activeCalendar)}
          leaveTypes={data.leaveTypes}
          leaveBalances={data.leaveBalances}
          setLeaveBalance={data.setLeaveBalance}
        />

        <AppearanceSection
          colors={colors}
          themeMode={settings.themeMode}
          setThemeMode={(v) => updateSetting('themeMode', v)}
          language={settings.language}
          setLanguage={(v) => updateSetting('language', v)}
          weekStart={settings.weekStart}
          setWeekStart={(v) => updateSetting('weekStart', v)}
          timeFormat={settings.timeFormat}
          setTimeFormat={(v) => updateSetting('timeFormat', v)}
          showShiftTimes={settings.showShiftTimes}
          setShowShiftTimes={(v) => updateSetting('showShiftTimes', v)}
          hapticsEnabled={settings.hapticsEnabled}
          setHapticsEnabled={(v) => updateSetting('hapticsEnabled', v)}
        />

        <DataSection
          colors={colors}
          calendarName={calendarName(data.activeCalendar)}
          busy={busy}
          year={exportYear}
          setYear={setExportYear}
          month={exportMonth}
          setMonth={setExportMonth}
          onExportCSV={() => run('csv', () => exportCSV(exportOptions()), t('Spreadsheet exported'))}
          onExportPDF={() => run('pdf', () => exportPDF(exportOptions()), t('PDF exported'))}
          onImportCSV={importCSV}
          onBackup={() => run('backup', backupAll, t('Backup saved'))}
          onRestore={restore}
          onReset={resetAll}
        />

        <AboutSection colors={colors} showPrivacy={showPrivacy} setShowPrivacy={setShowPrivacy} />
      </ScrollView>

      <ShiftEditor
        ref={shiftEditorRef}
        editingShift={editingShift}
        existingCodes={data.allShifts.map((s) => s.code)}
        canDelete={data.allShifts.length > 1}
        onSave={saveShift}
        onDelete={deleteShift}
        onDismiss={() => setEditingShift(null)}
      />
      <CalendarEditor
        ref={calendarEditorRef}
        calendar={editingCalendar}
        usedColors={data.calendars.map((c) => c.color)}
        onSave={saveCalendar}
        onDelete={deleteCalendar}
        onDismiss={() => setEditingCalendar(null)}
      />
      <CurrencySheet ref={currencyRef} value={settings.currencyCode} onSelect={(code) => updateSetting('currencyCode', code)} />
      <Toast toast={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  scrollWide: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { marginTop: 4, marginBottom: 4 },
});
