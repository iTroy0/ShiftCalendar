import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSettings } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { ShiftType, AVAILABLE_COLORS } from '../../constants/shifts';
import { ThemeMode } from '../../hooks/useTheme';
import { ShiftEditor } from '../../components/ShiftEditor';
import { exportCSV, exportPDF, importCSV, backupAll, restoreBackup } from '../../utils/exportImport';
import { requestNotificationPermissions, scheduleShiftReminder, cancelAllReminders } from '../../utils/notifications';

import { CalendarsSection } from '../../components/settings/CalendarsSection';
import { AppearanceSection } from '../../components/settings/AppearanceSection';
import { PayEarningsSection } from '../../components/settings/PayEarningsSection';
import { LeaveBalanceSection } from '../../components/settings/LeaveBalanceSection';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import { ImportExportSection } from '../../components/settings/ImportExportSection';
import { ShiftsSection } from '../../components/settings/ShiftsSection';
import { AboutSection } from '../../components/settings/AboutSection';

export default function SettingsScreen() {
  const {
    colors, themeMode, setThemeMode, weekStart, setWeekStart,
    baseRate, setBaseRate,
    overtimeRate, setOvertimeRate,
    currencyCode, setCurrencyCode,
    notificationsEnabled, setNotificationsEnabled,
    notificationHour, setNotificationHour,
  } = useAppSettings();
  const {
    allShifts,
    shiftData,
    notesData,
    overtimeData,
    addCustomShift,
    updateCustomShift,
    deleteCustomShift,
    moveShift,
    setShiftsBulk,
    setNote,
    setOvertime,
    leaveBalances,
    leaveTypes,
    setLeaveBalance,
    calendars,
    activeCalendar,
    addCalendar,
    deleteCalendar,
    switchCalendar,
  } = useShifts();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const editorRef = useRef<BottomSheet>(null);

  const [showNewCal, setShowNewCal] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalColor, setNewCalColor] = useState(AVAILABLE_COLORS[0]);

  const [exportBusy, setExportBusy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const selectedLabel = selectedMonth !== null ? `${monthNames[selectedMonth]} ${currentYear}` : `Whole Year ${currentYear}`;

  const [baseRateText, setBaseRateText] = useState(baseRate > 0 ? String(baseRate) : '');
  const [otRateText, setOtRateText] = useState(overtimeRate > 0 ? String(overtimeRate) : '');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    setBaseRateText(baseRate > 0 ? String(baseRate) : '');
  }, [baseRate]);

  useEffect(() => {
    setOtRateText(overtimeRate > 0 ? String(overtimeRate) : '');
  }, [overtimeRate]);

  useEffect(() => {
    if (notificationsEnabled) {
      scheduleShiftReminder(shiftData, allShifts, notificationHour).catch(console.error);
    }
  }, [notificationsEnabled, shiftData, allShifts, notificationHour]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }
      setNotificationsEnabled(true);
      await scheduleShiftReminder(shiftData, allShifts, notificationHour);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setNotificationsEnabled(false);
      await cancelAllReminders();
    }
  };

  const handleExportCSV = async (month: number | null) => {
    try {
      setExportBusy(true);
      await exportCSV(currentYear, month, shiftData, notesData, overtimeData, allShifts, activeCalendar.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Something went wrong');
    } finally {
      setExportBusy(false);
    }
  };

  const handleExportPDF = async (month: number | null) => {
    try {
      setExportBusy(true);
      await exportPDF(currentYear, month, shiftData, notesData, overtimeData, allShifts, activeCalendar.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Something went wrong');
    } finally {
      setExportBusy(false);
    }
  };

  const handleImportCSV = async () => {
    try {
      setExportBusy(true);
      const result = await importCSV(allShifts);
      if (!result) {
        setExportBusy(false);
        return;
      }
      Alert.alert(
        'Import CSV',
        `Found ${result.rowCount} rows. This will merge into "${activeCalendar.name}". Existing entries for matching dates will be overwritten.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setExportBusy(false) },
          {
            text: 'Import',
            onPress: () => {
              if (Object.keys(result.shiftEntries).length > 0) setShiftsBulk(result.shiftEntries);
              Object.entries(result.noteEntries).forEach(([date, note]) => setNote(date, note));
              Object.entries(result.overtimeEntries).forEach(([date, hours]) => setOvertime(date, hours));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', `Imported ${result.rowCount} days into "${activeCalendar.name}"`);
              setExportBusy(false);
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Something went wrong');
      setExportBusy(false);
    }
  };

  const handleBackup = async () => {
    try {
      setExportBusy(true);
      await backupAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message || 'Something went wrong');
    } finally {
      setExportBusy(false);
    }
  };

  const handleRestore = async () => {
    try {
      setExportBusy(true);
      const result = await restoreBackup();
      if (!result) {
        setExportBusy(false);
        return;
      }
      Alert.alert('Restore Complete', `Restored ${result.keyCount} entries. Please restart the app for changes to take effect.`);
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message || 'Invalid backup file');
    } finally {
      setExportBusy(false);
    }
  };

  const openNewShift = () => {
    setEditingShift(null);
    setEditorVisible(true);
  };
  const openEditShift = (shift: ShiftType) => {
    setEditingShift(shift);
    setEditorVisible(true);
  };
  const handleSaveShift = (shift: ShiftType) => {
    if (editingShift) updateCustomShift(editingShift.code, shift);
    else addCustomShift(shift);
    setEditorVisible(false);
  };
  const handleDeleteShift = (code: string) => {
    const shift = allShifts.find((s) => s.code === code);
    const label = shift?.label || code;
    Alert.alert(
      'Delete Shift',
      `Delete "${label}"? All calendar assignments using this shift will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteCustomShift(code);
            setEditorVisible(false);
          },
        },
      ]
    );
  };

  const handleAddCalendar = () => {
    if (!newCalName.trim()) {
      Alert.alert('Error', 'Calendar name is required');
      return;
    }
    const id = 'cal_' + Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addCalendar({ id, name: newCalName.trim(), color: newCalColor });
    setNewCalName('');
    setShowNewCal(false);
    switchCalendar(id);
  };

  const handleDeleteCalendar = (calId: string, name: string) => {
    Alert.alert('Delete Calendar', `Delete "${name}" and all its data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          deleteCalendar(calId);
        },
      },
    ]);
  };

  const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
    { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
    { value: 'system', label: 'System', icon: 'cellphone' },
  ];

  const notifHours = [18, 19, 20, 21, 22];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>

        <CalendarsSection
          colors={colors}
          calendars={calendars}
          activeCalendar={activeCalendar}
          showNewCal={showNewCal}
          setShowNewCal={setShowNewCal}
          newCalName={newCalName}
          setNewCalName={setNewCalName}
          newCalColor={newCalColor}
          setNewCalColor={setNewCalColor}
          onAddCalendar={handleAddCalendar}
          onDeleteCalendar={handleDeleteCalendar}
        />

        <AppearanceSection
          colors={colors}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          weekStart={weekStart}
          setWeekStart={setWeekStart}
          themeModes={themeModes}
        />

        <PayEarningsSection
          colors={colors}
          currencyCode={currencyCode}
          setCurrencyCode={setCurrencyCode}
          showCurrencyPicker={showCurrencyPicker}
          setShowCurrencyPicker={setShowCurrencyPicker}
          baseRateText={baseRateText}
          setBaseRateText={setBaseRateText}
          setBaseRate={setBaseRate}
          otRateText={otRateText}
          setOtRateText={setOtRateText}
          setOvertimeRate={setOvertimeRate}
        />

        <LeaveBalanceSection
          colors={colors}
          leaveTypes={leaveTypes}
          leaveBalances={leaveBalances}
          setLeaveBalance={setLeaveBalance}
        />

        <NotificationsSection
          colors={colors}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          notificationHour={notificationHour}
          setNotificationHour={setNotificationHour}
          shiftData={shiftData}
          allShifts={allShifts}
          notifHours={notifHours}
        />

        <ImportExportSection
          colors={colors}
          activeCalendarName={activeCalendar.name}
          exportBusy={exportBusy}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          showMonthPicker={showMonthPicker}
          setShowMonthPicker={setShowMonthPicker}
          selectedLabel={selectedLabel}
          monthNames={monthNames}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onImportCSV={handleImportCSV}
          onBackup={handleBackup}
          onRestore={handleRestore}
        />

        <ShiftsSection
          colors={colors}
          allShifts={allShifts}
          onNewShift={openNewShift}
          onEditShift={openEditShift}
          onDeleteShift={handleDeleteShift}
          onMoveShift={moveShift}
        />

        <AboutSection
          colors={colors}
          showPrivacy={showPrivacy}
          setShowPrivacy={setShowPrivacy}
        />
      </ScrollView>

      {editorVisible && (
        <ShiftEditor
          ref={editorRef}
          editingShift={editingShift}
          existingCodes={allShifts.map((s) => s.code)}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onClose={() => setEditorVisible(false)}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  screenTitle: { fontSize: 30, fontWeight: '800', marginBottom: 20, marginTop: 8 },
});
