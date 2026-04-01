import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  textColor: string;
}

export const MonthHeader = React.memo(function MonthHeader({ currentDate, onPrev, onNext, textColor }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrev}
        style={styles.arrow}
        activeOpacity={0.5}
        accessibilityLabel="Previous month"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="chevron-left" size={26} color={textColor} />
      </TouchableOpacity>
      <View style={styles.center} accessibilityLabel={format(currentDate, 'MMMM yyyy')} accessibilityRole="header">
        <Text style={[styles.month, { color: textColor }]}>
          {format(currentDate, 'MMMM')}
        </Text>
        <Text style={[styles.year, { color: textColor + '70' }]}>
          {format(currentDate, 'yyyy')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onNext}
        style={styles.arrow}
        activeOpacity={0.5}
        accessibilityLabel="Next month"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="chevron-right" size={26} color={textColor} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  arrow: {
    padding: 10,
    borderRadius: 10,
  },
  center: {
    alignItems: 'center',
  },
  month: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  year: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -1,
  },
});
