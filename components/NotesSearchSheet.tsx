import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useShifts } from '../hooks/ShiftContext';
import { useAppSettings } from '../hooks/SettingsContext';
import { daysBetweenKeys, fromDateKey, todayKey } from '../utils/dates';
import { readableTextColor, withAlpha } from '../utils/color';
import { Tap } from './ui/Tap';
import { EmptyState } from './ui/primitives';
import { SheetHeader, useSheetBackdrop, useSheetChrome } from './ui/sheet';

interface Props {
  onSelectDate: (dateKey: string) => void;
  onDismiss?: () => void;
}

function relativeLabel(date: string, today: string) {
  const diff = daysBetweenKeys(today, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 60) return `In ${diff} days`;
  if (diff < -1 && diff > -60) return `${-diff} days ago`;
  return format(fromDateKey(date), 'yyyy');
}

function highlight(text: string, query: string) {
  if (!query) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx < 0) {
      parts.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    i = idx + q.length;
  }
  return parts;
}

/** Search every note in the active calendar; upcoming notes are listed first. */
export const NotesSearchSheet = forwardRef<BottomSheetModal, Props>(function NotesSearchSheet({ onSelectDate, onDismiss }, ref) {
  const { colors } = useAppSettings();
  const { notesData, shiftData, leaveData, getShiftByCode, getLeaveType } = useShifts();
  const chrome = useSheetChrome(colors);
  const backdrop = useSheetBackdrop(0);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%', '92%'], []);
  const [query, setQuery] = useState('');
  const today = todayKey();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const entries = Object.entries(notesData).filter(([, note]) => !q || note.toLowerCase().includes(q));
    const upcoming = entries.filter(([d]) => d >= today).sort(([a], [b]) => a.localeCompare(b));
    const past = entries.filter(([d]) => d < today).sort(([a], [b]) => b.localeCompare(a));
    return [...upcoming, ...past];
  }, [notesData, query, today]);

  const close = useCallback(() => {
    if (ref && typeof ref !== 'function') ref.current?.dismiss();
  }, [ref]);

  const select = useCallback(
    (date: string) => {
      close();
      onSelectDate(date);
    },
    [close, onSelectDate]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backdropComponent={backdrop}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={() => {
        setQuery('');
        onDismiss?.();
      }}
      {...chrome}
    >
      <View style={styles.top}>
        <SheetHeader
          title="Notes"
          subtitle={`${results.length} ${results.length === 1 ? 'note' : 'notes'}${query ? ' found' : ''}`}
          colors={colors}
          onClose={close}
        />
        <View style={[styles.searchRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <BottomSheetTextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search notes"
          />
          {query.length > 0 && (
            <Tap onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
            </Tap>
          )}
        </View>
      </View>
      <BottomSheetFlatList
        data={results}
        keyExtractor={(entry: [string, string]) => entry[0]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <EmptyState
            icon={query ? 'file-search-outline' : 'note-text-outline'}
            title={query ? 'No matching notes' : 'No notes yet'}
            message={query ? 'Try a different word.' : 'Open any day and add a note — it will show up here.'}
            colors={colors}
          />
        }
        renderItem={({ item: [date, note], index }: { item: [string, string]; index: number }) => {
          const d = fromDateKey(date);
          const leave = leaveData[date] ? getLeaveType(leaveData[date]) : undefined;
          const shift = !leave && shiftData[date] ? getShiftByCode(shiftData[date]) : undefined;
          const tag = leave ?? shift;
          const isPastStart = date < today && (index === 0 || results[index - 1][0] >= today);
          return (
            <View>
              {isPastStart && <Text style={[styles.groupLabel, { color: colors.textMuted }]}>Earlier</Text>}
              {index === 0 && date >= today && <Text style={[styles.groupLabel, { color: colors.textMuted }]}>Upcoming</Text>}
              <Tap
                onPress={() => select(date)}
                activeOpacity={0.7}
                accessibilityLabel={`${format(d, 'EEEE d MMMM yyyy')}: ${note}`}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.dateBox, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                  <Text style={[styles.dateMonth, { color: colors.primaryText }]}>{format(d, 'MMM')}</Text>
                  <Text style={[styles.dateDay, { color: colors.text }]}>{d.getDate()}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                      {format(d, 'EEEE')} · {relativeLabel(date, today)}
                    </Text>
                    {tag && (
                      <View style={[styles.tag, { backgroundColor: tag.color }]}>
                        <Text style={[styles.tagText, { color: readableTextColor(tag.color) }]}>{tag.code}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.note, { color: colors.text }]} numberOfLines={3}>
                    {highlight(note, query.trim()).map((p, i) => (
                      <Text key={i} style={p.match ? { backgroundColor: withAlpha(colors.noteAccent, 0.35), fontWeight: '700' } : undefined}>
                        {p.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              </Tap>
            </View>
          );
        }}
      />
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  list: { paddingHorizontal: 20, gap: 8 },
  groupLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 6 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  dateBox: { width: 48, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardDate: { flex: 1, fontSize: 12, fontWeight: '700' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '800' },
  note: { fontSize: 14, lineHeight: 20 },
});
