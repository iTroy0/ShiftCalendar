import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CalendarInfo } from '../hooks/useShiftData';

interface Props {
  calendars: CalendarInfo[];
  activeCalendarId: string;
  onSwitch: (calId: string) => void;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const CalendarSwitcher = React.memo(function CalendarSwitcher({ calendars, activeCalendarId, onSwitch, colors }: Props) {
  if (calendars.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {calendars.map((cal) => {
        const isActive = cal.id === activeCalendarId;
        return (
          <TouchableOpacity
            key={cal.id}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? cal.color : 'transparent',
                borderColor: isActive ? cal.color : colors.border,
              },
            ]}
            onPress={() => onSwitch(cal.id)}
          >
            <View style={[styles.dot, { backgroundColor: isActive ? '#FFF' : cal.color }]} />
            <Text style={[styles.text, { color: isActive ? '#FFF' : colors.textSecondary }]}>
              {cal.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
