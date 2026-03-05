import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ShiftType } from '../constants/shifts';

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
  colors,
}: Props) {
  const isDisabled = state === 'disabled';
  const dayNum = date?.day;
  const dateString = date?.dateString;

  if (!dayNum || isDisabled) {
    return <View style={styles.container} />;
  }

  const isPatternEdge = isPatternStart || isPatternEnd;

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
            ? shift.color + '14'
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
      activeOpacity={0.5}
    >
      {/* Overtime indicator — small red dot top-right */}
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

      {/* Note indicator — small amber line at bottom */}
      {hasNote && <View style={styles.noteLine} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
    position: 'relative',
  },
  otDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  dayNumber: {
    fontSize: 15,
    lineHeight: 18,
  },
  badge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    minWidth: 22,
    alignItems: 'center',
  },
  badgePlaceholder: {
    height: 16,
    marginTop: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noteLine: {
    position: 'absolute',
    bottom: 3,
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F59E0B',
  },
});
