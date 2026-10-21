import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAppSettings } from '../../hooks/SettingsContext';
import { useShifts } from '../../hooks/ShiftContext';
import { useToday } from '../../hooks/useToday';
import { isWorkingShift } from '../../constants/shifts';
import { formatMoney } from '../../constants/currencies';
import { ThemeColors } from '../../constants/colors';
import { Type } from '../../constants/theme';
import { computeStats, leaveUsedInYear, monthRange, yearRange } from '../../utils/statsCalculation';
import { fromDateKey, monthFromIndex, monthIndexOf } from '../../utils/dates';
import { formatHours } from '../../utils/time';
import { withAlpha } from '../../utils/color';
import { haptic } from '../../utils/haptics';
import { CalendarSwitcher } from '../../components/CalendarSwitcher';
import { YearlyOverview } from '../../components/YearlyOverview';
import { DistributionBar, Segment } from '../../components/stats/DistributionBar';
import { MonthlyHoursChart } from '../../components/stats/MonthlyHoursChart';
import { LeaveMeters } from '../../components/stats/LeaveMeters';
import { Card, Divider, EmptyState, Button, Segmented, SectionLabel } from '../../components/ui/primitives';
import { Tap } from '../../components/ui/Tap';

type Period = 'month' | 'year';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** All leave types share one segment in the distribution bar, in the Annual Leave hue. */
const LEAVE_SEGMENT_COLOR = '#10B981';

function StatTile({ icon, iconColor, label, value, sub, colors }: { icon: IconName; iconColor: string; label: string; value: string; sub?: string; colors: ThemeColors }) {
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel={`${label}: ${value}${sub ? ', ' + sub : ''}`}>
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { backgroundColor: withAlpha(iconColor, 0.14) }]}>
          <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.tileLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.tileValue, { color: colors.text }]}>{value}</Text>
      {sub ? <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>{sub}</Text> : null}
    </View>
  );
}

