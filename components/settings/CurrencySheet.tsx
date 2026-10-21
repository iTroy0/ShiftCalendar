import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../../hooks/SettingsContext';
import { CURRENCIES, Currency } from '../../constants/currencies';
import { withAlpha } from '../../utils/color';
import { haptic } from '../../utils/haptics';
import { Tap } from '../ui/Tap';
import { SheetHeader, useSheetBackdrop, useSheetChrome } from '../ui/sheet';

interface Props {
  value: string;
  onSelect: (code: string) => void;
}

export const CurrencySheet = forwardRef<BottomSheetModal, Props>(function CurrencySheet({ value, onSelect }, ref) {
  const { colors } = useAppSettings();
  const chrome = useSheetChrome(colors);
  const backdrop = useSheetBackdrop(0);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['80%'], []);
  const [query, setQuery] = useState('');

  const close = useCallback(() => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  }, [ref]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CURRENCIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : CURRENCIES;
  }, [query]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={backdrop}
      keyboardBehavior="extend"
      android_keyboardInputMode="adjustResize"
      onDismiss={() => setQuery('')}
      {...chrome}
    >
      <View style={styles.top}>
        <SheetHeader title="Currency" colors={colors} onClose={close} />
        <View style={[styles.search, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <BottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search currencies"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            accessibilityLabel="Search currencies"
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>
      <BottomSheetFlatList
        data={list}
        keyExtractor={(c: Currency) => c.code}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }: { item: Currency }) => {
          const selected = item.code === value;
          return (
            <Tap
              onPress={() => {
                haptic.selection();
                onSelect(item.code);
                close();
              }}
              accessibilityLabel={`${item.name}, ${item.code}`}
              accessibilityState={{ selected }}
              style={[styles.row, selected && { backgroundColor: withAlpha(colors.primary, 0.1) }]}
            >
              <View style={[styles.symbol, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.symbolText, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {item.symbol}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.code, { color: colors.textSecondary }]}>{item.code}</Text>
              </View>
              {selected && <MaterialCommunityIcons name="check-circle" size={22} color={colors.primaryText} />}
            </Tap>
          );
        }}
      />
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14 },
  symbol: { width: 44, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  symbolText: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '600' },
  code: { fontSize: 12, fontWeight: '600', marginTop: 1 },
});
