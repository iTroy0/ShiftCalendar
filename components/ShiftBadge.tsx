import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShiftType } from '../constants/shifts';

interface Props {
  shift: ShiftType;
  size?: number;
}

export const ShiftBadge = React.memo(function ShiftBadge({ shift, size = 28 }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: shift.color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.45 }]}>{shift.code}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
