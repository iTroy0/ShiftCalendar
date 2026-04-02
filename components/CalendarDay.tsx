import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType } from '../constants/shifts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = Math.floor((SCREEN_WIDTH - 20) / 7);
const CELL_HEIGHT = CELL_WIDTH + 18;

interface Props {
  date: any;
  state?: string;
  shift?: ShiftType;
  hasNote: boolean;
  hasOvertime: boolean;
  hasSwap: boolean;
  leaveInfo: { color: string; icon: string; code: string } | undefined;
  isToday: boolean;
  isSelected: boolean;
  isPatternStart: boolean;
  isPatternEnd: boolean;
  isInPattern: boolean;
  onPress: (dateString: string) => void;
  onLongPress?: (dateString: string) => void;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    primary: string;
    background: string;
  };
}

export const CalendarDay = React.memo(function CalendarDay({
  date,
  state,
  shift,
  hasNote,
  hasOvertime,
  hasSwap,
  leaveInfo,
  isToday,
  isSelected,
  isPatternStart,
  isPatternEnd,
  isInPattern,
  onPress,
  onLongPress,
  colors,
}: Props) {
  const isDisabled = state === 'disabled';
  const dayNum = date?.day;
  const dateString = date?.dateString;

  if (!dayNum) {
    return <View style={styles.container} />;
  }

  if (isDisabled) {
    return (
      <View style={[styles.container, { opacity: 0.35 }]}>
        <Text style={[styles.dayNumber, { color: colors.textSecondary, fontWeight: '400' }]}>
          {dayNum}
        </Text>
        {shift ? (
          <View style={[styles.shiftPill, { backgroundColor: shift.color }]}>
            <MaterialCommunityIcons name={shift.icon as any} size={11} color="#FFFFFFDD" />
            <Text style={styles.pillCode}>{shift.code}</Text>
          </View>
        ) : leaveInfo ? (
          <View style={[styles.shiftPill, { backgroundColor: leaveInfo.color }]}>
            <MaterialCommunityIcons name={leaveInfo.icon as any} size={11} color="#FFFFFFDD" />
            <Text style={styles.pillCode}>{leaveInfo.code}</Text>
          </View>
        ) : (
          <View style={styles.pillPlaceholder} />
        )}
      </View>
    );
  }

  const isPatternEdge = isPatternStart || isPatternEnd;

  const accessLabel = `${dayNum}${shift ? `, ${shift.label}` : ''}${isToday ? ', today' : ''}${hasNote ? ', has note' : ''}${hasOvertime ? ', has overtime' : ''}${hasSwap ? ', swap offered' : ''}`;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isPatternEdge
            ? colors.primary + '25'
            : isInPattern
            ? colors.primary + '0D'
            : shift
            ? shift.color + '18'
            : leaveInfo
            ? leaveInfo.color + '18'
            : 'transparent',
          borderColor: isSelected
            ? colors.primary
            : isPatternEdge
            ? colors.primary
            : isToday
            ? colors.primary + '50'
            : 'transparent',
          borderWidth: isSelected ? 2.5 : isPatternEdge ? 2 : isToday ? 1.5 : 0,
        },
        hasNote && {
          ...Platform.select({
            ios: {
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 5,
            },
            android: {
              elevation: 3,
            },
          }),
        },
      ]}
      onPress={() => onPress(dateString)}
      onLongPress={onLongPress ? () => onLongPress(dateString) : undefined}
      delayLongPress={400}
      activeOpacity={0.5}
      accessibilityLabel={accessLabel}
      accessibilityRole="button"
    >
      {/* Overtime indicator */}
      {hasOvertime && (
        <View style={styles.otBadge}>
          <MaterialCommunityIcons name="plus-thick" size={7} color="#FFF" />
        </View>
      )}

      {/* Swap indicator */}
      {hasSwap && (
        <View style={styles.swapBadge}>
          <MaterialCommunityIcons name="swap-horizontal" size={8} color="#FFF" />
        </View>
      )}

      <Text
        style={[
          styles.dayNumber,
          {
            color: isPatternEdge
              ? colors.primary
              : shift
              ? shift.color
              : leaveInfo
              ? leaveInfo.color
              : isToday
              ? colors.primary
              : colors.text,
            fontWeight: isToday || shift || isPatternEdge ? '800' : '500',
          },
        ]}
      >
        {dayNum}
      </Text>

      {shift ? (
        <View style={[styles.shiftPill, { backgroundColor: shift.color }]}>
          <MaterialCommunityIcons name={shift.icon as any} size={11} color="#FFFFFFDD" />
          <Text style={styles.pillCode}>{shift.code}</Text>
        </View>
      ) : leaveInfo ? (
        <View style={[styles.shiftPill, { backgroundColor: leaveInfo.color }]}>
          <MaterialCommunityIcons name={leaveInfo.icon as any} size={11} color="#FFFFFFDD" />
          <Text style={styles.pillCode}>{leaveInfo.code}</Text>
        </View>
      ) : (
        <View style={styles.pillPlaceholder} />
      )}

      {/* Note indicator */}
      {hasNote && <View style={styles.noteLine} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
    position: 'relative',
  },
  swapBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
    lineHeight: 18,
  },
  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  pillPlaceholder: {
    height: 22,
    marginTop: 4,
  },
  pillCode: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noteLine: {
    position: 'absolute',
    bottom: 4,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D97706',
  },
});
