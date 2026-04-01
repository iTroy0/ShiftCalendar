import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeMode } from '../../hooks/useTheme';

type ThemeModeOption = { value: ThemeMode; label: string; icon: string };

type Props = {
  colors: any;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  weekStart: 0 | 1;
  setWeekStart: (v: 0 | 1) => void;
  themeModes: ThemeModeOption[];
};

export function AppearanceSection({ colors, themeMode, setThemeMode, weekStart, setWeekStart, themeModes }: Props) {
  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  toggleText: { fontSize: 14, fontWeight: '600' },
});
