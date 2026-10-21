import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/SettingsContext';
import { ShiftType, AVAILABLE_COLORS, AVAILABLE_ICONS, getShiftMinutes } from '../constants/shifts';
import { formatHours, formatTimeRange, parseHHMM } from '../utils/time';
import { readableTextColor, withAlpha } from '../utils/color';
import { haptic } from '../utils/haptics';
import { TimePicker } from './TimePicker';
import { Tap } from './ui/Tap';
import { Button, Segmented, SectionLabel } from './ui/primitives';
import { SheetHeader, useSheetBackdrop, useSheetChrome } from './ui/sheet';

interface Props {
  editingShift: ShiftType | null; // null = creating new
  existingCodes: string[];
  canDelete: boolean;
  onSave: (shift: ShiftType) => void;
  onDelete: (code: string) => void;
  onDismiss: () => void;
}

function EditorContent({ editingShift, existingCodes, canDelete, onSave, onDelete, close }: Omit<Props, 'onDismiss'> & { close: () => void }) {
  const { colors, timeFormat } = useAppSettings();
  const isEditing = editingShift !== null;
  const wasWorking = !editingShift || (!!parseHHMM(editingShift.startTime) && !!parseHHMM(editingShift.endTime));

  const [label, setLabel] = useState(editingShift?.label ?? '');
  const [code, setCode] = useState(editingShift?.code ?? '');
  const [codeTouched, setCodeTouched] = useState(isEditing);
  const [kind, setKind] = useState<'work' | 'off'>(wasWorking ? 'work' : 'off');
  const [startTime, setStartTime] = useState(editingShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(editingShift?.endTime || '17:00');
  const [color, setColor] = useState(editingShift?.color ?? AVAILABLE_COLORS[existingCodes.length % AVAILABLE_COLORS.length]);
  const [icon, setIcon] = useState(editingShift?.icon ?? (wasWorking ? 'briefcase' : 'home-variant'));

  const working = kind === 'work';
  const preview: ShiftType = {
    code: code.trim().toUpperCase() || '?',
    label: label.trim() || 'New shift',
    color,
    icon,
    startTime: working ? startTime : '',
    endTime: working ? endTime : '',
    isDefault: editingShift?.isDefault ?? false,
  };
  const minutes = working ? getShiftMinutes(preview) : 0;
  const overnight = working && (parseHHMM(endTime)![0] * 60 + parseHHMM(endTime)![1]) <= (parseHHMM(startTime)![0] * 60 + parseHHMM(startTime)![1]);
  const fg = readableTextColor(color);

  const onLabelChange = (text: string) => {
    setLabel(text);
    // Suggest a code from the name until the user edits the code themselves.
    if (!codeTouched) {
      const suggestion = text.trim().split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
      setCode(suggestion);
    }
  };

  const save = () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!label.trim()) {
      Alert.alert('Name needed', 'Give this shift a name, like “Evening” or “Long day”.');
      return;
    }
    if (!trimmedCode) {
      Alert.alert('Code needed', 'Add a short code (1–3 characters) — it’s what you see on the calendar.');
      return;
    }
    const taken = existingCodes.some((c) => c.toUpperCase() === trimmedCode && c !== editingShift?.code);
    if (taken) {
      Alert.alert('Code already used', `Another shift already uses “${trimmedCode}”. Pick a different code.`);
      return;
    }
    haptic.success();
    onSave({ ...preview, code: trimmedCode, label: label.trim() });
    close();
  };

  const confirmDelete = () => {
    if (!editingShift) return;
    Alert.alert('Delete shift?', `“${editingShift.label}” will be removed from every calendar it’s used in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptic.heavy();
          onDelete(editingShift.code);
          close();
        },
      },
    ]);
  };

  return (
    <View>
      <SheetHeader title={isEditing ? 'Edit shift' : 'New shift'} colors={colors} onClose={close} />

      <View style={[styles.preview, { backgroundColor: withAlpha(color, 0.12), borderColor: withAlpha(color, 0.35) }]}>
        <View style={[styles.previewBadge, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={fg} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.previewLabel, { color: colors.text }]} numberOfLines={1}>
            {preview.label}
          </Text>
          <Text style={[styles.previewTime, { color: colors.textSecondary }]}>
            {working ? `${formatTimeRange(startTime, endTime, timeFormat)} · ${formatHours(minutes / 60)}${overnight ? ' · overnight' : ''}` : 'Day off · no hours'}
          </Text>
        </View>
        <View style={[styles.previewPill, { backgroundColor: color }]}>
          <Text style={[styles.previewPillText, { color: fg }]}>{preview.code}</Text>
        </View>
      </View>

      <View style={styles.fieldsRow}>
        <View style={styles.nameField}>
          <SectionLabel colors={colors} style={styles.fieldLabel}>Name</SectionLabel>
          <BottomSheetTextInput
            value={label}
            onChangeText={onLabelChange}
            placeholder="e.g. Evening"
            placeholderTextColor={colors.textMuted}
            maxLength={24}
            accessibilityLabel="Shift name"
            style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
          />
        </View>
        <View style={styles.codeField}>
          <SectionLabel colors={colors} style={styles.fieldLabel}>Code</SectionLabel>
          <BottomSheetTextInput
            value={code}
            onChangeText={(t) => {
              setCodeTouched(true);
              setCode(t.replace(/\s/g, '').toUpperCase().slice(0, 3));
            }}
            placeholder="EV"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={3}
            accessibilityLabel="Shift code, up to 3 characters"
            style={[styles.input, styles.codeInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
          />
        </View>
      </View>

      <SectionLabel colors={colors}>Type</SectionLabel>
      <Segmented
        options={[
          { value: 'work', label: 'Working shift', icon: 'briefcase-outline' },
          { value: 'off', label: 'Day off', icon: 'home-outline' },
        ]}
        value={kind}
        onChange={(v) => {
          haptic.selection();
          setKind(v as 'work' | 'off');
        }}
        colors={colors}
      />

      {working && (
        <View style={styles.timeRow}>
          <TimePicker label="Starts" value={startTime} onChange={setStartTime} accentColor={color} timeFormat={timeFormat} colors={colors} />
          <TimePicker label="Ends" value={endTime} onChange={setEndTime} accentColor={color} timeFormat={timeFormat} colors={colors} />
        </View>
      )}

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

      <SectionLabel colors={colors}>Icon</SectionLabel>
      <View style={styles.icons}>
        {AVAILABLE_ICONS.map((ic) => {
          const selected = ic === icon;
          return (
            <Tap
              key={ic}
              onPress={() => {
                haptic.selection();
                setIcon(ic);
              }}
              accessibilityLabel={`Icon ${ic.replace(/-/g, ' ')}`}
              accessibilityState={{ selected }}
              style={[
                styles.iconCell,
                { backgroundColor: selected ? color : colors.surfaceVariant, borderColor: selected ? color : colors.border },
              ]}
            >
              <MaterialCommunityIcons name={ic as any} size={22} color={selected ? fg : colors.textSecondary} />
            </Tap>
          );
        })}
      </View>

      <Button label={isEditing ? 'Save changes' : 'Create shift'} icon="check" onPress={save} colors={colors} style={styles.saveBtn} />
      {isEditing && canDelete && (
        <Button label="Delete shift" icon="delete-outline" variant="danger" onPress={confirmDelete} colors={colors} style={styles.deleteBtn} />
      )}
    </View>
  );
}

export const ShiftEditor = forwardRef<BottomSheetModal, Props>(function ShiftEditor(props, ref) {
  const { colors } = useAppSettings();
  const chrome = useSheetChrome(colors);
  const backdrop = useSheetBackdrop(0);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['92%'], []);
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
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <EditorContent key={props.editingShift?.code ?? 'new'} {...props} close={close} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1 },
  previewBadge: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { fontSize: 17, fontWeight: '800' },
  previewTime: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  previewPill: { minWidth: 36, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  previewPillText: { fontSize: 13, fontWeight: '800' },
  fieldsRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  codeField: { width: 92 },
  fieldLabel: { marginTop: 18 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 16, fontWeight: '600' },
  codeInput: { textAlign: 'center', fontWeight: '800', letterSpacing: 1 },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchRing: { padding: 2, borderRadius: 14, borderWidth: 2 },
  swatch: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginTop: 24 },
  deleteBtn: { marginTop: 10 },
});
