import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  label: string;
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
  accentColor: string;
  colors: {
    text: string;
    textSecondary: string;
    surfaceVariant: string;
    border: string;
  };
}

function parseTime(value: string): [number, number] {
  if (!value || !value.includes(':')) return [0, 0];
  const [h, m] = value.split(':').map(Number);
  return [isNaN(h) ? 0 : h % 24, isNaN(m) ? 0 : m % 60];
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
}

export function TimePicker({ label, value, onChange, accentColor, colors }: Props) {
  const [hour, minute] = parseTime(value || '00:00');

  const changeHour = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newH = ((hour + delta) % 24 + 24) % 24;
      onChange(formatTime(newH, minute));
    },
    [hour, minute, onChange]
  );

  const changeMinute = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newM = ((minute + delta) % 60 + 60) % 60;
      onChange(formatTime(hour, newM));
    },
    [hour, minute, onChange]
  );

  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');

  // Peek values (what's above and below current selection)
  const prevHour = String(((hour - 1) % 24 + 24) % 24).padStart(2, '0');
  const nextHour = String(((hour + 1) % 24 + 24) % 24).padStart(2, '0');
  const prevMin = String(((minute - 5) % 60 + 60) % 60).padStart(2, '0');
  const nextMin = String(((minute + 5) % 60 + 60) % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.pickerCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        {/* Hour column */}
        <View style={styles.column}>
          <TouchableOpacity onPress={() => changeHour(1)} style={styles.arrowBtn} activeOpacity={0.5}>
            <MaterialCommunityIcons name="chevron-up" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.peekText, { color: colors.textSecondary + '50' }]}>{prevHour}</Text>
          <View style={[styles.selectedBand, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
            <Text style={[styles.selectedText, { color: accentColor }]}>{hourStr}</Text>
          </View>
          <Text style={[styles.peekText, { color: colors.textSecondary + '50' }]}>{nextHour}</Text>
          <TouchableOpacity onPress={() => changeHour(-1)} style={styles.arrowBtn} activeOpacity={0.5}>
            <MaterialCommunityIcons name="chevron-down" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Colon separator */}
        <Text style={[styles.colon, { color: accentColor }]}>:</Text>

        {/* Minute column */}
        <View style={styles.column}>
          <TouchableOpacity onPress={() => changeMinute(5)} style={styles.arrowBtn} activeOpacity={0.5}>
            <MaterialCommunityIcons name="chevron-up" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.peekText, { color: colors.textSecondary + '50' }]}>{prevMin}</Text>
          <View style={[styles.selectedBand, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
            <Text style={[styles.selectedText, { color: accentColor }]}>{minuteStr}</Text>
          </View>
          <Text style={[styles.peekText, { color: colors.textSecondary + '50' }]}>{nextMin}</Text>
          <TouchableOpacity onPress={() => changeMinute(-5)} style={styles.arrowBtn} activeOpacity={0.5}>
            <MaterialCommunityIcons name="chevron-down" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  column: {
    alignItems: 'center',
    width: 52,
  },
  arrowBtn: {
    padding: 8,
  },
  peekText: {
    fontSize: 16,
    fontWeight: '600',
    height: 22,
    lineHeight: 22,
  },
  selectedBand: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginVertical: 2,
  },
  selectedText: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 32,
  },
  colon: {
    fontSize: 26,
    fontWeight: '800',
    marginHorizontal: 2,
    marginBottom: 2,
  },
});
