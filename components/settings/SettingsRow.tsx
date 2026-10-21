import React from 'react';
import { View, Text, StyleSheet, Switch, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface RowProps {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  colors: ThemeColors;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitch?: (value: boolean) => void;
  destructive?: boolean;
  right?: React.ReactNode;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** One settings line: icon, title/subtitle and a trailing value, switch, or chevron. */
export function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  colors,
  onPress,
  switchValue,
  onSwitch,
  destructive,
  right,
  chevron,
  style,
}: RowProps) {
  const tint = destructive ? colors.danger : iconColor ?? colors.primaryText;
  const content = (
    <>
      {icon && (
        <View style={[styles.icon, { backgroundColor: withAlpha(tint, 0.14) }]}>
          <MaterialCommunityIcons name={icon} size={18} color={tint} />
        </View>
      )}
      <View style={styles.text}>
        <Text style={[styles.title, { color: destructive ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {value ? (
        <Text style={[styles.value, { color: colors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {onSwitch && (
        <Switch
          value={!!switchValue}
          onValueChange={onSwitch}
          trackColor={{ false: colors.borderStrong, true: withAlpha(colors.primary, 0.55) }}
          thumbColor={switchValue ? colors.primary : colors.surfaceVariant}
          ios_backgroundColor={colors.borderStrong}
          accessibilityLabel={title}
        />
      )}
      {(chevron ?? (!!onPress && !onSwitch)) && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />}
    </>
  );

  if (onPress) {
    return (
      <Tap onPress={onPress} activeOpacity={0.6} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title} style={[styles.row, style]}>
        {content}
      </Tap>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

export function SettingsCard({ children, colors }: { children: React.ReactNode; colors: ThemeColors }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  value: { fontSize: 14, fontWeight: '600', maxWidth: 150 },
});
