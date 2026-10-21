import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';
import { Chip } from '../ui/primitives';

export type CalendarMode = 'normal' | 'paint' | 'repeat' | 'template';

interface ToolRowProps {
  colors: ThemeColors;
  onPaint: () => void;
  onRepeat: () => void;
  onTemplate: () => void;
  canRepeat: boolean;
}

/** Entry points for the quick-fill tools. */
export function ToolRow({ colors, onPaint, onRepeat, onTemplate, canRepeat }: ToolRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      <Chip label="Paint" icon="brush-variant" onPress={onPaint} colors={colors} compact accessibilityLabel="Paint mode: tap days to assign shifts" />
      <Chip label="Templates" icon="view-grid-plus-outline" onPress={onTemplate} colors={colors} compact accessibilityLabel="Apply a rotation template" />
      {canRepeat && (
        <Chip label="Repeat" icon="repeat" onPress={onRepeat} colors={colors} compact accessibilityLabel="Repeat a pattern of days" />
      )}
    </ScrollView>
  );
}

interface ModeBarProps {
  colors: ThemeColors;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
  doneLabel: string;
  onDone: () => void;
  onUndo?: () => void;
  undoDisabled?: boolean;
}

/** Replaces the tool row while a mode is active: what to do next, plus exit (and undo). */
export function ModeBar({ colors, icon, text, doneLabel, onDone, onUndo, undoDisabled }: ModeBarProps) {
  return (
    <View style={[styles.modeBar, { backgroundColor: withAlpha(colors.primary, 0.12), borderColor: withAlpha(colors.primary, 0.3) }]}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.primaryText} />
      <Text style={[styles.modeText, { color: colors.primaryText }]} numberOfLines={2}>
        {text}
      </Text>
      {onUndo && (
        <Tap
          onPress={onUndo}
          disabled={undoDisabled}
          accessibilityLabel="Undo last change"
          style={[styles.modeBtn, { backgroundColor: colors.surface, opacity: undoDisabled ? 0.4 : 1 }]}
        >
          <MaterialCommunityIcons name="undo-variant" size={18} color={colors.text} />
        </Tap>
      )}
      <Tap onPress={onDone} accessibilityLabel={doneLabel} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
        <Text style={[styles.doneText, { color: colors.onPrimary }]}>{doneLabel}</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4, alignItems: 'center' },
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 46,
  },
  modeText: { flex: 1, fontSize: 13, fontWeight: '700' },
  modeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  doneBtn: { paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 13, fontWeight: '800' },
});
