import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CalendarInfo } from '../hooks/useShiftData';
import { ThemeColors } from '../constants/colors';
import { haptic } from '../utils/haptics';
import { readableTextColor, withAlpha } from '../utils/color';
import { Tap } from './ui/Tap';

interface Props {
  calendars: CalendarInfo[];
  activeCalendarId: string;
  onSwitch: (calId: string) => void;
  colors: ThemeColors;
}

/** Horizontal calendar chips; hidden when there is only one calendar. */
export const CalendarSwitcher = React.memo(function CalendarSwitcher({ calendars, activeCalendarId, onSwitch, colors }: Props) {
  if (calendars.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.container}>
      {calendars.map((cal) => {
        const active = cal.id === activeCalendarId;
        return (
          <Tap
            key={cal.id}
            onPress={() => {
              if (active) return;
              haptic.selection();
              onSwitch(cal.id);
            }}
            accessibilityLabel={`${cal.name} calendar`}
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? cal.color : withAlpha(cal.color, 0.1),
                borderColor: active ? cal.color : withAlpha(cal.color, 0.3),
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: active ? readableTextColor(cal.color) : cal.color }]} />
            <Text style={[styles.text, { color: active ? readableTextColor(cal.color) : colors.text }]} numberOfLines={1}>
              {cal.name}
            </Text>
          </Tap>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  container: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
    minHeight: 32,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  text: { fontSize: 13, fontWeight: '700', maxWidth: 160 },
});
