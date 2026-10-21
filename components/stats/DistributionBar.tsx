import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../../constants/colors';

export interface Segment {
  key: string;
  label: string;
  color: string;
  value: number;
  detail?: string;
}

/**
 * Part-to-whole bar: segments separated by a 2px surface gap, with a legend that always
 * carries identity (swatch + label + value in text colors, never color alone).
 */
export function DistributionBar({ segments, colors, unit }: { segments: Segment[]; colors: ThemeColors; unit: string }) {
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <View>
      <View
        style={[styles.bar, { backgroundColor: colors.surface }]}
        accessibilityRole="image"
        accessibilityLabel={`Distribution: ${visible.map((s) => `${s.label} ${s.value} ${unit}`).join(', ')}`}
      >
        {visible.map((s, i) => (
          <View
            key={s.key}
            style={{
              flex: s.value,
              backgroundColor: s.color,
              marginLeft: i === 0 ? 0 : 2,
              borderTopLeftRadius: i === 0 ? 6 : 0,
              borderBottomLeftRadius: i === 0 ? 6 : 0,
              borderTopRightRadius: i === visible.length - 1 ? 6 : 0,
              borderBottomRightRadius: i === visible.length - 1 ? 6 : 0,
            }}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {visible.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>
              {s.value}
              {s.detail ? <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{`  ${s.detail}`}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 13, fontWeight: '600', maxWidth: 120 },
  legendValue: { fontSize: 13, fontWeight: '800' },
});
