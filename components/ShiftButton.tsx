import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShiftType } from '../constants/shifts';

interface Props {
  shift: ShiftType;
  selected?: boolean;
  onPress: () => void;
}

export const ShiftButton = React.memo(function ShiftButton({ shift, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: selected ? shift.color : shift.color + '12',
          borderColor: selected ? shift.color : shift.color + '30',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.codeBadge, { backgroundColor: selected ? '#FFFFFF25' : shift.color + '20' }]}>
        <Text style={[styles.codeText, { color: selected ? '#FFF' : shift.color }]}>
          {shift.code}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={shift.icon as any}
        size={20}
        color={selected ? '#FFFFFF' : shift.color}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: selected ? '#FFFFFF' : shift.color }]}>
          {shift.label}
        </Text>
        <Text style={[styles.time, { color: selected ? '#FFFFFFAA' : shift.color + '80' }]}>
          {shift.startTime ? `${shift.startTime} – ${shift.endTime}` : 'Day Off'}
        </Text>
      </View>
      {selected && (
        <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFFCC" />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  codeBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginTop: 1,
  },
});
