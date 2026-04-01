import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShiftType, AVAILABLE_COLORS, AVAILABLE_ICONS } from '../constants/shifts';
import { TimePicker } from './TimePicker';

interface Props {
  editingShift: ShiftType | null; // null = creating new
  existingCodes: string[];
  onSave: (shift: ShiftType) => void;
  onDelete?: (code: string) => void;
  onClose: () => void;
  colors: {
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    background: string;
    primary: string;
  };
}

export const ShiftEditor = forwardRef<BottomSheet, Props>(
  ({ editingShift, existingCodes, onSave, onDelete, onClose, colors }, ref) => {
    const snapPoints = useMemo(() => ['85%'], []);
    const isEditing = editingShift !== null;

    const [code, setCode] = useState(editingShift?.code || '');
    const [label, setLabel] = useState(editingShift?.label || '');
    const [color, setColor] = useState(editingShift?.color || AVAILABLE_COLORS[0]);
    const [icon, setIcon] = useState(editingShift?.icon || AVAILABLE_ICONS[0]);
    const [startTime, setStartTime] = useState(editingShift?.startTime || '');
    const [endTime, setEndTime] = useState(editingShift?.endTime || '');

    useEffect(() => {
      setCode(editingShift?.code || '');
      setLabel(editingShift?.label || '');
      setColor(editingShift?.color || AVAILABLE_COLORS[0]);
      setIcon(editingShift?.icon || AVAILABLE_ICONS[0]);
      setStartTime(editingShift?.startTime || '');
      setEndTime(editingShift?.endTime || '');
    }, [editingShift]);

    const handleSave = () => {
      if (!code.trim()) {
        Alert.alert('Error', 'Shift code is required (1-3 characters)');
        return;
      }
      if (code.trim().length > 3) {
        Alert.alert('Error', 'Shift code must be 1-3 characters');
        return;
      }
      if (!label.trim()) {
        Alert.alert('Error', 'Shift label is required');
        return;
      }
      const trimmedCode = code.trim().toUpperCase();
      const isDuplicate = existingCodes.includes(trimmedCode);
      const isOwnCode = isEditing && editingShift?.code === trimmedCode;
      if (isDuplicate && !isOwnCode) {
        Alert.alert('Error', 'This shift code already exists');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave({
        code: code.trim().toUpperCase(),
        label: label.trim(),
        color,
        icon,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        isDefault: false,
      });
    };

    const handleDelete = () => {
      if (!onDelete || !editingShift) return;
      Alert.alert(
        'Delete Shift',
        `Delete "${editingShift.label}"? All assignments will be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onDelete(editingShift.code);
            },
          },
        ]
      );
    };

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary, width: 40 }}
      >
        <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? 'Edit Shift' : 'New Shift'}
          </Text>

          {/* Code */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CODE</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().slice(0, 3))}
            placeholder="e.g. E"
            placeholderTextColor={colors.textSecondary}
            maxLength={3}
            autoCapitalize="characters"
          />

          {/* Label */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>LABEL</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Evening"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Times */}
          <View style={styles.timeRow}>
            <TimePicker
              label="START TIME"
              value={startTime || '00:00'}
              onChange={setStartTime}
              accentColor={color}
              colors={colors}
            />
            <TimePicker
              label="END TIME"
              value={endTime || '00:00'}
              onChange={setEndTime}
              accentColor={color}
              colors={colors}
            />
          </View>

          {/* Color picker */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>COLOR</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c, borderColor: color === c ? '#FFF' : 'transparent' },
                ]}
                onPress={() => setColor(c)}
                accessibilityLabel={`Color ${c}${color === c ? ', selected' : ''}`}
                accessibilityRole="button"
              >
                {color === c && (
                  <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon picker */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ICON</Text>
          <View style={styles.iconGrid}>
            {AVAILABLE_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[
                  styles.iconSwatch,
                  {
                    backgroundColor: icon === ic ? color + '30' : colors.surfaceVariant,
                    borderColor: icon === ic ? color : colors.border,
                  },
                ]}
                onPress={() => setIcon(ic)}
                accessibilityLabel={`Icon ${ic}${icon === ic ? ', selected' : ''}`}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name={ic as any}
                  size={22}
                  color={icon === ic ? color : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PREVIEW</Text>
          <View style={[styles.preview, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <View style={[styles.previewBadge, { backgroundColor: color }]}>
              <Text style={styles.previewBadgeText}>{code || '?'}</Text>
            </View>
            <MaterialCommunityIcons name={icon as any} size={24} color={color} />
            <Text style={[styles.previewLabel, { color }]}>{label || 'Shift Name'}</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} accessibilityLabel="Save shift" accessibilityRole="button">
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Create Shift'}</Text>
          </TouchableOpacity>

          {isEditing && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} accessibilityLabel="Delete shift" accessibilityRole="button">
              <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete Shift</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconSwatch: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  previewBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    gap: 6,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
