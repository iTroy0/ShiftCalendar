import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { ShiftType, AVAILABLE_COLORS } from '../../constants/shifts';
import { ThemeMode } from '../../hooks/useTheme';
import { ShiftEditor } from '../../components/ShiftEditor';
import { exportCSV, exportPDF, importCSV } from '../../utils/exportImport';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, weekStart, setWeekStart } = useAppTheme();
  const {
    allShifts,
    shiftData,
    notesData,
    overtimeData,
    addCustomShift,
    updateCustomShift,
    deleteCustomShift,
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

  // New calendar form
  const [showNewCal, setShowNewCal] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalColor, setNewCalColor] = useState(AVAILABLE_COLORS[0]);

  // Export / Import state
  const [exportBusy, setExportBusy] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const selectedLabel = selectedMonth !== null ? `${monthNames[selectedMonth]} ${currentYear}` : `Whole Year ${currentYear}`;

  const handleExportCSV = async (month: number | null) => {
    try {
      setExportBusy(true);
      await exportCSV(currentYear, month, shiftData, notesData, overtimeData, allShifts, activeCalendar.name);
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
    deleteCustomShift(code);
    setEditorVisible(false);
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

          {/* New calendar form */}
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

          {/* Month picker */}
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

          {/* Export buttons */}
          <Text style={[styles.exportSubtitle, { color: colors.textSecondary }]}>Export</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#10B98118', borderColor: '#10B98130' }]}
              onPress={() => handleExportCSV(selectedMonth)}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="file-delimited-outline" size={18} color="#10B981" />
              <Text style={[styles.exportBtnText, { color: '#10B981' }]}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#EF444418', borderColor: '#EF444430' }]}
              onPress={() => handleExportPDF(selectedMonth)}
              disabled={exportBusy}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#EF4444" />
              <Text style={[styles.exportBtnText, { color: '#EF4444' }]}>PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

          {/* CSV Import */}
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
            Import shifts, overtime, and notes from a previously exported CSV file.
          </Text>
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
              <TouchableOpacity
                style={styles.shiftRow}
                onPress={() => !shift.isDefault && openEditShift(shift)}
                activeOpacity={shift.isDefault ? 1 : 0.6}
              >
                <View style={[styles.shiftBadge, { backgroundColor: shift.color }]}>
                  <Text style={styles.shiftBadgeText}>{shift.code}</Text>
                </View>
                <MaterialCommunityIcons name={shift.icon as any} size={20} color={shift.color} />
                <View style={styles.shiftInfo}>
                  <Text style={[styles.shiftLabel, { color: colors.text }]}>
                    {shift.label}
                    {shift.isDefault && <Text style={{ color: colors.textSecondary, fontSize: 11 }}> (default)</Text>}
                  </Text>
                  <Text style={[styles.shiftTime, { color: colors.textSecondary }]}>
                    {shift.startTime ? `${shift.startTime} – ${shift.endTime}` : 'Day Off'}
                  </Text>
                </View>
                {!shift.isDefault && (
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

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
            <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>1.0.1</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Developer</Text>
            <Text style={[styles.aboutValue, { color: colors.primary }]}>Troy</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.madeBy}>
            <MaterialCommunityIcons name="heart" size={16} color={colors.primary} />
            <Text style={[styles.madeByText, { color: colors.textSecondary }]}>Made by Troy</Text>
          </View>
        </View>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4, marginTop: 10 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  // Calendar rows
  calRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  calDot: { width: 10, height: 10, borderRadius: 5 },
  calName: { flex: 1, fontSize: 15, fontWeight: '600' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700' },
  calDeleteBtn: { padding: 4 },
  // New calendar form
  newCalForm: { marginTop: 10, gap: 10 },
  newCalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  newCalColors: { flexDirection: 'row', gap: 8 },
  newCalColorDot: { width: 28, height: 28, borderRadius: 8, borderWidth: 2.5 },
  newCalSave: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  newCalSaveText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  // Shift rows
  shiftRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  shiftBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shiftBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  shiftInfo: { flex: 1 },
  shiftLabel: { fontSize: 15, fontWeight: '600' },
  shiftTime: { fontSize: 13, marginTop: 1 },
  divider: { height: 1 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  aboutLabel: { fontSize: 15, fontWeight: '600' },
  aboutValue: { fontSize: 15 },
  madeBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 6 },
  madeByText: { fontSize: 14, fontWeight: '600' },
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
  // Month picker
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
