import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { UpcomingInfo } from '../../utils/schedule';
import { withAlpha } from '../../utils/color';
import { Tap } from '../ui/Tap';
import { IconButton } from '../ui/primitives';

interface Props {
  title: string;
  year: string;
  upcoming: UpcomingInfo;
  isEmpty: boolean;
  showToday: boolean;
  view: 'month' | 'week';
  colors: ThemeColors;
  compact?: boolean;
  onTitlePress: () => void;
  onToday: () => void;
  onSearch: () => void;
  onToggleView: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function StatusLine({ upcoming, isEmpty, besideToday, colors }: { upcoming: UpcomingInfo; isEmpty: boolean; besideToday: boolean; colors: ThemeColors }) {
  const { today, next } = upcoming;
  let dot = colors.textMuted;
  let text = isEmpty ? 'Tap any day to add your first shift' : 'Nothing scheduled in the next month';
  if (today) {
    dot = today.color;
    // Next to the "Today" button the prefix would just repeat it.
    text = `${besideToday ? '' : 'Today · '}${today.label}${today.working ? ` · ${today.detail}` : ''}`;
    if (!today.working && next) text += `  ·  Next: ${next.label}, ${next.when}`;
  } else if (next) {
    dot = next.color;
    text = `Next: ${next.label} · ${next.when}, ${next.time}`;
  }
  return (
    <View style={styles.status} accessibilityRole="text">
      <View style={[styles.statusDot, { backgroundColor: dot }]} />
      <Text style={[styles.statusText, { color: colors.textSecondary }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function CalendarHeader(props: Props) {
  const { colors } = props;
  return (
    <View style={[styles.container, props.compact && styles.compact]}>
      <View style={styles.topRow}>
        <Tap
          onPress={props.onTitlePress}
          accessibilityLabel={`${props.title} ${props.year}. Choose month`}
          style={styles.titleBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {props.title}
          </Text>
          <Text style={[styles.year, { color: colors.textMuted }]}>{props.year}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
        </Tap>
        <View style={styles.actions}>
          <IconButton icon="magnify" label="Search notes" onPress={props.onSearch} colors={colors} size={38} />
          <IconButton
            icon={props.view === 'month' ? 'view-agenda-outline' : 'calendar-month-outline'}
            label={props.view === 'month' ? 'Switch to week view' : 'Switch to month view'}
            onPress={props.onToggleView}
            colors={colors}
            size={38}
          />
        </View>
      </View>
      <View style={styles.subRow}>
        {props.showToday && (
          <Tap
            onPress={props.onToday}
            accessibilityLabel="Go to today"
            style={[styles.todayPill, { backgroundColor: withAlpha(colors.primary, 0.14) }]}
          >
            <MaterialCommunityIcons name="calendar-today" size={14} color={colors.primaryText} />
            <Text style={[styles.todayText, { color: colors.primaryText }]}>Today</Text>
          </Tap>
        )}
        <StatusLine upcoming={props.upcoming} isEmpty={props.isEmpty} besideToday={props.showToday} colors={colors} />
        <View style={styles.arrows}>
          <Tap onPress={props.onPrev} accessibilityLabel={props.view === 'month' ? 'Previous month' : 'Previous week'} style={styles.arrow}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textSecondary} />
          </Tap>
          <Tap onPress={props.onNext} accessibilityLabel={props.view === 'month' ? 'Next month' : 'Next week'} style={styles.arrow}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </Tap>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  compact: { paddingTop: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleBtn: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1, flexGrow: 1, paddingVertical: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, flexShrink: 1 },
  year: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, minHeight: 32 },
  todayPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14 },
  todayText: { fontSize: 12, fontWeight: '800' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1 },
  arrows: { flexDirection: 'row', gap: 2 },
  arrow: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
});
