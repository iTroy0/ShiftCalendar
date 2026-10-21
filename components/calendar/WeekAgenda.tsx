import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType, getShiftHours, isWorkingShift } from '../../constants/shifts';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { WeekStart, fromDateKey, weekDays } from '../../utils/dates';
import { TimeFormat, formatHours, formatTimeRange } from '../../utils/time';
import { readableTextColor, withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WeekAgendaProps {
  weekIndex: number;
  weekStart: WeekStart;
  shifts: Record<string, string>;
  leave: Record<string, string>;
  notes: Record<string, string>;
  overtime: Record<string, number>;
  swaps: Record<string, unknown>;
  getShiftByCode: (code: string) => ShiftType | undefined;
  getLeaveType: (id: string) => LeaveType | undefined;
  todayKey: string;
  selectedDate: string | null;
  preview: Map<string, ShiftType | null> | null;
  timeFormat: TimeFormat;
  colors: ThemeColors;
  bottomInset: number;
  onDayPress: (key: string) => void;
  onDayLongPress: (key: string) => void;
}

function WeekAgendaBase(props: WeekAgendaProps) {
  const { colors } = props;
  const days = weekDays(props.weekIndex, props.weekStart);
  let weekHours = 0;
  let worked = 0;

  const rows = days.map((key) => {
    const date = fromDateKey(key);
    const leave = props.leave[key] ? props.getLeaveType(props.leave[key]) : undefined;
    const shift = !leave && props.shifts[key] ? props.getShiftByCode(props.shifts[key]) : undefined;
    const preview = props.preview?.has(key) ? props.preview.get(key) : undefined;
    const item = preview !== undefined ? preview : leave ?? shift;
    const working = preview === undefined && isWorkingShift(shift);
    const hours = working && shift ? getShiftHours(shift) : 0;
    const ot = props.overtime[key] || 0;
    if (working) {
      weekHours += hours;
      worked++;
    }
    weekHours += ot;
    const isToday = key === props.todayKey;
    const selected = key === props.selectedDate;
    const note = props.notes[key];
    const swap = !!props.swaps[key];

    const meta: { icon: any; text: string; color: string }[] = [];
    if (working) meta.push({ icon: 'clock-outline', text: formatHours(hours), color: colors.textSecondary });
    if (ot > 0) meta.push({ icon: 'clock-plus-outline', text: `+${formatHours(ot)} OT`, color: colors.overtimeAccent });
    if (swap) meta.push({ icon: 'swap-horizontal', text: 'Swap offered', color: colors.swapAccent });

    return (
      <Tap
        key={key}
        onPress={() => props.onDayPress(key)}
        onLongPress={() => props.onDayLongPress(key)}
        delayLongPress={350}
        activeOpacity={0.7}
        accessibilityLabel={`${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}, ${item ? item.label : 'no shift'}${isToday ? ', today' : ''}${note ? ', note: ' + note : ''}`}
        style={styles.row}
      >
        <View style={styles.dateCol}>
          <Text style={[styles.dow, { color: isToday ? colors.primaryText : colors.textMuted }]}>{DAYS[date.getDay()]}</Text>
          <View style={[styles.dayCircle, isToday && { backgroundColor: colors.primary }]}>
            <Text style={[styles.dayNum, { color: isToday ? colors.onPrimary : colors.text }]}>{date.getDate()}</Text>
          </View>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: item ? withAlpha(item.color, 0.1) : colors.surface,
              borderColor: selected ? colors.primaryText : item ? withAlpha(item.color, 0.25) : colors.border,
              borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
              borderStyle: preview !== undefined ? 'dashed' : 'solid',
            },
          ]}
        >
          <View style={[styles.bar, { backgroundColor: item ? item.color : colors.border }]} />
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              {item && (
                <View style={[styles.code, { backgroundColor: item.color }]}>
                  <Text style={[styles.codeText, { color: readableTextColor(item.color) }]}>{item.code}</Text>
                </View>
              )}
              <Text style={[styles.title, { color: item ? colors.text : colors.textMuted }]} numberOfLines={1}>
                {item ? item.label : preview === null ? 'Will be cleared' : 'No shift'}
              </Text>
              {working && shift ? (
                <Text style={[styles.time, { color: colors.textSecondary }]} numberOfLines={1}>
                  {formatTimeRange(shift.startTime, shift.endTime, props.timeFormat)}
                </Text>
              ) : null}
            </View>
            {meta.length > 0 && (
              <View style={styles.metaRow}>
                {meta.map((m) => (
                  <View key={m.text} style={styles.meta}>
                    <MaterialCommunityIcons name={m.icon} size={13} color={m.color} />
                    <Text style={[styles.metaText, { color: m.color }]}>{m.text}</Text>
                  </View>
                ))}
              </View>
            )}
            {note ? (
              <View style={styles.noteRow}>
                <MaterialCommunityIcons name="note-text-outline" size={13} color={colors.noteAccent} />
                <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={2}>
                  {note}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Tap>
    );
  });

  return (
    <ScrollView
      style={StyleSheet.absoluteFill}
      contentContainerStyle={[styles.content, { paddingBottom: props.bottomInset + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          {worked} shift{worked === 1 ? '' : 's'} · {formatHours(Math.round(weekHours * 10) / 10)} this week
        </Text>
      </View>
      {rows}
    </ScrollView>
  );
}

export const WeekAgenda = React.memo(WeekAgendaBase);

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingTop: 4, gap: 8 },
  summary: { paddingHorizontal: 4, paddingBottom: 2 },
  summaryText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  dateCol: { width: 44, alignItems: 'center', paddingTop: 6 },
  dow: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dayNum: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  card: { flex: 1, flexDirection: 'row', borderRadius: 14, overflow: 'hidden', minHeight: 58 },
  bar: { width: 4 },
  cardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 5, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { minWidth: 24, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  codeText: { fontSize: 11, fontWeight: '800' },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  time: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '700' },
  noteRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  note: { flex: 1, fontSize: 12, lineHeight: 17 },
});
