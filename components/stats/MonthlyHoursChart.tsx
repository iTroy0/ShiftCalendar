import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { formatHours } from '../../utils/time';
import { Tap } from '../ui/Tap';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PLOT_HEIGHT = 120;

interface Props {
  hours: number[]; // 12 values
  colors: ThemeColors;
  highlightMonth: number | null;
  onMonthPress: (month: number) => void;
}

/**
 * One series → one color. Columns are capped in width, rounded only at the data end,
 * and grow from a single hairline baseline. Tap a column to read its value.
 */
export function MonthlyHoursChart({ hours, colors, highlightMonth, onMonthPress }: Props) {
  const max = Math.max(...hours, 0);
  const peak = max > 0 ? hours.indexOf(max) : -1;
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected ?? (highlightMonth !== null && hours[highlightMonth] > 0 ? highlightMonth : peak);

  return (
    <View>
      <View style={styles.readout}>
        {shown >= 0 && hours[shown] > 0 ? (
          <Text style={[styles.readoutText, { color: colors.textSecondary }]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{formatHours(hours[shown])}</Text>
            {`  in ${MONTH_NAMES[shown]}${shown === peak && selected === null ? ' · busiest month' : ''}`}
          </Text>
        ) : (
          <Text style={[styles.readoutText, { color: colors.textMuted }]}>No hours logged this year yet</Text>
        )}
      </View>
      <View style={[styles.plot, { height: PLOT_HEIGHT }]}>
        {hours.map((h, i) => {
          const height = max > 0 ? Math.max((h / max) * PLOT_HEIGHT, h > 0 ? 4 : 0) : 0;
          const active = i === shown;
          return (
            <Tap
              key={i}
              onPress={() => setSelected(i)}
              onLongPress={() => onMonthPress(i)}
              accessibilityLabel={`${MONTH_NAMES[i]}: ${formatHours(h)}`}
              accessibilityHint="Long-press to open this month"
              activeOpacity={0.8}
              style={styles.slot}
            >
              <View
                style={[
                  styles.column,
                  {
                    height,
                    backgroundColor: colors.primary,
                    opacity: shown < 0 || active ? 1 : 0.45,
                  },
                ]}
              />
            </Tap>
          );
        })}
      </View>
      <View style={[styles.baseline, { backgroundColor: colors.border }]} />
      <View style={styles.axis}>
        {MONTHS.map((m, i) => (
          <Text key={i} style={[styles.axisLabel, { color: i === shown ? colors.text : colors.textMuted }]}>
            {m}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 22, marginBottom: 8 },
  readoutText: { fontSize: 13, fontWeight: '600' },
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  slot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  column: { width: '62%', maxWidth: 24, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: StyleSheet.hairlineWidth },
  axis: { flexDirection: 'row', marginTop: 6 },
  axisLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
});