function Row({ label, value, colors, strong, swatch, note }: { label: string; value: string; colors: ThemeColors; strong?: boolean; swatch?: string; note?: string }) {
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      {swatch && <View style={[styles.rowSwatch, { backgroundColor: swatch }]} />}
      <View style={styles.flex}>
        <Text style={[styles.rowLabel, { color: strong ? colors.text : colors.textSecondary }, strong && styles.rowStrong]}>{label}</Text>
        {note ? <Text style={[styles.rowNote, { color: colors.textMuted }]}>{note}</Text> : null}
      </View>
      <Text style={[styles.rowValue, { color: colors.text }, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { colors, baseRate, overtimeRate, paidLeaveHours, currencyCode, weekStart } = useAppSettings();
  const {
    shiftData, overtimeData, leaveData, notesData, leaveBalances, allShifts, leaveTypes, calendars, activeCalendarId, switchCalendar,
  } = useShifts();
  const router = useRouter();
  const today = useToday();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const todayMonthIdx = monthIndexOf(fromDateKey(today));

  const [period, setPeriod] = useState<Period>('month');
  const [monthIdx, setMonthIdx] = useState(todayMonthIdx);
  const month = monthFromIndex(monthIdx);
  const year = month.getFullYear();

  const base = { shifts: shiftData, overtime: overtimeData, leave: leaveData, notes: notesData, allShifts, leaveTypes, baseRate, overtimeRate, paidLeaveHours };
  const stats = useMemo(
    () => computeStats({ ...base, ...(period === 'month' ? monthRange(year, month.getMonth()) : yearRange(year)) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, monthIdx, shiftData, overtimeData, leaveData, notesData, allShifts, leaveTypes, baseRate, overtimeRate, paidLeaveHours]
  );
  const monthlyHours = useMemo(
    () => (period === 'year' ? Array.from({ length: 12 }, (_, m) => computeStats({ ...base, ...monthRange(year, m) }).totalHours) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, year, shiftData, overtimeData, leaveData, allShifts, leaveTypes, paidLeaveHours]
  );
  const leaveUsed = useMemo(() => leaveUsedInYear(leaveData, year), [leaveData, year]);

  const hasRates = baseRate > 0 || overtimeRate > 0;
  const isCurrent = period === 'month' ? monthIdx === todayMonthIdx : year === fromDateKey(today).getFullYear();
  const periodTitle = period === 'month' ? format(month, 'MMMM yyyy') : String(year);
  const empty = stats.assignedDays === 0 && stats.overtimeHours === 0;

  const segments: Segment[] = [
    ...allShifts.filter(isWorkingShift).map((s) => ({ key: s.code, label: s.label, color: s.color, value: stats.counts[s.code] })),
    { key: 'leave', label: 'Leave', color: LEAVE_SEGMENT_COLOR, value: stats.leaveDays },
    ...allShifts.filter((s) => !isWorkingShift(s)).map((s) => ({ key: s.code, label: s.label, color: s.color, value: stats.counts[s.code] })),
  ];

  const step = (dir: 1 | -1) => {
    haptic.selection();
    setMonthIdx((i) => i + dir * (period === 'month' ? 1 : 12));
  };

  const openMonth = (m: number) => {
    haptic.selection();
    setMonthIdx(year * 12 + m);
    setPeriod('month');
  };

  const half = wide ? styles.half : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[Type.display, { color: colors.text }]} accessibilityRole="header">
            Stats
          </Text>
          <Segmented
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            value={period}
            onChange={(p) => {
              haptic.selection();
              setPeriod(p as Period);
            }}
            colors={colors}
            style={styles.segmented}
          />
        </View>

        <View style={[styles.nav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Tap onPress={() => step(-1)} accessibilityLabel={period === 'month' ? 'Previous month' : 'Previous year'} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </Tap>
          <View style={styles.navCenter}>
            <Text style={[styles.navTitle, { color: colors.text }]}>{periodTitle}</Text>
            {!isCurrent && (
              <Tap onPress={() => setMonthIdx(todayMonthIdx)} accessibilityLabel="Back to current period">
                <Text style={[styles.navToday, { color: colors.primaryText }]}>{period === 'month' ? 'Back to this month' : 'Back to this year'}</Text>
              </Tap>
            )}
          </View>
          <Tap onPress={() => step(1)} accessibilityLabel={period === 'month' ? 'Next month' : 'Next year'} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
          </Tap>
        </View>

        <View style={styles.switcher}>
          <CalendarSwitcher calendars={calendars} activeCalendarId={activeCalendarId} onSwitch={switchCalendar} colors={colors} />
        </View>

        {empty ? (
          <Card colors={colors} style={styles.section}>
            <EmptyState
              icon="chart-box-outline"
              title={`Nothing scheduled in ${periodTitle}`}
              message="Assign shifts or leave on the calendar and your hours, pay and patterns will show up here."
              colors={colors}
              action={<Button label="Open calendar" icon="calendar-month" onPress={() => router.navigate('/')} colors={colors} style={styles.emptyBtn} />}
            />
          </Card>
        ) : (
          <>
            <Card colors={colors} style={styles.section}>
              <View style={styles.heroTop}>
                <View style={styles.flex}>
                  <Text style={[Type.overline, { color: colors.textMuted }]}>Total hours</Text>
                  <Text style={[styles.hero, { color: colors.text }]} accessibilityLabel={`Total hours ${stats.totalHours}`}>
                    {formatHours(stats.totalHours)}
                  </Text>
                </View>
                {hasRates && (
                  <View style={styles.heroPay}>
                    <Text style={[Type.overline, { color: colors.textMuted }]}>Est. pay</Text>
                    <Text style={[styles.heroPayValue, { color: colors.text }]}>{formatMoney(stats.totalPay, currencyCode)}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                {stats.workingDays} shift{stats.workingDays === 1 ? '' : 's'}
                {stats.overtimeHours > 0 ? ` · ${formatHours(stats.overtimeHours)} overtime` : ''}
                {stats.leaveDays > 0 ? ` · ${stats.leaveDays} leave day${stats.leaveDays === 1 ? '' : 's'}` : ''}
              </Text>
              <View style={styles.distribution}>
                <DistributionBar segments={segments} colors={colors} unit="days" />
              </View>
            </Card>

            <View style={styles.tiles}>
              <StatTile icon="briefcase-outline" iconColor={colors.primaryText} label="Worked" value={`${stats.workingDays}`} sub={`of ${stats.totalDays} days`} colors={colors} />
              <StatTile icon="clock-plus-outline" iconColor={colors.overtimeAccent} label="Overtime" value={formatHours(stats.overtimeHours)} sub={`${stats.overtimeDays} day${stats.overtimeDays === 1 ? '' : 's'}`} colors={colors} />
              <StatTile icon="umbrella-beach" iconColor={colors.success} label="Leave" value={`${stats.leaveDays}`} sub={`${stats.paidLeaveDays} paid`} colors={colors} />
              <StatTile icon="home-variant" iconColor={colors.textSecondary} label="Days off" value={`${stats.offDays}`} sub={stats.totalDays === stats.assignedDays ? 'Every day planned' : `${stats.totalDays - stats.assignedDays} not planned`} colors={colors} />
            </View>

            {period === 'year' && (
              <>
                <SectionLabel colors={colors}>Hours by month</SectionLabel>
                <Card colors={colors}>
                  <MonthlyHoursChart
                    hours={monthlyHours}
                    colors={colors}
                    highlightMonth={year === fromDateKey(today).getFullYear() ? fromDateKey(today).getMonth() : null}
                    onMonthPress={openMonth}
                  />
                </Card>
              </>
            )}

            <View style={wide ? styles.columns : undefined}>
              <View style={half}>
                <SectionLabel colors={colors}>Hours</SectionLabel>
                <Card colors={colors}>
                  <Row label="Shift hours" value={formatHours(stats.shiftHours)} colors={colors} />
                  <Divider colors={colors} />
                  <Row
                    label="Paid leave"
                    note={stats.paidLeaveDays ? `${stats.paidLeaveDays} day${stats.paidLeaveDays === 1 ? '' : 's'} × ${formatHours(paidLeaveHours)}` : undefined}
                    value={formatHours(stats.paidLeaveHours)}
                    colors={colors}
                  />
                  <Divider colors={colors} />
                  <Row label="Overtime" value={formatHours(stats.overtimeHours)} colors={colors} />
                  <Divider colors={colors} />
                  <Row label="Total" value={formatHours(stats.totalHours)} colors={colors} strong />
                </Card>
              </View>

              <View style={half}>
                <SectionLabel colors={colors}>Pay estimate</SectionLabel>
                {hasRates ? (
                  <Card colors={colors}>
                    <Row
                      label="Regular"
                      note={baseRate > 0 ? `${formatHours(stats.regularHours)} × ${formatMoney(baseRate, currencyCode)}` : 'No base rate set'}
                      value={formatMoney(stats.basePay, currencyCode)}
                      colors={colors}
                    />
                    <Divider colors={colors} />
                    <Row
                      label="Overtime"
                      note={overtimeRate > 0 ? `${formatHours(stats.overtimeHours)} × ${formatMoney(overtimeRate, currencyCode)}` : 'No overtime rate set'}
                      value={formatMoney(stats.overtimeEarnings, currencyCode)}
                      colors={colors}
                    />
                    <Divider colors={colors} />
                    <Row label="Total" value={formatMoney(stats.totalPay, currencyCode)} colors={colors} strong />
                  </Card>
                ) : (
                  <Tap
                    onPress={() => router.navigate('/settings')}
                    accessibilityLabel="Set your hourly rate in Settings"
                    style={[styles.prompt, { backgroundColor: withAlpha(colors.primary, 0.08), borderColor: withAlpha(colors.primary, 0.3) }]}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.primaryText} />
                    <View style={styles.flex}>
                      <Text style={[styles.promptTitle, { color: colors.text }]}>See what you’ll earn</Text>
                      <Text style={[styles.promptText, { color: colors.textSecondary }]}>Add your hourly rate in Settings to get pay estimates.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </Tap>
                )}
              </View>
            </View>

            <SectionLabel colors={colors}>By shift</SectionLabel>
            <Card colors={colors}>
              {allShifts.map((s, i) => (
                <View key={s.code}>
                  {i > 0 && <Divider colors={colors} />}
                  <Row
                    label={s.label}
                    swatch={s.color}
                    note={isWorkingShift(s) ? `${formatHours(stats.hoursByCode[s.code])} total` : 'Day off'}
                    value={`${stats.counts[s.code]}`}
                    colors={colors}
                  />
                </View>
              ))}
            </Card>
          </>
        )}

        <SectionLabel colors={colors}>{`Leave balance · ${year}`}</SectionLabel>
        <Card colors={colors}>
          <LeaveMeters leaveTypes={leaveTypes} balances={leaveBalances} used={leaveUsed} colors={colors} />
        </Card>

        <SectionLabel colors={colors}>{`${year} at a glance`}</SectionLabel>
        <Card colors={colors}>
          <YearlyOverview
            year={year}
            selectedMonth={period === 'month' ? month.getMonth() : null}
            todayKey={today}
            weekStart={weekStart}
            shiftData={shiftData}
            leaveData={leaveData}
            allShifts={allShifts}
            leaveTypes={leaveTypes}
            onMonthPress={openMonth}
            colors={colors}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  scrollWide: { maxWidth: 980, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 12, gap: 12 },
  segmented: { width: 170 },
  nav: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  navBtn: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  navCenter: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '800' },
  navToday: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  switcher: { marginHorizontal: -16, marginTop: 6 },
  section: { marginTop: 12 },
  emptyBtn: { marginTop: 8, alignSelf: 'stretch' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hero: { fontSize: 44, fontWeight: '800', letterSpacing: -1.2, marginTop: 2 },
  heroPay: { alignItems: 'flex-end' },
  heroPayValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 6 },
  heroSub: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  distribution: { marginTop: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  tile: { flexGrow: 1, flexBasis: '45%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tileIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  tileValue: { fontSize: 26, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  tileSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  columns: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  rowSwatch: { width: 10, height: 10, borderRadius: 3 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowStrong: { fontWeight: '800' },
  rowNote: { fontSize: 12, marginTop: 1 },
  rowValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rowValueStrong: { fontSize: 17, fontWeight: '800' },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  promptTitle: { fontSize: 15, fontWeight: '800' },
  promptText: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
