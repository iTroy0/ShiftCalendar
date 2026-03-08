import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { ShiftType } from '../constants/shifts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = Math.floor((SCREEN_WIDTH - 20) / 7);
const CELL_HEIGHT = CELL_WIDTH + 14;

interface Props {
  date: any;
  state?: string;
  shift?: ShiftType;
  hasNote: boolean;
  hasOvertime: boolean;
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

export function CalendarDay({
  date,
  state,
  shift,
  hasNote,
  hasOvertime,
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

  if (!dayNum || isDisabled) {
    return <View style={styles.container} />;
  }

  const isPatternEdge = isPatternStart || isPatternEnd;

  const accessLabel = `${dayNum}${shift ? `, ${shift.label}` : ''}${isToday ? ', today' : ''}${hasNote ? ', has note' : ''}${hasOvertime ? ', has overtime' : ''}`;

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
      {hasOvertime && <View style={styles.otDot} />}

      <Text
        style={[
          styles.dayNumber,
          {
            color: isPatternEdge
              ? colors.primary
              : shift
              ? shift.color
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
        <View style={[styles.badge, { backgroundColor: shift.color }]}>
          <Text style={styles.badgeText}>{shift.code}</Text>
        </View>
      ) : (
        <View style={styles.badgePlaceholder} />
      )}

      {/* Note indicator */}
      {hasNote && <View style={styles.noteLine} />}
    </TouchableOpacity>
  );
}

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
  otDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  dayNumber: {
    fontSize: 16,
    lineHeight: 20,
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    minWidth: 24,
    alignItems: 'center',
  },
  badgePlaceholder: {
    height: 18,
    marginTop: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noteLine: {
    position: 'absolute',
    bottom: 4,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
});
