import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType } from '../../constants/shifts';
import { scheduleShiftReminder } from '../../utils/notifications';

type Props = {
  colors: any;
  notificationsEnabled: boolean;
  onToggleNotifications: (v: boolean) => void;
  notificationHour: number;
  setNotificationHour: (h: number) => void;
  shiftData: Record<string, string>;
  allShifts: ShiftType[];
  notifHours: number[];
};

export function NotificationsSection({
  colors,
  notificationsEnabled,
  onToggleNotifications,
  notificationHour,
  setNotificationHour,
  shiftData,
  allShifts,
  notifHours,
}: Props) {
  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.notifRow}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={notificationsEnabled ? colors.primary : colors.textSecondary} />
          <View style={styles.notifInfo}>
            <Text style={[styles.notifLabel, { color: colors.text }]}>Shift Reminders</Text>
            <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
              Get notified the evening before your shift
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={notificationsEnabled ? colors.primary : colors.textSecondary}
          />
        </View>
        {notificationsEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 10 }]} />
            <Text style={[styles.notifTimeLabel, { color: colors.textSecondary }]}>Reminder Time</Text>
            <View style={styles.notifTimeRow}>
              {notifHours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.notifTimeChip,
                    {
                      backgroundColor: notificationHour === h ? colors.primary : colors.surfaceVariant,
                      borderColor: notificationHour === h ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setNotificationHour(h);
                    scheduleShiftReminder(shiftData, allShifts, h).catch(console.error);
                  }}
                >
                  <Text style={[styles.notifTimeText, { color: notificationHour === h ? '#FFF' : colors.text }]}>
                    {h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  divider: { height: 1 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifInfo: { flex: 1 },
  notifLabel: { fontSize: 15, fontWeight: '600' },
  notifDesc: { fontSize: 12, marginTop: 1 },
  notifTimeLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  notifTimeRow: { flexDirection: 'row', gap: 6 },
  notifTimeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  notifTimeText: { fontSize: 13, fontWeight: '700' },
});
