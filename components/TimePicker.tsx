import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { TimeFormat, formatTime, parseHHMM, toHHMM } from '../utils/time';
import { withAlpha } from '../utils/color';
import { haptic } from '../utils/haptics';

interface Props {
  label: string;
  value: string; // 'HH:MM'
  onChange: (value: string) => void;
  accentColor: string;
  timeFormat: TimeFormat;
  colors: ThemeColors;
}

/**
 * Arrow button: one step per tap; holding it keeps stepping. Stepping only starts on a
 * completed tap or long-press, so dragging the surrounding sheet never changes the value.
 */
function StepButton({ icon, onStep, label, colors }: { icon: 'chevron-up' | 'chevron-down'; onStep: () => void; label: string; colors: ThemeColors }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(onStep);
  stepRef.current = onStep;

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const startRepeat = () => {
    const repeat = (delay: number) => {
      stepRef.current();
      timer.current = setTimeout(() => repeat(Math.max(delay * 0.8, 60)), delay);
    };
    repeat(260);
  };

  return (
    <Pressable
      onPress={() => stepRef.current()}
      onLongPress={startRepeat}
      delayLongPress={350}
      onPressOut={stop}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [styles.stepBtn, { backgroundColor: pressed ? colors.border : 'transparent' }]}
    >
      <MaterialCommunityIcons name={icon} size={26} color={colors.textSecondary} />
    </Pressable>
  );
}

export function TimePicker({ label, value, onChange, accentColor, timeFormat, colors }: Props) {
  const [h, m] = parseHHMM(value) ?? [9, 0];
  const valueRef = useRef<[number, number]>([h, m]);
  valueRef.current = [h, m];

  const set = (nh: number, nm: number) => {
    haptic.selection();
    onChange(toHHMM(((nh % 24) + 24) % 24, ((nm % 60) + 60) % 60));
  };
  const stepHour = (d: number) => {
    const [ch, cm] = valueRef.current;
    set(ch + d, cm);
  };
  const stepMinute = (d: number) => {
    const [ch, cm] = valueRef.current;
    const next = Math.round((cm + d) / 5) * 5;
    if (next >= 60) set(ch + 1, next - 60);
    else if (next < 0) set(ch - 1, next + 60);
    else set(ch, next);
  };

  const twelve = timeFormat === '12h';
  const hourText = twelve ? String(h % 12 === 0 ? 12 : h % 12) : String(h).padStart(2, '0');
  const spoken = formatTime(value, timeFormat);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View
          style={styles.column}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${label} hour`}
          accessibilityValue={{ text: spoken }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => stepHour(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
          <StepButton icon="chevron-up" onStep={() => stepHour(1)} label="Later hour" colors={colors} />
          <Text style={[styles.digits, { color: colors.text }]}>{hourText}</Text>
          <StepButton icon="chevron-down" onStep={() => stepHour(-1)} label="Earlier hour" colors={colors} />
        </View>
        <Text style={[styles.colon, { color: accentColor }]}>:</Text>
        <View
          style={styles.column}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${label} minutes`}
          accessibilityValue={{ text: spoken }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => stepMinute(e.nativeEvent.actionName === 'increment' ? 5 : -5)}
        >
          <StepButton icon="chevron-up" onStep={() => stepMinute(5)} label="Later minutes" colors={colors} />
          <Text style={[styles.digits, { color: colors.text }]}>{String(m).padStart(2, '0')}</Text>
          <StepButton icon="chevron-down" onStep={() => stepMinute(-5)} label="Earlier minutes" colors={colors} />
        </View>
        {twelve && (
          <Pressable
            onPress={() => set(h + 12, m)}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${h < 12 ? 'PM' : 'AM'}`}
            style={[styles.ampm, { backgroundColor: withAlpha(accentColor, 0.16) }]}
          >
            <Text style={[styles.ampmText, { color: colors.text }]}>{h < 12 ? 'AM' : 'PM'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  column: { alignItems: 'center', width: 52 },
  stepBtn: { width: 44, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  digits: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], marginVertical: 2 },
  colon: { fontSize: 26, fontWeight: '800', marginBottom: 3 },
  ampm: { marginLeft: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  ampmText: { fontSize: 14, fontWeight: '800' },
});
