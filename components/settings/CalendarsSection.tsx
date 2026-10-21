import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarInfo } from '../../hooks/useShiftData';
import { ThemeColors } from '../../constants/colors';
import { withAlpha } from '../../utils/color';
import { haptic } from '../../utils/haptics';
import { Tap } from '../ui/Tap';
import { SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  calendars: CalendarInfo[];
  activeCalendarId: string;
  primaryCalendarId: string;
  onSwitch: (id: string) => void;
  onEdit: (calendar: CalendarInfo) => void;
  onNew: () => void;
}

export function CalendarsSection({ colors, calendars, activeCalendarId, primaryCalendarId, onSwitch, onEdit, onNew }: Props) {
  return (
    <>
      <SectionLabel colors={colors}>Calendars</SectionLabel>
      <SettingsCard colors={colors}>
        {calendars.map((cal) => {
          const active = cal.id === activeCalendarId;
          const primary = cal.id === primaryCalendarId && calendars.length > 1;
          return (
            <Tap
              key={cal.id}
              onPress={() => {
                if (active) return;
                haptic.selection();
                onSwitch(cal.id);
              }}
              activeOpacity={0.6}
              accessibilityLabel={`${cal.name}${active ? ', currently shown' : '. Tap to show this calendar'}`}
              style={styles.row}
            >
              <View style={[styles.dot, { backgroundColor: cal.color }]} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {cal.name}
                </Text>
                {(active || primary) && (
                  <View style={styles.badges}>
                    {active && (
                      <View style={[styles.badge, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
                        <Text style={[styles.badgeText, { color: colors.primaryText }]}>Showing</Text>
                      </View>
                    )}
                    {primary && (
                      <View style={[styles.badge, { backgroundColor: withAlpha(colors.warning, 0.14) }]}>
                        <MaterialCommunityIcons name="bell-outline" size={11} color={colors.warning} />
                        <Text style={[styles.badgeText, { color: colors.warning }]}>Reminders & widget</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <Tap onPress={() => onEdit(cal)} accessibilityLabel={`Edit ${cal.name}`} style={[styles.editBtn, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.textSecondary} />
              </Tap>
            </Tap>
          );
        })}
        <SettingsRow icon="plus" title="Add calendar" subtitle="Track a team rotation or someone else’s shifts" colors={colors} onPress={onNew} chevron={false} />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 12, paddingVertical: 12, minHeight: 58 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  editBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
