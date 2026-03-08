import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { format, startOfWeek, addDays } from 'date-fns';
import { ShiftType } from '../constants/shifts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = (SCREEN_WIDTH - 48) / 7;

interface Props {
  currentDate: Date;
  weekStart: 0 | 1;
  shiftData: Record<string, string>;
  notesData: Record<string, string>;
  overtimeData: Record<string, number>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  onDayPress: (dateString: string) => void;
  selectedDate: string | null;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    surfaceVariant: string;
    border: string;
    primary: string;
    background: string;
  };
}

export function WeekView({
  currentDate,
  weekStart,
  shiftData,
  notesData,
  overtimeData,
  getShiftByCode,
  onDayPress,
  selectedDate,
  colors,
}: Props) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: weekStart });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const code = shiftData[dateStr];
      const shift = code ? getShiftByCode(code) : undefined;
      const note = notesData[dateStr] || '';
      const overtime = overtimeData[dateStr] || 0;
      return {
        date,
        dateStr,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        monthName: format(date, 'MMM'),
        shift,
        code,
        note,
        overtime,
        isToday: dateStr === todayStr,
      };
    });
  }, [currentDate, weekStart, shiftData, notesData, overtimeData, getShiftByCode, todayStr]);

  const weekLabel = `${format(weekDays[0].date, 'MMM d')} - ${format(weekDays[6].date, 'MMM d, yyyy')}`;

  return (
    <View style={styles.container}>
      <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{weekLabel}</Text>
      <View style={styles.daysRow}>
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[
                styles.dayColumn,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '15'
                    : day.isToday
                    ? colors.primary + '08'
                    : 'transparent',
                  borderColor: isSelected
                    ? colors.primary
                    : day.isToday
                    ? colors.primary + '40'
                    : colors.border,
                },
              ]}
              onPress={() => onDayPress(day.dateStr)}
              activeOpacity={0.6}
            >
              <Text style={[styles.dayName, { color: day.isToday ? colors.primary : colors.textSecondary }]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dayNum, { color: day.isToday ? colors.primary : colors.text }]}>
                {day.dayNum}
              </Text>

              {day.shift ? (
                <View style={[styles.shiftBlock, { backgroundColor: day.shift.color }]}>
                  <Text style={styles.shiftCode}>{day.code}</Text>
                  <Text style={styles.shiftLabel} numberOfLines={1}>{day.shift.label}</Text>
                  {day.shift.startTime ? (
                    <Text style={styles.shiftTime}>{day.shift.startTime}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.emptyBlock, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary + '60' }]}>-</Text>
                </View>
              )}

              {day.overtime > 0 && (
                <View style={styles.otBadge}>
                  <Text style={styles.otText}>+{day.overtime}h</Text>
                </View>
              )}
              {day.note ? <View style={styles.noteDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    flex: 1,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 140,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  shiftBlock: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  shiftCode: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shiftLabel: {
    color: '#FFFFFFCC',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  shiftTime: {
    color: '#FFFFFF99',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  emptyBlock: {
    width: '90%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  otBadge: {
    marginTop: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  otText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  noteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginTop: 3,
  },
});
