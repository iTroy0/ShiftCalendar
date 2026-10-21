import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShiftType } from '../../constants/shifts';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { WeekStart, buildMonthGrid, monthFromIndex, weekdayOrder } from '../../utils/dates';
import { TimeFormat } from '../../utils/time';
import { DayCell, RangeState } from './DayCell';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface MonthGridProps {
  monthIndex: number;
  weekStart: WeekStart;
  width: number;
  height: number;
  shifts: Record<string, string>;
  leave: Record<string, string>;
  notes: Record<string, string>;
  overtime: Record<string, number>;
  swaps: Record<string, unknown>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  getLeaveType: (id: string) => LeaveType | undefined;
  todayKey: string;
  selectedDate: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  preview: Map<string, ShiftType | null> | null;
  showTime: boolean;
  timeFormat: TimeFormat;
  colors: ThemeColors;
  isDark: boolean;
  onDayPress: (key: string) => void;
  onDayLongPress: (key: string) => void;
}

function MonthGridBase(props: MonthGridProps) {
  const { monthIndex, weekStart, width, height, rangeStart, rangeEnd } = props;
  const month = monthFromIndex(monthIndex);
  const rows = useMemo(
    () => buildMonthGrid(month.getFullYear(), month.getMonth(), weekStart),
    [month.getFullYear(), month.getMonth(), weekStart] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const cellW = width / 7;
  const cellH = Math.floor(height / rows.length);

  return (
    <View style={{ width, height }}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((d) => {
            const leaveId = props.leave[d.key];
            const code = props.shifts[d.key];
            let range: RangeState = 0;
            if (rangeStart && (d.key === rangeStart || d.key === rangeEnd)) range = 2;
            else if (rangeStart && rangeEnd && d.key > rangeStart && d.key < rangeEnd) range = 1;
            const preview = props.preview && props.preview.has(d.key) ? props.preview.get(d.key) : undefined;
            const date = d.key.split('-');
            return (
              <DayCell
                key={d.key}
                dateKey={d.key}
                day={d.day}
                inMonth={d.inMonth}
                width={cellW}
                height={cellH}
                shift={code ? props.getShiftByCode(code) : undefined}
                leave={leaveId ? props.getLeaveType(leaveId) : undefined}
                hasNote={!!props.notes[d.key]}
                overtime={props.overtime[d.key] || 0}
                hasSwap={!!props.swaps[d.key]}
                isToday={d.key === props.todayKey}
                isSelected={d.key === props.selectedDate}
                range={range}
                preview={preview}
                showTime={props.showTime}
                timeFormat={props.timeFormat}
                colors={props.colors}
                isDark={props.isDark}
                accessibilityPrefix={`${WEEKDAY_LONG[d.weekday]} ${d.day} ${MONTHS[Number(date[1]) - 1]}`}
                onPress={props.onDayPress}
                onLongPress={props.onDayLongPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const MonthGrid = React.memo(MonthGridBase);

export function WeekdayHeader({
  weekStart,
  colors,
  width,
  todayWeekday,
}: {
  weekStart: WeekStart;
  colors: ThemeColors;
  width: number;
  todayWeekday: number | null;
}) {
  return (
    <View style={[styles.row, { width }]} importantForAccessibility="no-hide-descendants">
      {weekdayOrder(weekStart).map((wd) => {
        const weekend = wd === 0 || wd === 6;
        const today = wd === todayWeekday;
        return (
          <Text
            key={wd}
            style={[
              styles.weekday,
              { width: width / 7, color: today ? colors.primaryText : weekend ? colors.textMuted : colors.textSecondary },
              today && styles.weekdayToday,
            ]}
          >
            {WEEKDAY_SHORT[wd]}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekday: { textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, paddingVertical: 6, textTransform: 'uppercase' },
  weekdayToday: { fontWeight: '800' },
});
