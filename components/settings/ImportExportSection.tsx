import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  colors: any;
  activeCalendarName: string;
  exportBusy: boolean;
  selectedMonth: number | null;
  setSelectedMonth: (v: number | null) => void;
  showMonthPicker: boolean;
  setShowMonthPicker: (v: boolean) => void;
  selectedLabel: string;
  monthNames: string[];
  onExportCSV: (month: number | null) => void;
  onExportPDF: (month: number | null) => void;
  onImportCSV: () => void;
  onBackup: () => void;
  onRestore: () => void;
};

export function ImportExportSection({
  colors,
  activeCalendarName,
  exportBusy,
  selectedMonth,
  setSelectedMonth,
  showMonthPicker,
  setShowMonthPicker,
  selectedLabel,
  monthNames,
  onExportCSV,
  onExportPDF,
  onImportCSV,
  onBackup,
  onRestore,
}: Props) {
  return (
    <>
      {/* Import & Export */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>IMPORT & EXPORT</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>
          Calendar: {activeCalendarName}
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
            onPress={() => onExportCSV(selectedMonth)}
            disabled={exportBusy}
          >
            <MaterialCommunityIcons name="content-save-outline" size={18} color="#10B981" />
            <Text style={[styles.exportBtnText, { color: '#10B981' }]}>Save CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#EF444418', borderColor: '#EF444430' }]}
            onPress={() => onExportPDF(selectedMonth)}
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
          onPress={onImportCSV}
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
            onPress={onBackup}
            disabled={exportBusy}
          >
            <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.primary} />
            <Text style={[styles.exportBtnText, { color: colors.primary }]}>Save Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B30' }]}
            onPress={onRestore}
            disabled={exportBusy}
          >
            <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#F59E0B" />
            <Text style={[styles.exportBtnText, { color: '#F59E0B' }]}>Restore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  divider: { height: 1 },
  exportSubtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  exportRow: { flexDirection: 'row', gap: 8 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, gap: 6 },
  exportBtnText: { fontSize: 14, fontWeight: '700' },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, gap: 8 },
  importBtnText: { fontSize: 15, fontWeight: '700' },
  importHint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  busyText: { fontSize: 13, fontWeight: '600' },
  monthPickerBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  monthPickerText: { flex: 1, fontSize: 15, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  monthChip: { width: '23%', flexGrow: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  monthChipFull: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  monthChipText: { fontSize: 13, fontWeight: '700' },
});
