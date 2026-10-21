import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { elevation } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  visible: boolean;
  monthIndex: number;
  todayIndex: number;
  colors: ThemeColors;
  onSelect: (monthIndex: number) => void;
  onClose: () => void;
}

/** Jump to any month: pick a year, then a month. */
export function MonthPickerModal({ visible, monthIndex, todayIndex, colors, onSelect, onClose }: Props) {
  const [year, setYear] = useState(Math.floor(monthIndex / 12));
  useEffect(() => {
    if (visible) setYear(Math.floor(monthIndex / 12));
  }, [visible, monthIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close month picker">
        <Pressable style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, elevation(3, colors.shadow)]}>
          <View style={styles.yearRow}>
            <Tap onPress={() => setYear((y) => y - 1)} accessibilityLabel="Previous year" style={[styles.yearBtn, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
            </Tap>
            <Text style={[styles.year, { color: colors.text }]}>{year}</Text>
            <Tap onPress={() => setYear((y) => y + 1)} accessibilityLabel="Next year" style={[styles.yearBtn, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
            </Tap>
          </View>
          <View style={styles.grid}>
            {MONTHS.map((m, i) => {
              const idx = year * 12 + i;
              const selected = idx === monthIndex;
              const isNow = idx === todayIndex;
              return (
                <Tap
                  key={m}
                  onPress={() => onSelect(idx)}
                  accessibilityLabel={`${m} ${year}`}
                  accessibilityState={{ selected }}
                  style={[
                    styles.month,
                    {
                      backgroundColor: selected ? colors.primary : isNow ? withAlpha(colors.primary, 0.12) : colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text style={[styles.monthText, { color: selected ? colors.onPrimary : isNow ? colors.primaryText : colors.text }]}>{m}</Text>
                </Tap>
              );
            })}
          </View>
          <Tap
            onPress={() => onSelect(todayIndex)}
            accessibilityLabel="Jump to this month"
            style={[styles.todayBtn, { borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="calendar-today" size={18} color={colors.primaryText} />
            <Text style={[styles.todayText, { color: colors.primaryText }]}>This month</Text>
          </Tap>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 18, borderWidth: StyleSheet.hairlineWidth },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  yearBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  year: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  month: { width: '31%', flexGrow: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 15, fontWeight: '700' },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  todayText: { fontSize: 14, fontWeight: '800' },
});
