import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AVAILABLE_COLORS } from '../../constants/shifts';

type Calendar = { id: string; name: string; color: string };

type Props = {
  colors: any;
  calendars: Calendar[];
  activeCalendar: Calendar;
  showNewCal: boolean;
  setShowNewCal: (v: boolean) => void;
  newCalName: string;
  setNewCalName: (v: string) => void;
  newCalColor: string;
  setNewCalColor: (v: string) => void;
  onAddCalendar: () => void;
  onDeleteCalendar: (id: string, name: string) => void;
};

export function CalendarsSection({
  colors,
  calendars,
  activeCalendar,
  showNewCal,
  setShowNewCal,
  newCalName,
  setNewCalName,
  newCalColor,
  setNewCalColor,
  onAddCalendar,
  onDeleteCalendar,
}: Props) {
  return (
    <>
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
                  onPress={() => onDeleteCalendar(cal.id, cal.name)}
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
                onPress={onAddCalendar}
              >
                <Text style={styles.newCalSaveText}>Create Calendar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4, marginTop: 10 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  divider: { height: 1 },
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
});
