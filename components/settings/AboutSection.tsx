import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ThemeColors } from '../../constants/colors';
import { Tap } from '../ui/Tap';
import { SectionLabel } from '../ui/primitives';
import { SettingsCard, SettingsRow } from './SettingsRow';

interface Props {
  colors: ThemeColors;
  showPrivacy: boolean;
  setShowPrivacy: (v: boolean) => void;
}

const PRIVACY: { title: string; body: string }[] = [
  { title: 'Data storage', body: 'Everything you enter — shifts, notes, overtime, calendars and settings — is stored only on this device. Nothing is sent to a server.' },
  { title: 'No account required', body: 'ShiftCalendar never asks you to sign up, sign in, or share personal information.' },
  { title: 'No tracking', body: 'There are no analytics, ads, or third-party tracking services in the app.' },
  { title: 'Notifications', body: 'Reminders and alarms are scheduled locally on your device. No notification data leaves it.' },
  { title: 'Export & backup', body: 'Exports and backups are files you create and choose where to save or share. They are never uploaded by the app.' },
  { title: 'Children', body: 'ShiftCalendar does not knowingly collect information from anyone, including children under 13.' },
  { title: 'Changes', body: 'If this policy changes, the updated version will appear here in the app.' },
];

export function AboutSection({ colors, showPrivacy, setShowPrivacy }: Props) {
  const version = Constants.expoConfig?.version ?? '';
  return (
    <>
      <SectionLabel colors={colors}>About</SectionLabel>
      <SettingsCard colors={colors}>
        <View style={styles.appRow}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="calendar-month" size={26} color={colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.appName, { color: colors.text }]}>ShiftCalendar</Text>
            <Text style={[styles.appMeta, { color: colors.textSecondary }]}>{version ? `Version ${version} · ` : ''}Offline & private</Text>
          </View>
        </View>
        <SettingsRow icon="shield-account" title="Privacy policy" colors={colors} onPress={() => setShowPrivacy(true)} />
        <SettingsRow
          icon="coffee"
          iconColor={colors.warning}
          title="Buy me a coffee"
          subtitle="Enjoying ShiftCalendar? Support its development"
          colors={colors}
          onPress={() => Linking.openURL('https://buymeacoffee.com/itroy0').catch(() => {})}
        />
      </SettingsCard>
      <View style={styles.madeBy}>
        <MaterialCommunityIcons name="heart" size={14} color={colors.danger} />
        <Text style={[styles.madeByText, { color: colors.textMuted }]}>Made by Troy</Text>
      </View>

      <Modal visible={showPrivacy} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPrivacy(false)}>
        <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy policy</Text>
            <Tap onPress={() => setShowPrivacy(false)} accessibilityLabel="Close" style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text} />
            </Tap>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.updated, { color: colors.textMuted }]}>Last updated October 2026</Text>
            <Text style={[styles.body, { color: colors.text }]}>
              ShiftCalendar is built to keep your schedule private. Here is how the app handles your information.
            </Text>
            {PRIVACY.map((p) => (
              <View key={p.title}>
                <Text style={[styles.policyTitle, { color: colors.text }]}>{p.title}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{p.body}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 17, fontWeight: '800' },
  appMeta: { fontSize: 13, marginTop: 2 },
  madeBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  madeByText: { fontSize: 13, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalContent: { padding: 20, paddingBottom: 48, gap: 6 },
  updated: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  policyTitle: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  body: { fontSize: 14.5, lineHeight: 22 },
});
