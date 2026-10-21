import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { Radius, Type } from '../../constants/theme';
import { Tap } from './Tap';

export function useSheetChrome(colors: ThemeColors) {
  return useMemo(
    () => ({
      backgroundStyle: {
        backgroundColor: colors.surfaceElevated,
        borderTopLeftRadius: Radius.sheet,
        borderTopRightRadius: Radius.sheet,
      },
      handleIndicatorStyle: { backgroundColor: colors.borderStrong, width: 40, height: 5 },
    }),
    [colors]
  );
}

/** Backdrop that dims the screen from `appearsOnIndex` and closes the sheet when tapped. */
export function useSheetBackdrop(appearsOnIndex = 0) {
  return useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={appearsOnIndex}
        disappearsOnIndex={appearsOnIndex - 1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [appearsOnIndex]
  );
}

export function SheetHeader({
  title,
  subtitle,
  colors,
  onClose,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  colors: ThemeColors;
  onClose?: () => void;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Tap onPress={onBack} accessibilityLabel="Back" style={[styles.headerBtn, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </Tap>
      )}
      <View style={styles.headerText}>
        <Text style={[Type.title, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onClose && (
        <Tap onPress={onClose} accessibilityLabel="Close" style={[styles.headerBtn, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="close" size={20} color={colors.text} />
        </Tap>
      )}
    </View>
  );
}

/** Summary + "Options" + primary action, sized to stay visible when a sheet is collapsed. */
export function SheetActionBar({
  summary,
  actionLabel,
  onAction,
  onOptions,
  disabled,
  colors,
}: {
  summary: string;
  actionLabel: string;
  onAction: () => void;
  onOptions?: () => void;
  disabled?: boolean;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.actionBar}>
      <Text style={[styles.actionSummary, { color: colors.textSecondary }]} numberOfLines={2}>
        {summary}
      </Text>
      {onOptions && (
        <Tap onPress={onOptions} accessibilityLabel="Show options" style={[styles.optionsBtn, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="tune-variant" size={18} color={colors.text} />
        </Tap>
      )}
      <Tap
        onPress={onAction}
        disabled={disabled}
        accessibilityLabel={actionLabel}
        style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: disabled ? 0.45 : 1 }]}
      >
        <MaterialCommunityIcons name="check" size={18} color={colors.onPrimary} />
        <Text style={[styles.actionText, { color: colors.onPrimary }]}>{actionLabel}</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 14 },
  actionSummary: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  optionsBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 42, borderRadius: 12 },
  actionText: { fontSize: 14, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerText: { flex: 1 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
