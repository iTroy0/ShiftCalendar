import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

type Props = {
  colors: any;
  showPrivacy: boolean;
  setShowPrivacy: (v: boolean) => void;
};

export function AboutSection({ colors, showPrivacy, setShowPrivacy }: Props) {
  return (
    <>
      {/* Data Management */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.dangerRow}
          onPress={() => {
            Alert.alert(
              'Reset All Data',
              'This will permanently delete all shifts, notes, overtime, and custom calendars. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Everything',
                  style: 'destructive',
                  onPress: async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    await AsyncStorage.clear();
                    Alert.alert('Done', 'All data has been reset. Please restart the app.');
                  },
                },
              ]
            );
          }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="delete-sweep-outline" size={20} color="#EF4444" />
          <Text style={styles.dangerRowText}>Reset All Data</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Support */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT</Text>
      <TouchableOpacity
        style={[styles.coffeeCard, { backgroundColor: '#FFDD0020', borderColor: '#FFDD0050' }]}
        onPress={() => Linking.openURL('https://buymeacoffee.com/itroy0')}
        activeOpacity={0.7}
      >
        <View style={styles.coffeeIconWrap}>
          <MaterialCommunityIcons name="coffee" size={28} color="#FFDD00" />
        </View>
        <View style={styles.coffeeInfo}>
          <Text style={[styles.coffeeTitle, { color: colors.text }]}>Buy Me a Coffee</Text>
          <Text style={[styles.coffeeDesc, { color: colors.textSecondary }]}>
            If you enjoy ShiftCalendar, consider supporting its development!
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* About */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.text }]}>App Name</Text>
          <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>ShiftCalendar</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.text }]}>Version</Text>
          <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>2.4.1</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.text }]}>Developer</Text>
          <Text style={[styles.aboutValue, { color: colors.primary }]}>Troy</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          style={styles.aboutRow}
          onPress={() => setShowPrivacy(true)}
          activeOpacity={0.6}
        >
          <Text style={[styles.aboutLabel, { color: colors.text }]}>Privacy Policy</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.madeBy}>
          <MaterialCommunityIcons name="heart" size={16} color={colors.primary} />
          <Text style={[styles.madeByText, { color: colors.textSecondary }]}>Made by Troy</Text>
        </View>
      </View>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.privacyHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.privacyTitle, { color: colors.text }]}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)} style={styles.privacyClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.privacyContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.privacyUpdated, { color: colors.textSecondary }]}>
              Last updated: March 2026
            </Text>

            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar is committed to protecting your privacy. This policy explains how the app handles your information.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Data Storage</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              All your data — including shifts, notes, overtime records, calendars, and settings — is stored locally on your device using secure on-device storage. No data is transmitted to external servers.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>No Account Required</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not require you to create an account, sign in, or provide any personal information to use the app.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>No Data Collection</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              We do not collect, store, or share any personal data, analytics, usage statistics, or telemetry. The app operates entirely offline.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Notifications</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              If you enable shift reminders, notifications are scheduled locally on your device. No notification data is sent to any server.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Export & Backup</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              When you export data (CSV, PDF) or create backups, files are saved directly to your device. These files are not uploaded to any external service unless you choose to share them yourself.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Third-Party Services</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not integrate with any third-party analytics, advertising, or tracking services.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Children's Privacy</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              ShiftCalendar does not knowingly collect information from children under 13.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Changes to This Policy</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              We may update this privacy policy from time to time. Any changes will be reflected within the app.
            </Text>

            <Text style={[styles.privacySectionTitle, { color: colors.text }]}>Contact</Text>
            <Text style={[styles.privacyBody, { color: colors.text }]}>
              If you have questions about this policy, you can reach the developer through the app's support channels.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  divider: { height: 1 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  dangerRowText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#EF4444' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  aboutLabel: { fontSize: 15, fontWeight: '600' },
  aboutValue: { fontSize: 15 },
  madeBy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 6 },
  madeByText: { fontSize: 14, fontWeight: '600' },
  coffeeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  coffeeIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFDD0020', alignItems: 'center', justifyContent: 'center' },
  coffeeInfo: { flex: 1 },
  coffeeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  coffeeDesc: { fontSize: 13, lineHeight: 18 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  privacyTitle: { fontSize: 20, fontWeight: '800' },
  privacyClose: { padding: 4 },
  privacyContent: { padding: 20 },
  privacyUpdated: { fontSize: 13, fontWeight: '600', marginBottom: 16 },
  privacySectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 6 },
  privacyBody: { fontSize: 14, lineHeight: 22 },
});
