import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { ShiftType, AVAILABLE_COLORS } from '../../constants/shifts';
import { ThemeMode } from '../../hooks/useTheme';
import { ShiftEditor } from '../../components/ShiftEditor';
import { exportCSV, exportPDF, importCSV, backupAll, restoreBackup } from '../../utils/exportImport';
import { CURRENCIES, getCurrencySymbol } from '../../constants/currencies';
import { requestNotificationPermissions, scheduleShiftReminder, cancelAllReminders } from '../../utils/notifications';

export default function SettingsScreen() {
  const {
    colors, themeMode, setThemeMode, weekStart, setWeekStart,
    overtimeRate, setOvertimeRate,
    currencyCode, setCurrencyCode,
    notificationsEnabled, setNotificationsEnabled,
    notificationHour, setNotificationHour,
  } = useAppTheme();
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
    calendars,
    activeCalendar,
    addCalendar,
    deleteCalendar,
    renameCalendar,
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

  const [otRateText, setOtRateText] = useState(overtimeRate > 0 ? String(overtimeRate) : '');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    setOtRateText(overtimeRate > 0 ? String(overtimeRate) : '');
  }, [overtimeRate]);

  // Re-schedule notifications when relevant data changes
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

        {/* Calendars */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CALENDARS</Text>
          <TouchableOpacity
            onPress={() => setShowNewCal(!showNewCal)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {calendars.map((cal, i) => (
            <React.Fragment key={cal.id}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.calRow}>
                <View style={[styles.calDot, { backgroundColor: cal.color }]} />
                <Text
                  style={[
                    styles.calName,
                    { color: cal.id === activeCalendar.id ? colors.primary : colors.text },
                  ]}
                >
                  {cal.name}
                </Text>
                {cal.id === activeCalendar.id && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                  </View>
                )}
                {cal.id !== 'default' && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCalendar(cal.id, cal.name)}
                    style={styles.calDeleteBtn}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          ))}

          {showNewCal && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.newCalForm}>
                <TextInput
                  style={[
                    styles.newCalInput,
                    { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border },
                  ]}
                  value={newCalName}
                  onChangeText={setNewCalName}
                  placeholder="Calendar name (e.g. Team A)"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.newCalColors}>
                  {AVAILABLE_COLORS.slice(0, 8).map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.newCalColorDot,
                        { backgroundColor: c, borderColor: newCalColor === c ? '#FFF' : 'transparent' },
                      ]}
                      onPress={() => setNewCalColor(c)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.newCalSave, { backgroundColor: colors.primary }]}
                  onPress={handleAddCalendar}
                >
                  <Text style={styles.newCalSaveText}>Create Calendar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
          <View style={styles.toggleRow}>
            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: themeMode === mode.value ? colors.primary : colors.surfaceVariant,
                    borderColor: themeMode === mode.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(mode.value)}
              >
                <MaterialCommunityIcons
                  name={mode.icon as any}
                  size={18}
                  color={themeMode === mode.value ? '#FFF' : colors.textSecondary}
                />
                <Text style={[styles.toggleText, { color: themeMode === mode.value ? '#FFF' : colors.textSecondary }]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Week Start */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CALENDAR</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Week Starts On</Text>
          <View style={styles.toggleRow}>
            {([{ val: 0 as const, label: 'Sunday' }, { val: 1 as const, label: 'Monday' }]).map((item) => (
              <TouchableOpacity
                key={item.val}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: weekStart === item.val ? colors.primary : colors.surfaceVariant,
                    borderColor: weekStart === item.val ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setWeekStart(item.val)}
              >
                <Text style={[styles.toggleText, { color: weekStart === item.val ? '#FFF' : colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overtime Earnings */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OVERTIME EARNINGS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
          <TouchableOpacity
            style={[styles.monthPickerBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, marginBottom: 12 }]}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <Text style={[styles.rateSymbol, { color: colors.primary }]}>{getCurrencySymbol(currencyCode)}</Text>
            <Text style={[styles.monthPickerText, { color: colors.text }]}>
              {CURRENCIES.find((c) => c.code === currencyCode)?.name || currencyCode}
            </Text>
            <MaterialCommunityIcons name={showCurrencyPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View style={[styles.currencyGrid, { borderColor: colors.border }]}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyChip,
                    {
                      backgroundColor: currencyCode === c.code ? colors.primary : colors.surfaceVariant,
                      borderColor: currencyCode === c.code ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setCurrencyCode(c.code); setShowCurrencyPicker(false); }}
                >
                  <Text style={[styles.currencySymbol, { color: currencyCode === c.code ? '#FFF' : colors.primary }]}>
                    {c.symbol}
                  </Text>
                  <Text style={[styles.currencyCode, { color: currencyCode === c.code ? '#FFFFFFCC' : colors.text }]}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Hourly Overtime Rate</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Set your overtime hourly rate to see earnings in Stats.
          </Text>
          <View style={styles.rateRow}>
            <Text style={[styles.rateSymbol, { color: colors.primary }]}>{getCurrencySymbol(currencyCode)}</Text>
            <TextInput
              style={[styles.rateInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={otRateText}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9.]/g, '');
                setOtRateText(cleaned);
              }}
              onBlur={() => {
                const val = parseFloat(otRateText);
                setOvertimeRate(!isNaN(val) && val >= 0 ? val : 0);
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={8}
            />
            <Text style={[styles.rateUnit, { color: colors.textSecondary }]}>/hour</Text>
          </View>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.notifRow}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={notificationsEnabled ? colors.primary : colors.textSecondary} />
            <View style={styles.notifInfo}>
              <Text style={[styles.notifLabel, { color: colors.text }]}>Shift Reminders</Text>
              <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                Get notified the evening before your shift
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
          {notificationsEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 10 }]} />
              <Text style={[styles.notifTimeLabel, { color: colors.textSecondary }]}>Reminder Time</Text>
              <View style={styles.notifTimeRow}>
                {notifHours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.notifTimeChip,
                      {
                        backgroundColor: notificationHour === h ? colors.primary : colors.surfaceVariant,
                        borderColor: notificationHour === h ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setNotificationHour(h);
                      scheduleShiftReminder(shiftData, allShifts, h).catch(console.error);
                    }}
                  >
                    <Text style={[styles.notifTimeText, { color: notificationHour === h ? '#FFF' : colors.text }]}>
                      {h > 12 ? `${h - 12} PM` : `${h} AM`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Import & Export */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>IMPORT & EXPORT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>
            Calendar: {activeCalendar.name}
          </Text>

          {exportBusy && (
            <View style={styles.busyRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.busyText, { color: colors.textSecondary }]}>Processing...</Text>
            </View>
          )}

          <Text style={[styles.exportSubtitle, { color: colors.textSecondary }]}>Period</Text>
          <TouchableOpacity
            style={[styles.monthPickerBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <MaterialCommunityIcons name="calendar-range" size={18} color={colors.primary} />
            <Text style={[styles.monthPickerText, { color: colors.text }]}>{selectedLabel}</Text>
            <MaterialCommunityIcons name={showMonthPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showMonthPicker && (
            <View style={[styles.monthGrid, { borderColor: colors.border }]}>
              {monthNames.map((name, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: selectedMonth === idx ? colors.primary : colors.surfaceVariant,
                      borderColor: selectedMonth === idx ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}
                >
                  <Text style={[styles.monthChipText, { color: selectedMonth === idx ? '#FFF' : colors.text }]}>
                    {name.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.monthChipFull,
                  {
                    backgroundColor: selectedMonth === null ? colors.primary : colors.surfaceVariant,
                    borderColor: selectedMonth === null ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setSelectedMonth(null); setShowMonthPicker(false); }}
              >
                <MaterialCommunityIcons name="calendar-multiple" size={16} color={selectedMonth === null ? '#FFF' : colors.text} />
                <Text style={[styles.monthChipText, { color: selectedMonth === null ? '#FFF' : colors.text }]}>
                  Whole Year
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 14 }} />

          <Text style={[styles.exportSubtitle, { color: colors.textSecondary }]}>Save / Export</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#10B98118', borderColor: '#10B98130' }]}
              onPress={() => handleExportCSV(selectedMonth)}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#10B981" />
              <Text style={[styles.exportBtnText, { color: '#10B981' }]}>Save CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#EF444418', borderColor: '#EF444430' }]}
              onPress={() => handleExportPDF(selectedMonth)}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#EF4444" />
              <Text style={[styles.exportBtnText, { color: '#EF4444' }]}>Save PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          <Text style={[styles.exportSubtitle, { color: colors.textSecondary }]}>Import CSV</Text>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
            onPress={handleImportCSV}
            disabled={exportBusy}
          >
            <MaterialCommunityIcons name="file-import-outline" size={20} color={colors.primary} />
            <Text style={[styles.importBtnText, { color: colors.primary }]}>Choose CSV File</Text>
          </TouchableOpacity>
          <Text style={[styles.importHint, { color: colors.textSecondary }]}>
            Import shifts, overtime, and notes from a CSV file. You can also open CSV files directly from your file manager.
          </Text>
        </View>

        {/* Backup & Restore */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BACKUP & RESTORE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 12 }]}>
            Full backup includes all calendars, shifts, notes, and settings. You can also open backup files directly from your file manager to restore.
          </Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              onPress={handleBackup}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.primary} />
              <Text style={[styles.exportBtnText, { color: colors.primary }]}>Save Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B30' }]}
              onPress={handleRestore}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#F59E0B" />
              <Text style={[styles.exportBtnText, { color: '#F59E0B' }]}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shifts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SHIFTS</Text>
          <TouchableOpacity onPress={openNewShift} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {allShifts.map((shift, i) => (
            <React.Fragment key={shift.code}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.shiftRow}>
                <View style={[styles.shiftBadge, { backgroundColor: shift.color }]}>
                  <Text style={styles.shiftBadgeText}>{shift.code}</Text>
                </View>
                <MaterialCommunityIcons name={shift.icon as any} size={20} color={shift.color} />
                <View style={styles.shiftInfo}>
                  <Text style={[styles.shiftLabel, { color: colors.text }]}>{shift.label}</Text>
                  <Text style={[styles.shiftTime, { color: colors.textSecondary }]}>
                    {shift.startTime ? `${shift.startTime} – ${shift.endTime}` : 'Day Off'}
                  </Text>
                </View>
                <View style={styles.shiftActions}>
                  <TouchableOpacity
                    style={[styles.shiftActionBtn, { opacity: i === 0 ? 0.25 : 1 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); moveShift(shift.code, 'up'); }}
                    disabled={i === 0}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <MaterialCommunityIcons name="chevron-up" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shiftActionBtn, { opacity: i === allShifts.length - 1 ? 0.25 : 1 }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); moveShift(shift.code, 'down'); }}
                    disabled={i === allShifts.length - 1}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shiftActionBtn}
                    onPress={() => openEditShift(shift)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shiftActionBtn, { opacity: allShifts.length <= 1 ? 0.25 : 1 }]}
                    onPress={() => handleDeleteShift(shift.code)}
                    disabled={allShifts.length <= 1}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={() => {
              Alert.alert(
                'Reset All Data',
                'This will permanently delete all shifts, notes, overtime, and custom calendars. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      await AsyncStorage.clear();
                      Alert.alert('Done', 'All data has been reset. Please restart the app.');
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#EF4444" />
            <Text style={styles.dangerRowText}>Reset All Data</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT</Text>
        <TouchableOpacity
          style={[styles.coffeeCard, { backgroundColor: '#FFDD0020', borderColor: '#FFDD0050' }]}
          onPress={() => Linking.openURL('https://buymeacoffee.com/itroy0')}
          activeOpacity={0.7}
        >
          <View style={styles.coffeeIconWrap}>
            <MaterialCommunityIcons name="coffee" size={28} color="#FFDD00" />
          </View>
          <View style={styles.coffeeInfo}>
            <Text style={[styles.coffeeTitle, { color: colors.text }]}>Buy Me a Coffee</Text>
            <Text style={[styles.coffeeDesc, { color: colors.textSecondary }]}>
              If you enjoy ShiftCalendar, consider supporting its development!
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>App Name</Text>
            <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>ShiftCalendar</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>2.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Developer</Text>
            <Text style={[styles.aboutValue, { color: colors.primary }]}>Troy</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.aboutRow}
            onPress={() => setShowPrivacy(true)}
            activeOpacity={0.6}
          >
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.madeBy}>
            <MaterialCommunityIcons name="heart" size={16} color={colors.primary} />
            <Text style={[styles.madeByText, { color: colors.textSecondary }]}>Made by Troy</Text>
          </View>
        </View>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.privacyHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.privacyTitle, { color: colors.text }]}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)} style={styles.privacyClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.privacyContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.privacyUpdated, { color: colors.textSecondary }]}>
              Last updated: March 2026
            </Text>

            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar is committed to protecting your privacy. This policy explains how the app handles your information.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Data Storage</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              All your data — including shifts, notes, overtime records, calendars, and settings — is stored locally on your device using secure on-device storage. No data is transmitted to external servers.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>No Account Required</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not require you to create an account, sign in, or provide any personal information to use the app.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>No Data Collection</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              We do not collect, store, or share any personal data, analytics, usage statistics, or telemetry. The app operates entirely offline.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              If you enable shift reminders, notifications are scheduled locally on your device. No notification data is sent to any server.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Export & Backup</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              When you export data (CSV, PDF) or create backups, files are saved directly to your device. These files are not uploaded to any external service unless you choose to share them yourself.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Third-Party Services</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not integrate with any third-party analytics, advertising, or tracking services.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Children's Privacy</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not knowingly collect information from children under 13.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Changes to This Policy</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              We may update this privacy policy from time to time. Any changes will be reflected within the app.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Contact</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              If you have questions about this policy, you can reach the developer through the app's support channels.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4, marginTop: 10 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  // Overtime rate
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1 },
  currencyChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, gap: 4 },
  currencySymbol: { fontSize: 14, fontWeight: '800' },
  currencyCode: { fontSize: 12, fontWeight: '600' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rateSymbol: { fontSize: 20, fontWeight: '800' },
  rateInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, fontWeight: '700' },
  rateUnit: { fontSize: 14, fontWeight: '600' },
  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifInfo: { flex: 1 },
  notifLabel: { fontSize: 15, fontWeight: '600' },
  notifDesc: { fontSize: 12, marginTop: 1 },
  notifTimeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  notifTimeRow: { flexDirection: 'row', gap: 6 },
  notifTimeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  notifTimeText: { fontSize: 13, fontWeight: '700' },
  // Calendar rows
  calRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calName: { flex: 1, fontSize: 15, fontWeight: '600' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700' },
  calDeleteBtn: { padding: 4 },
  newCalForm: { marginTop: 10, gap: 10 },
  newCalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  newCalColors: { flexDirection: 'row', gap: 8 },
  newCalColorDot: { width: 28, height: 28, borderRadius: 8, borderWidth: 2.5 },
  newCalSave: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  newCalSaveText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  // Shift rows
  shiftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  shiftBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shiftBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  shiftInfo: { flex: 1 },
  shiftLabel: { fontSize: 15, fontWeight: '600' },
  shiftTime: { fontSize: 13, marginTop: 2 },
  shiftActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  shiftActionBtn: { padding: 4 },
  divider: { height: 1 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  dangerRowText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#EF4444' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  aboutLabel: { fontSize: 15, fontWeight: '600' },
  aboutValue: { fontSize: 15 },
  madeBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 6 },
  madeByText: { fontSize: 14, fontWeight: '600' },
  // Coffee card
  coffeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  coffeeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFDD0020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coffeeInfo: { flex: 1 },
  coffeeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  coffeeDesc: { fontSize: 13, lineHeight: 18 },
  // Privacy modal
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  privacyTitle: { fontSize: 20, fontWeight: '800' },
  privacyClose: { padding: 4 },
  privacyContent: { padding: 20 },
  privacyUpdated: { fontSize: 13, fontWeight: '600', marginBottom: 16 },
  privacySectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  privacyBody: { fontSize: 14, lineHeight: 22 },
  // Export / Import
  exportSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  exportBtnText: { fontSize: 14, fontWeight: '700' },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  importHint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  busyText: { fontSize: 13, fontWeight: '600' },
  monthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  monthPickerText: { flex: 1, fontSize: 15, fontWeight: '600' },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  monthChip: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  monthChipFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  monthChipText: { fontSize: 13, fontWeight: '700' },
});
