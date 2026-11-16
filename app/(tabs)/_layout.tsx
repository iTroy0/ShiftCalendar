import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../../hooks/SettingsContext';
import { haptic } from '../../utils/haptics';
import { t } from '../../i18n';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />
  );
}

export default function TabLayout() {
  const { colors } = useAppSettings();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.selection() }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        // Each tab item adds 5px padding around a 28px icon and the label, so leave ~56px of content.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 2,
          paddingTop: 2,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('Calendar'),
          tabBarIcon: tabIcon('calendar-month', 'calendar-month-outline'),
          tabBarAccessibilityLabel: t('Calendar tab'),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('Stats'),
          tabBarIcon: tabIcon('chart-box', 'chart-box-outline'),
          tabBarAccessibilityLabel: t('Statistics tab'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('Settings'),
          tabBarIcon: tabIcon('cog', 'cog-outline'),
          tabBarAccessibilityLabel: t('Settings tab'),
        }}
      />
    </Tabs>
  );
}
