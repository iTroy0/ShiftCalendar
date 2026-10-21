import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType, isWorkingShift } from '../../constants/shifts';
import { LeaveType } from '../../constants/leaveTypes';
import { ThemeColors } from '../../constants/colors';
import { readableTextColor, withAlpha } from '../../utils/color';
import { TimeFormat, formatTimeCompact } from '../../utils/time';

export type RangeState = 0 | 1 | 2; // none, inside range, range edge

export interface DayCellProps {
  dateKey: string;
  day: number;
  inMonth: boolean;
  width: number;
  height: number;
  shift?: ShiftType;
  leave?: LeaveType;
  hasNote: boolean;
  overtime: number;
  hasSwap: boolean;
  isToday: boolean;
  isSelected: boolean;
  range: RangeState;
  /** Pending change shown as a ghost: a shift, `null` for "will be cleared", undefined for none. */
  preview?: ShiftType | null;
  showTime: boolean;
  timeFormat: TimeFormat;
  colors: ThemeColors;
  isDark: boolean;
  accessibilityPrefix: string;
  onPress: (key: string) => void;
  onLongPress: (key: string) => void;
}

function DayCellBase(props: DayCellProps) {
  const {
    dateKey, day, inMonth, width, height, shift, leave, hasNote, overtime, hasSwap,
    isToday, isSelected, range, preview, showTime, timeFormat, colors, isDark, onPress, onLongPress,
  } = props;

  const item = leave ?? shift;
  const innerW = width - 4;
  const innerH = height - 4;
  const working = !leave && isWorkingShift(shift);
  const ghost = preview !== undefined;
  const pillItem = ghost ? preview : item;
  // Content tiers by available size: label line (tablets) and start-time line (most phones).
  const large = innerH >= 104 && innerW >= 84;
  const xl = innerH >= 130 && innerW >= 90;
  const bigPill = innerH >= 88 && innerW >= 44;
  const timeSlot = showTime && innerH >= 76;
  const labelLine = large && !!item && !ghost;
  const timeLine = timeSlot && working && !ghost;
  const hasDots = hasNote || overtime > 0 || hasSwap;

  // Every pill sits at the same height for a given cell size, centred in the space below the day
  // number, so OFF and leave line up with working shifts. The label and start time hang underneath
  // without moving it (it only rises when they wouldn't fit), and the dots live in the top corner.
  // Line heights mirror the label/time styles below.
  const pillH = xl ? 30 : bigPill ? 24 : 20;
  const below = (large ? (xl ? 22 : 17) : 0) + (timeSlot ? (xl || bigPill ? 18 : 16) : 0);
  const contentTop = 4 + (xl ? 28 : 24);
  const contentBottom = innerH - 4 - (innerH >= 76 ? 6 : 3);
  const centred = (contentTop + contentBottom - pillH) / 2;
  const pillTop = Math.round(Math.max(contentTop, Math.min(centred, contentBottom - below - pillH)));
  // Rough text metrics: show the icon only when icon + code fit the pill without truncating the code.
  const pillFont = xl ? 15 : bigPill ? 12.5 : 11;
  const iconSize = xl ? 15 : bigPill ? 13 : 11;
  const pillNeeds = (xl ? 18 : bigPill ? 12 : 10) + iconSize + 3 + (pillItem?.code.length ?? 0) * pillFont * 0.72;
  const showIcon = pillNeeds <= innerW - 6;

  let background = inMonth ? colors.surface : 'transparent';
  if (inMonth && item && !ghost) background = withAlpha(item.color, isDark ? 0.17 : 0.14);
  if (range === 1) background = withAlpha(colors.primary, isDark ? 0.22 : 0.14);
  if (range === 2) background = withAlpha(colors.primary, isDark ? 0.32 : 0.22);

  const ringColor = isSelected || range === 2 ? colors.primaryText : 'transparent';

  const label = [
    props.accessibilityPrefix,
    item ? (leave ? leave.label : `${shift!.label} shift`) : 'no shift',
    isToday ? 'today' : '',
    hasNote ? 'has note' : '',
    overtime > 0 ? `${overtime} hours overtime` : '',
    hasSwap ? 'swap offered' : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(dateKey)}
      onLongPress={() => onLongPress(dateKey)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [{ width, height, padding: 2 }, pressed && { opacity: 0.6, transform: [{ scale: 0.96 }] }]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: background,
            borderColor: ringColor,
            opacity: inMonth ? 1 : 0.38,
          },
        ]}
      >
        <View style={[styles.dayWrap, xl && styles.dayWrapXL, isToday && { backgroundColor: colors.primary }]}>
          <Text
            style={[
              styles.dayText,
              xl && styles.dayTextXL,
              { color: isToday ? colors.onPrimary : inMonth ? colors.text : colors.textSecondary },
              isToday && styles.dayTextToday,
            ]}
          >
            {day}
          </Text>
        </View>

        <View style={[styles.body, { paddingTop: pillTop - contentTop }]}>
          {pillItem ? (
            <View
              style={[
                styles.pill,
                bigPill && styles.pillBig,
                xl && styles.pillXL,
                { maxWidth: innerW - 6 },
                ghost
                  ? { backgroundColor: withAlpha(pillItem.color, 0.28), borderColor: pillItem.color, borderStyle: 'dashed', borderWidth: 1 }
                  : { backgroundColor: pillItem.color },
              ]}
            >
              {showIcon && (
                <MaterialCommunityIcons
                  name={pillItem.icon as any}
                  size={iconSize}
                  color={ghost ? colors.text : withAlpha(readableTextColor(pillItem.color), 0.85)}
                />
              )}
              <Text
                numberOfLines={1}
                style={[styles.pillText, bigPill && styles.pillTextBig, xl && styles.pillTextXL, { color: ghost ? colors.text : readableTextColor(pillItem.color) }]}
              >
                {pillItem.code}
              </Text>
            </View>
          ) : ghost ? (
            <View style={[styles.pill, bigPill && styles.pillBig, xl && styles.pillXL, styles.clearPill, { borderColor: colors.textMuted }]}>
              <MaterialCommunityIcons name="minus" size={11} color={colors.textMuted} />
            </View>
          ) : null}

          {labelLine ? (
            <Text numberOfLines={1} style={[styles.label, xl && styles.labelXL, { color: colors.textSecondary }]}>
              {item!.label}
            </Text>
          ) : null}
          {timeLine ? (
            <Text numberOfLines={1} style={[styles.time, bigPill && styles.timeBig, xl && styles.timeXL, { color: colors.textSecondary }]}>
              {large
                ? `${formatTimeCompact(shift!.startTime, timeFormat)}–${formatTimeCompact(shift!.endTime, timeFormat)}`
                : formatTimeCompact(shift!.startTime, timeFormat)}
            </Text>
          ) : null}
        </View>

        {hasDots && (
          <View style={[styles.dots, innerW >= 70 && styles.dotsRow]}>
            {hasNote && <View style={[styles.dot, { backgroundColor: colors.noteAccent }]} />}
            {overtime > 0 && <View style={[styles.dot, { backgroundColor: colors.overtimeAccent }]} />}
            {hasSwap && <View style={[styles.dot, { backgroundColor: colors.swapAccent }]} />}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const DayCell = React.memo(DayCellBase);

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    paddingTop: 4,
    overflow: 'hidden',
  },
  dayWrap: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayWrapXL: { minWidth: 28, height: 28, borderRadius: 14 },
  dayText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dayTextXL: { fontSize: 15 },
  dayTextToday: { fontWeight: '800' },
  body: { flex: 1, alignItems: 'center', alignSelf: 'stretch' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 7,
  },
  pillBig: { height: 24, paddingHorizontal: 6, borderRadius: 8, gap: 3 },
  pillXL: { height: 30, paddingHorizontal: 9, borderRadius: 10, gap: 4 },
  clearPill: { borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 8 },
  pillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  pillTextBig: { fontSize: 12.5 },
  pillTextXL: { fontSize: 15 },
  label: { fontSize: 10, lineHeight: 13, fontWeight: '600', marginTop: 4, paddingHorizontal: 4 },
  labelXL: { fontSize: 12.5, lineHeight: 16, marginTop: 6 },
  time: { fontSize: 9.5, lineHeight: 12, fontWeight: '600', marginTop: 4, fontVariant: ['tabular-nums'] },
  timeBig: { fontSize: 10.5, lineHeight: 13, marginTop: 5 },
  timeXL: { fontSize: 12, lineHeight: 15, marginTop: 3 },
  dots: {
    position: 'absolute',
    top: 6,
    right: 6,
    gap: 2,
  },
  dotsRow: { flexDirection: 'row', top: 8, right: 8, gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
