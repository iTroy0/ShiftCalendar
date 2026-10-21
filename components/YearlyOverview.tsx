import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { ShiftType } from '../constants/shifts';
import { LeaveType } from '../constants/leaveTypes';
import { ThemeColors } from '../constants/colors';
import { WeekStart, buildMonthGrid } from '../utils/dates';
import { withAlpha } from '../utils/color';
import { Tap } from './ui/Tap';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  year: number;
  selectedMonth: number | null;
  todayKey: string;
  weekStart: WeekStart;
  shiftData: Record<string, string>;
  leaveData: Record<string, string>;
  allShifts: ShiftType[];
  leaveTypes: LeaveType[];
  onMonthPress: (month: number) => void;
  colors: ThemeColors;
}

const MiniMonth = React.memo(function MiniMonth({
  year,
  month,
  isSelected,
  todayKey,
  weekStart,
  shiftData,
  leaveData,
  colorMap,
  onPress,
  colors,
  width,
}: {
  year: number;
  month: number;
  isSelected: boolean;
  todayKey: string;
  weekStart: WeekStart;
  shiftData: Record<string, string>;
  leaveData: Record<string, string>;
  colorMap: Map<string, string>;
  onPress: (month: number) => void;
  colors: ThemeColors;
  width: number;
}) {
  const rows = useMemo(() => buildMonthGrid(year, month, weekStart), [year, month, weekStart]);
  // Inner width = width − padding (16) − border (3); a row holds 7 dots and 6 gaps of 2px.
  const dot = Math.max(Math.floor((width - 19 - 12) / 7), 4);
  let assigned = 0;
  const grid = rows.map((row, r) => (
    <View key={r} style={styles.dotRow}>
      {row.map((d) => {
        if (!d.inMonth) return <View key={d.key} style={{ width: dot, height: dot }} />;
        const leave = leaveData[d.key];
        const code = shiftData[d.key];
        const color = leave ? colorMap.get(`l:${leave}`) : code ? colorMap.get(`s:${code}`) : undefined;
        if (color) assigned++;
        return (
          <View
            key={d.key}
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 3,
              backgroundColor: color ?? colors.surfaceVariant,
              borderWidth: d.key === todayKey ? 1.5 : 0,
              borderColor: colors.text,
            }}
          />
        );
      })}
    </View>
  ));

  return (
    <Tap
      onPress={() => onPress(month)}
      activeOpacity={0.7}
      accessibilityLabel={`${MONTH_NAMES[month]} ${year}: ${assigned} days scheduled`}
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.miniMonth,
        {
          width,
          borderColor: isSelected ? colors.primaryText : 'transparent',
          backgroundColor: isSelected ? withAlpha(colors.primary, 0.08) : 'transparent',
        },
      ]}
    >
      <Text style={[styles.monthName, { color: isSelected ? colors.primaryText : colors.textSecondary }]}>{MONTH_NAMES[month]}</Text>
      <View style={styles.dotGrid}>{grid}</View>
    </Tap>
  );
});

/** Twelve mini months, each day tinted by its shift or leave — tap one to open it. */
export const YearlyOverview = React.memo(function YearlyOverview(props: Props) {
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 6 : width >= 520 ? 4 : 3;
  const available = Math.min(width, 980) - 32 - 32;
  const monthWidth = Math.floor((available - (columns - 1) * 8) / columns);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    props.allShifts.forEach((s) => map.set(`s:${s.code}`, s.color));
    props.leaveTypes.forEach((t) => map.set(`l:${t.id}`, t.color));
    return map;
  }, [props.allShifts, props.leaveTypes]);

  return (
    <View style={styles.grid}>
      {MONTH_NAMES.map((_, m) => (
        <MiniMonth
          key={m}
          year={props.year}
          month={m}
          isSelected={m === props.selectedMonth}
          todayKey={props.todayKey}
          weekStart={props.weekStart}
          shiftData={props.shiftData}
          leaveData={props.leaveData}
          colorMap={colorMap}
          onPress={props.onMonthPress}
          colors={props.colors}
          width={monthWidth}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniMonth: { padding: 8, borderRadius: 12, borderWidth: 1.5 },
  monthName: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  dotGrid: { gap: 2 },
  dotRow: { flexDirection: 'row', gap: 2 },
});
