package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ParsedCell
import com.ivans2001.grafiksz.data.ParsedImport
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ScheduleViewMode
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private val scheduleLocale = Locale("ru")
private val monthTitleFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", scheduleLocale)

@Composable
fun ScheduleScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    var monthString by rememberSaveable { mutableStateOf(YearMonth.now().toString()) }
    var focusDateString by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    var viewModeName by rememberSaveable { mutableStateOf(ScheduleViewMode.MONTH.name) }
    var editingDateString by rememberSaveable { mutableStateOf<String?>(null) }
    var showImport by rememberSaveable { mutableStateOf(false) }

    val month = YearMonth.parse(monthString)
    val focusDate = LocalDate.parse(focusDateString)
    val viewMode = ScheduleViewMode.valueOf(viewModeName)

    val goPrevious: () -> Unit = {
        if (viewMode == ScheduleViewMode.WEEK) {
            val date = focusDate.minusWeeks(1)
            focusDateString = date.toString()
            monthString = YearMonth.from(date).toString()
        } else {
            val previous = month.minusMonths(1)
            monthString = previous.toString()
            focusDateString = previous.atDay(1).toString()
        }
    }

    val goNext: () -> Unit = {
        if (viewMode == ScheduleViewMode.WEEK) {
            val date = focusDate.plusWeeks(1)
            focusDateString = date.toString()
            monthString = YearMonth.from(date).toString()
        } else {
            val next = month.plusMonths(1)
            monthString = next.toString()
            focusDateString = next.atDay(1).toString()
        }
    }

    val goToday: () -> Unit = {
        val today = LocalDate.now()
        monthString = YearMonth.from(today).toString()
        focusDateString = today.toString()
    }

    val periodLabel = when (viewMode) {
        ScheduleViewMode.WEEK -> weekRangeLabel(focusDate)
        ScheduleViewMode.MONTH,
        ScheduleViewMode.LIST,
        -> month.format(monthTitleFormatter).replaceFirstChar { it.uppercaseChar() }
    }

    val monthRecords = store.records.filterKeys { YearMonth.from(it) == month }
    val workingDays = monthRecords.values.count { it.shiftId != null }
    val daysOff = monthRecords.values.count { it.status == DayStatus.DAY_OFF }
    val totalMinutes = monthRecords.values.sumOf { record ->
        (ShiftPool.byId(record.shiftId)?.durationMinutes ?: 0) + record.overtimeMinutes
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
    ) {
        ScheduleTopBar(
            employeeName = store.employeeName,
            onImport = { showImport = true },
        )

        if (store.records.isEmpty()) {
            FirstRunImportCard(
                onImport = { showImport = true },
            )
        } else {
            val today = LocalDate.now()
            val nextShiftDate = generateSequence(today.plusDays(1)) { it.plusDays(1) }
                .take(60)
                .firstOrNull { date -> store.record(date)?.shiftId != null }

            TodayOverview(
                date = today,
                record = store.record(today),
                nextDate = nextShiftDate,
                nextRecord = nextShiftDate?.let(store::record),
            )
        }

        PeriodNavigator(
            label = periodLabel,
            onPrevious = goPrevious,
            onNext = goNext,
            onToday = goToday,
        )

        SummaryStrip(
            workingDays = workingDays,
            daysOff = daysOff,
            hours = totalMinutes / 60.0,
        )

        ViewModeSelector(
            selected = viewMode,
            onSelect = { selected ->
                viewModeName = selected.name
                if (selected == ScheduleViewMode.WEEK && YearMonth.from(focusDate) != month) {
                    focusDateString = month.atDay(1).toString()
                }
            },
        )

        Box(modifier = Modifier.weight(1f)) {
            when (viewMode) {
                ScheduleViewMode.MONTH -> MonthGrid(
                    month = month,
                    store = store,
                    onDayClick = { date ->
                        focusDateString = date.toString()
                        editingDateString = date.toString()
                    },
                    onSwipePrevious = goPrevious,
                    onSwipeNext = goNext,
                )

                ScheduleViewMode.WEEK -> WeekScheduleView(
                    focusDate = focusDate,
                    store = store,
                    onDayClick = { date ->
                        focusDateString = date.toString()
                        monthString = YearMonth.from(date).toString()
                        editingDateString = date.toString()
                    },
                    onSwipePrevious = goPrevious,
                    onSwipeNext = goNext,
                )

                ScheduleViewMode.LIST -> MonthList(
                    month = month,
                    store = store,
                    onDayClick = { date ->
                        focusDateString = date.toString()
                        editingDateString = date.toString()
                    },
                )
            }
        }
    }

    editingDateString?.let { dateString ->
        val date = LocalDate.parse(dateString)
        DayEditorSheet(
            date = date,
            initial = store.record(date) ?: DayRecord(),
            onDismiss = { editingDateString = null },
            onSave = { record ->
                store.saveDay(date, record)
                editingDateString = null
            },
            onClear = {
                store.clearDay(date)
                editingDateString = null
            },
        )
    }

    if (showImport) {
        ImportScheduleDialog(
            initialMonth = month,
            onDismiss = { showImport = false },
            onApply = { selectedMonth: YearMonth, imported: ParsedImport, mappings: Map<String, String> ->
                val records = imported.days.mapNotNull { day ->
                    val record = when (val value = day.value) {
                        ParsedCell.Empty -> null
                        is ParsedCell.Shift -> DayRecord(shiftId = value.shiftId)
                        is ParsedCell.Status -> DayRecord(status = value.status)
                        is ParsedCell.Unresolved -> mappings[value.raw]
                            ?.let { shiftId -> DayRecord(shiftId = shiftId) }
                    }
                    record?.let { day.date to it }
                }.toMap()

                store.replaceMonth(
                    month = selectedMonth,
                    imported = records,
                    importedEmployeeName = imported.employeeName,
                )
                monthString = selectedMonth.toString()
                focusDateString = selectedMonth.atDay(1).toString()
                showImport = false
            },
        )
    }
}

private fun weekRangeLabel(date: LocalDate): String {
    val monday = date.minusDays((date.dayOfWeek.value - 1).toLong())
    val sunday = monday.plusDays(6)
    val startMonth = monday.month.getDisplayName(TextStyle.SHORT, scheduleLocale).replace(".", "")
    val endMonth = sunday.month.getDisplayName(TextStyle.SHORT, scheduleLocale).replace(".", "")

    return if (monday.month == sunday.month) {
        "${monday.dayOfMonth}–${sunday.dayOfMonth} $endMonth ${sunday.year}"
    } else {
        "${monday.dayOfMonth} $startMonth – ${sunday.dayOfMonth} $endMonth ${sunday.year}"
    }
}
