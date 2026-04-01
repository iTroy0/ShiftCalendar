import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { getDaysInMonth } from 'date-fns';
import { ShiftType } from '../constants/shifts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_WIDTH = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding
const DOT_SIZE = Math.max(Math.floor((MONTH_WIDTH - 24) / 7) - 1, 4);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  year: number;
  selectedMonth: number;
  shiftData: Record<string, string>;
  allShifts: ShiftType[];
  onMonthPress: (month: number) => void;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    surfaceVariant: string;
    border: string;
    primary: string;
  };
}

export const YearlyOverview = React.memo(function YearlyOverview({ year, selectedMonth, shiftData, allShifts, onMonthPress, colors }: Props) {
  const shiftColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allShifts.forEach((s) => { map[s.code] = s.color; });
    return map;
  }, [allShifts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{year} Overview</Text>
      <View style={styles.grid}>
        {MONTH_NAMES.map((name, monthIdx) => (
          <MiniMonth
            key={monthIdx}
            name={name}
            year={year}
            month={monthIdx}
            isSelected={monthIdx === selectedMonth}
            shiftData={shiftData}
            shiftColorMap={shiftColorMap}
            onPress={() => onMonthPress(monthIdx)}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
});

const MiniMonth = React.memo(function MiniMonth({
  name,
  year,
  month,
  isSelected,
  shiftData,
  shiftColorMap,
  onPress,
  colors,
}: {
  name: string;
  year: number;
  month: number;
  isSelected: boolean;
  shiftData: Record<string, string>;
  shiftColorMap: Record<string, string>;
  onPress: () => void;
  colors: any;
}) {
  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    const result: { day: number; color: string | null }[] = [];

    // Padding for first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ day: 0, color: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const code = shiftData[dateStr];
      result.push({ day: d, color: code ? shiftColorMap[code] || null : null });
    }

    return result;
  }, [year, month, shiftData, shiftColorMap]);

  return (
    <TouchableOpacity
      style={[styles.miniMonth, { borderColor: isSelected ? colors.primary : 'transparent' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.monthName, { color: isSelected ? colors.primary : colors.text }]}>
        {name}
      </Text>
      <View style={styles.dotGrid}>
        {days.map((item, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: item.day === 0
                  ? 'transparent'
                  : item.color || colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniMonth: {
    width: MONTH_WIDTH,
    flexGrow: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  monthName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
