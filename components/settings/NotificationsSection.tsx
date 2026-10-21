import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { CalendarInfo } from '../../hooks/useShiftData';
import { TimeFormat, formatHourOfDay, formatMinutesAsDuration } from '../../utils/time';
import { Chip, SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

const REMINDER_HOURS = [17, 18, 19, 20, 21, 22, 23];
const ALARM_LEADS = [15, 30, 45, 60, 90, 120];

interface Props {
  colors: ThemeColors;
  timeFormat: TimeFormat;
  remindersEnabled: boolean;
  onToggleReminders: (value: boolean) => void;
  reminderHour: number;
  onReminderHour: (hour: number) => void;
  alarmEnabled: boolean;
  onToggleAlarm: (value: boolean) => void;
  alarmLead: number;
  onAlarmLead: (minutes: number) => void;
  calendars: CalendarInfo[];
  primaryCalendarId: string;
  onPrimaryCalendar: (id: string) => void;
  onTest: () => void;
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {children}
    </ScrollView>
  );
}

export function NotificationsSection(props: Props) {
  const { colors } = props;
  return (
    <>
      <SectionLabel colors={colors}>Reminders</SectionLabel>
      <SettingsCard colors={colors}>
        <SettingsRow
          icon="bell-ring-outline"
          title="Evening reminder"
          subtitle="A heads-up the evening before each shift or leave day"
          colors={colors}
          switchValue={props.remindersEnabled}
          onSwitch={props.onToggleReminders}
        />
        {props.remindersEnabled && (
          <View style={styles.sub}>
            <ChipRow>
              {REMINDER_HOURS.map((h) => (
                <Chip
                  key={h}
                  label={formatHourOfDay(h, props.timeFormat)}
                  selected={props.reminderHour === h}
                  onPress={() => props.onReminderHour(h)}
                  colors={colors}
                  compact
                />
              ))}
            </ChipRow>
          </View>
        )}
        <SettingsRow
          icon="alarm"
          iconColor={colors.danger}
          title="Pre-shift alarm"
          subtitle="Loud alarm before your shift starts, even in Do Not Disturb"
          colors={colors}
          switchValue={props.alarmEnabled}
          onSwitch={props.onToggleAlarm}
        />
        {props.alarmEnabled && (
          <View style={styles.sub}>
            <ChipRow>
              {ALARM_LEADS.map((m) => (
                <Chip
                  key={m}
                  label={`${formatMinutesAsDuration(m).replace(' hours', 'h').replace(' hour', 'h')} before`}
                  selected={props.alarmLead === m}
                  onPress={() => props.onAlarmLead(m)}
                  colors={colors}
                  color={colors.danger}
                  compact
                />
              ))}
            </ChipRow>
          </View>
        )}
        {props.calendars.length > 1 && (props.remindersEnabled || props.alarmEnabled) && (
          <View style={styles.sub}>
            <SettingsRow icon="calendar-account" title="Remind me about" subtitle="Also used by the home-screen widget" colors={colors} style={styles.subRow} />
            <ChipRow>
              {props.calendars.map((c) => (
                <Chip key={c.id} label={c.name} color={c.color} selected={props.primaryCalendarId === c.id} onPress={() => props.onPrimaryCalendar(c.id)} colors={colors} compact />
              ))}
            </ChipRow>
          </View>
        )}
        {(props.remindersEnabled || props.alarmEnabled) && (
          <SettingsRow icon="send-outline" title="Send a test notification" subtitle="Arrives in about 5 seconds" colors={colors} onPress={props.onTest} />
        )}
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  sub: { paddingBottom: 12 },
  subRow: { paddingBottom: 6 },
  chips: { paddingHorizontal: 14, gap: 8 },
});
