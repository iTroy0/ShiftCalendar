import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NotesData } from '../hooks/useShiftData';

interface Props {
  notesData: NotesData;
  onSelectDate: (date: string) => void;
  colors: {
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    background: string;
  };
}

export const NotesSearchSheet = forwardRef<BottomSheet, Props>(
  ({ notesData, onSelectDate, colors }, ref) => {
    const snapPoints = useMemo(() => ['55%', '85%'], []);
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
      const entries = Object.entries(notesData);
      if (!query.trim()) {
        // Show all notes sorted by date descending
        return entries.sort(([a], [b]) => b.localeCompare(a));
      }
      const q = query.toLowerCase();
      return entries
        .filter(([, note]) => note.toLowerCase().includes(q))
        .sort(([a], [b]) => b.localeCompare(a));
    }, [notesData, query]);

    const handleSelect = useCallback(
      (date: string) => {
        onSelectDate(date);
        if (ref && typeof ref !== 'function' && ref.current) {
          ref.current.close();
        }
      },
      [onSelectDate, ref]
    );

    const formatDateLabel = (dateStr: string) => {
      try {
        return format(new Date(dateStr + 'T00:00:00'), 'EEE, d MMM yyyy');
      } catch {
        return dateStr;
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary + '80', width: 36 }}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="note-search-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Search Notes</Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {results.length} {results.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <View style={[styles.searchRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search notes..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <BottomSheetScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {results.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name={query ? 'file-search-outline' : 'note-off-outline'}
                size={40}
                color={colors.textSecondary + '50'}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {query ? 'No notes match your search' : 'No notes yet'}
              </Text>
            </View>
          ) : (
            results.map(([date, note]) => (
              <TouchableOpacity
                key={date}
                style={[styles.noteCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                onPress={() => handleSelect(date)}
                activeOpacity={0.6}
              >
                <View style={styles.noteCardHeader}>
                  <MaterialCommunityIcons name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.noteDate, { color: colors.primary }]}>
                    {formatDateLabel(date)}
                  </Text>
                </View>
                <Text
                  style={[styles.notePreview, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {note}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  count: { fontSize: 12, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  noteCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  noteDate: { fontSize: 12, fontWeight: '700' },
  notePreview: { fontSize: 13, lineHeight: 18 },
});
