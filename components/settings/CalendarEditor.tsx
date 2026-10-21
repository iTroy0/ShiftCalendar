import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../../hooks/SettingsContext';
import { CalendarInfo } from '../../hooks/useShiftData';
import { AVAILABLE_COLORS } from '../../constants/shifts';
import { readableTextColor } from '../../utils/color';
import { haptic } from '../../utils/haptics';
import { Tap } from '../ui/Tap';
import { Button, SectionLabel } from '../ui/primitives';
import { SheetHeader, useSheetBackdrop, useSheetChrome } from '../ui/sheet';

interface Props {
  calendar: CalendarInfo | null; // null = new calendar
  usedColors: string[];
  onSave: (name: string, color: string) => void;
  onDelete: (calendar: CalendarInfo) => void;
  onDismiss: () => void;
}

function Content({ calendar, usedColors, onSave, onDelete, close }: Omit<Props, 'onDismiss'> & { close: () => void }) {
  const { colors } = useAppSettings();
  const [name, setName] = useState(calendar?.name ?? '');
  const [color, setColor] = useState(calendar?.color ?? AVAILABLE_COLORS.find((c) => !usedColors.includes(c)) ?? AVAILABLE_COLORS[0]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Name needed', 'Give the calendar a name, like “Team B” or “Partner”.');
      return;
    }
    haptic.success();
    onSave(name.trim(), color);
    close();
  };

  return (
    <View>
      <SheetHeader
        title={calendar ? 'Edit calendar' : 'New calendar'}
        subtitle={calendar ? undefined : 'Keep a separate schedule — a team rotation, a partner, a second job.'}
        colors={colors}
        onClose={close}
      />
      <SectionLabel colors={colors} style={styles.firstLabel}>Name</SectionLabel>
      <BottomSheetTextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Team B"
        placeholderTextColor={colors.textMuted}
        maxLength={30}
        autoFocus={!calendar}
        accessibilityLabel="Calendar name"
        style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
      />
      <SectionLabel colors={colors}>Color</SectionLabel>
      <View style={styles.swatches}>
        {AVAILABLE_COLORS.map((c) => {
          const selected = c === color;
          return (
            <Tap
              key={c}
              onPress={() => {
                haptic.selection();
                setColor(c);
              }}
              accessibilityLabel={`Color ${c}`}
              accessibilityState={{ selected }}
              style={[styles.swatchRing, { borderColor: selected ? colors.text : 'transparent' }]}
            >
              <View style={[styles.swatch, { backgroundColor: c }]}>
                {selected && <MaterialCommunityIcons name="check" size={18} color={readableTextColor(c)} />}
              </View>
            </Tap>
          );
        })}
      </View>
      <Button label={calendar ? 'Save' : 'Create calendar'} icon="check" onPress={save} colors={colors} style={styles.saveBtn} />
      {calendar && calendar.id !== 'default' && (
        <Button
          label="Delete calendar"
          icon="delete-outline"
          variant="danger"
          onPress={() => {
            onDelete(calendar);
            close();
          }}
          colors={colors}
          style={styles.deleteBtn}
        />
      )}
    </View>
  );
}

export const CalendarEditor = forwardRef<BottomSheetModal, Props>(function CalendarEditor(props, ref) {
  const { colors } = useAppSettings();
  const chrome = useSheetChrome(colors);
  const backdrop = useSheetBackdrop(0);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%'], []);
  const close = useCallback(() => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  }, [ref]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={props.onDismiss}
      backdropComponent={backdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      {...chrome}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Content key={props.calendar?.id ?? 'new'} {...props} close={close} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4 },
  firstLabel: { marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 16, fontWeight: '600' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchRing: { padding: 2, borderRadius: 14, borderWidth: 2 },
  swatch: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginTop: 24 },
  deleteBtn: { marginTop: 10 },
});
