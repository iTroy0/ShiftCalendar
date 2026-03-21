import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addMonths, subMonths, getDaysInMonth } from 'date-fns';
import { useAppTheme } from '../../hooks/ThemeContext';
import { useShifts } from '../../hooks/ShiftContext';
import { getShiftHours } from '../../constants/shifts';
import { getCurrencySymbol } from '../../constants/currencies';
import { MonthHeader } from '../../components/MonthHeader';
import { CalendarSwitcher } from '../../components/CalendarSwitcher';
import { YearlyOverview } from '../../components/YearlyOverview';

export default function StatsScreen() {
  const { colors, baseRate, overtimeRate, currencyCode } = useAppTheme();
  const currSymbol = getCurrencySymbol(currencyCode);
  const { shiftData, overtimeData, allShifts, calendars, activeCalendar, switchCalendar } = useShifts();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthKey = format(currentMonth, 'yyyy-MM');

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    allShifts.forEach((s) => (counts[s.code] = 0));

    let overtimeHours = 0;
    let overtimeDays = 0;
    let regularHours = 0;

    Object.entries(shiftData).forEach(([date, code]) => {
      if (date.startsWith(monthKey)) {
        counts[code] = (counts[code] || 0) + 1;
        const shift = allShifts.find((s) => s.code === code);
        if (shift) {
          regularHours += getShiftHours(shift);
        }
      }
    });

    Object.entries(overtimeData).forEach(([date, hours]) => {
      if (date.startsWith(monthKey) && hours > 0) {
        overtimeHours += hours;
        overtimeDays++;
      }
    });

    const offCodes = allShifts.filter((s) => !s.startTime).map((s) => s.code);
    const workingDays = Object.entries(counts)
      .filter(([code]) => !offCodes.includes(code))
      .reduce((sum, [, count]) => sum + count, 0);
    const totalHours = regularHours + overtimeHours;
    const totalDays = getDaysInMonth(currentMonth);
    const assignedDays = Object.values(counts).reduce((s, c) => s + c, 0);
    const basePay = baseRate > 0 ? regularHours * baseRate : 0;
    const overtimeEarnings = overtimeRate > 0 ? overtimeHours * overtimeRate : 0;
    const totalPay = basePay + overtimeEarnings;

    return {
      counts, workingDays,
      regularHours: Math.round(regularHours * 10) / 10,
      overtimeHours, overtimeDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalDays, assignedDays,
      basePay: Math.round(basePay * 100) / 100,
      overtimeEarnings: Math.round(overtimeEarnings * 100) / 100,
      totalPay: Math.round(totalPay * 100) / 100,
    };
  }, [shiftData, overtimeData, monthKey, currentMonth, allShifts, baseRate, overtimeRate]);

  const maxCount = Math.max(...Object.values(stats.counts), 1);

  const handleYearMonthPress = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <MonthHeader
        currentDate={currentMonth}
        onPrev={() => setCurrentMonth((d) => subMonths(d, 1))}
        onNext={() => setCurrentMonth((d) => addMonths(d, 1))}
        textColor={colors.text}
      />

      <CalendarSwitcher
        calendars={calendars}
        activeCalendarId={activeCalendar.id}
        onSwitch={switchCalendar}
        colors={colors}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stats.assignedDays === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="chart-bar" size={48} color={colors.textSecondary + '50'} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Shifts This Month</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Assign shifts in the Calendar tab to see your stats here.
            </Text>
          </View>
        ) : (
          <>
            {/* Shift count cards */}
            <View style={styles.grid}>
              {allShifts.map((shift) => (
                <View
                  key={shift.code}
                  style={[styles.card, { backgroundColor: shift.color + '12', borderColor: shift.color + '25' }]}
                >
                  <MaterialCommunityIcons name={shift.icon as any} size={24} color={shift.color} />
                  <Text style={[styles.cardCount, { color: shift.color }]}>
                    {stats.counts[shift.code] || 0}
                  </Text>
                  <Text style={[styles.cardLabel, { color: shift.color + 'BB' }]}>{shift.label}</Text>
                </View>
              ))}
            </View>

            {/* Hours summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Hours Breakdown</Text>

              <SummaryRow
                icon="briefcase-clock-outline"
                label="Regular Hours"
                value={`${stats.regularHours}h`}
                iconColor={colors.primary}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow
                icon="clock-plus-outline"
                label="Overtime Hours"
                value={`${stats.overtimeHours}h`}
                iconColor="#EF4444"
                colors={colors}
                highlight={stats.overtimeHours > 0}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow
                icon="sigma"
                label="Total Hours"
                value={`${stats.totalHours}h`}
                iconColor="#10B981"
                colors={colors}
                bold
              />
            </View>

            {/* Pay Estimate */}
            {(baseRate > 0 || overtimeRate > 0) && (
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.payHeader}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>Pay Estimate</Text>
                  <View style={[styles.payBadge, { backgroundColor: colors.primary + '18' }]}>
                    <MaterialCommunityIcons name="calculator-variant-outline" size={14} color={colors.primary} />
                    <Text style={[styles.payBadgeText, { color: colors.primary }]}>Monthly</Text>
                  </View>
                </View>

                {baseRate > 0 && (
                  <SummaryRow
                    icon="briefcase-clock-outline"
                    label={`Base Pay (${stats.regularHours}h × ${currSymbol}${baseRate})`}
                    value={`${currSymbol}${stats.basePay.toFixed(2)}`}
                    iconColor={colors.primary}
                    colors={colors}
                  />
                )}
                {baseRate > 0 && overtimeRate > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                {overtimeRate > 0 && (
                  <SummaryRow
                    icon="clock-plus-outline"
                    label={`Overtime (${stats.overtimeHours}h × ${currSymbol}${overtimeRate})`}
                    value={`${currSymbol}${stats.overtimeEarnings.toFixed(2)}`}
                    iconColor="#EF4444"
                    colors={colors}
                    highlight={stats.overtimeEarnings > 0}
                  />
                )}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SummaryRow
                  icon="cash-multiple"
                  label="Total Estimated"
                  value={`${currSymbol}${stats.totalPay.toFixed(2)}`}
                  iconColor="#10B981"
                  colors={colors}
                  bold
                />
              </View>
            )}

            {/* Days summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Days Overview</Text>

              <SummaryRow
                icon="briefcase-outline"
                label="Working Days"
                value={String(stats.workingDays)}
                iconColor={colors.primary}
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow
                icon="clock-alert-outline"
                label="Overtime Days"
                value={String(stats.overtimeDays)}
                iconColor="#EF4444"
                colors={colors}
                highlight={stats.overtimeDays > 0}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SummaryRow
                icon="calendar-check"
                label="Days Assigned"
                value={`${stats.assignedDays} / ${stats.totalDays}`}
                iconColor="#10B981"
                colors={colors}
              />
            </View>

            {/* Distribution bars */}
            <View style={[styles.barContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Shift Distribution</Text>
              {allShifts
                .filter((s) => s.startTime)
                .map((shift) => {
                  const count = stats.counts[shift.code] || 0;
                  const pct = (count / maxCount) * 100;
                  return (
                    <View key={shift.code} style={styles.barRow}>
                      <View style={styles.barLabelRow}>
                        <View style={[styles.barDot, { backgroundColor: shift.color }]} />
                        <Text style={[styles.barLabel, { color: colors.text }]}>{shift.label}</Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={[styles.barFill, { backgroundColor: shift.color, width: `${pct}%` }]} />
                      </View>
                      <Text style={[styles.barCount, { color: colors.textSecondary }]}>{count}</Text>
                    </View>
                  );
                })}

              {stats.overtimeHours > 0 && (
                <View style={styles.barRow}>
                  <View style={styles.barLabelRow}>
                    <View style={[styles.barDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.barLabel, { color: colors.text }]}>Overtime</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.barFill,
                        { backgroundColor: '#EF4444', width: `${Math.min((stats.overtimeHours / (stats.regularHours || 1)) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barCount, { color: '#EF4444' }]}>{stats.overtimeHours}h</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Yearly Overview - always visible */}
        <View style={{ marginTop: 14 }}>
          <YearlyOverview
            year={currentMonth.getFullYear()}
            selectedMonth={currentMonth.getMonth()}
            shiftData={shiftData}
            allShifts={allShifts}
            onMonthPress={handleYearMonthPress}
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  iconColor,
  colors,
  bold,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  colors: any;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={sStyles.row} accessibilityLabel={`${label}: ${value}`}>
      <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      <Text style={[sStyles.label, { color: colors.text }]}>{label}</Text>
      <Text
        style={[
          sStyles.value,
          { color: iconColor, fontSize: bold ? 20 : 17, fontWeight: bold ? '900' : '800' },
          highlight && { color: '#EF4444' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const sStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  label: { flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 10 },
  value: { fontSize: 17, fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardCount: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  cardLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  payHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  payBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  payBadgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1 },
  barContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
    gap: 6,
  },
  barDot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 13, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },
  barCount: { width: 34, fontSize: 13, fontWeight: '700', textAlign: 'right' },
});
