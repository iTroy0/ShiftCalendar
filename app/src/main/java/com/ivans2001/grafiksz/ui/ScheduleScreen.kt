package com.ivans2001.grafiksz.ui

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
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
import java.time.format.TextStyle
import kotlinx.coroutines.launch

@Composable
fun ScheduleScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    var monthValue by rememberSaveable {
        mutableStateOf(YearMonth.now().toString())
    }
    var focusDateValue by rememberSaveable {
        mutableStateOf(LocalDate.now().toString())
    }
    var modeValue by rememberSaveable {
        mutableStateOf(ScheduleViewMode.MONTH.name)
    }
    var editingDateValue by rememberSaveable {
        mutableStateOf<String?>(null)
    }
    var quickDateValue by rememberSaveable {
        mutableStateOf<String?>(null)
    }
    var showImport by rememberSaveable {
        mutableStateOf(false)
    }

    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val month = YearMonth.parse(monthValue)
    val focusDate = LocalDate.parse(focusDateValue)
    val mode = ScheduleViewMode.valueOf(modeValue)

    fun applyWithUndo(
        date: LocalDate,
        value: DayRecord?,
        message: String,
    ) {
        val before = store.record(date)

        if (value == null || value.isEmpty) {
            store.clearDay(date)
        } else {
            store.saveDay(date, value)
        }

        scope.launch {
            val result = snackbar.showSnackbar(
                message = message,
                actionLabel = "Отменить",
                withDismissAction = true,
            )

            if (result == SnackbarResult.ActionPerformed) {
                if (before == null || before.isEmpty) {
                    store.clearDay(date)
                } else {
                    store.saveDay(date, before)
                }
            }
        }
    }

    val goToday: () -> Unit = {
        val today = LocalDate.now()
        monthValue = YearMonth.from(today).toString()
        focusDateValue = today.toString()
    }

    val goPrevious: () -> Unit = {
        if (mode == ScheduleViewMode.WEEK) {
            val previous = focusDate.minusWeeks(1)
            focusDateValue = previous.toString()
            monthValue = YearMonth.from(previous).toString()
        } else {
            val previous = month.minusMonths(1)
            monthValue = previous.toString()
            focusDateValue = previous.atDay(1).toString()
        }
    }

    val goNext: () -> Unit = {
        if (mode == ScheduleViewMode.WEEK) {
            val next = focusDate.plusWeeks(1)
            focusDateValue = next.toString()
            monthValue = YearMonth.from(next).toString()
        } else {
            val next = month.plusMonths(1)
            monthValue = next.toString()
            focusDateValue = next.atDay(1).toString()
        }
    }

    val periodLabel = if (mode == ScheduleViewMode.WEEK) {
        weekRangeLabel(focusDate)
    } else {
        monthLabel(month)
    }

    val periodRecords = if (mode == ScheduleViewMode.WEEK) {
        val monday = focusDate.minusDays((focusDate.dayOfWeek.value - 1).toLong())
        val sunday = monday.plusDays(6)
        store.records.filterKeys { date ->
            !date.isBefore(monday) && !date.isAfter(sunday)
        }
    } else {
        store.records.filterKeys { date ->
            YearMonth.from(date) == month
        }
    }

    val workingDays = periodRecords.values.count { it.shiftId != null }
    val daysOff = periodRecords.values.count { it.status == DayStatus.DAY_OFF }
    val totalMinutes = periodRecords.values.sumOf { record ->
        (ShiftPool.byId(record.shiftId)?.durationMinutes ?: 0) + record.overtimeMinutes
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
        ) {
            ScheduleTopBar(
                employeeName = store.employeeName,
                onImport = { showImport = true },
            )

            if (store.records.isEmpty()) {
                EmptyScheduleState(
                    onImport = { showImport = true },
                    modifier = Modifier.weight(1f),
                )
            } else {
                if (month == YearMonth.now()) {
                    val today = LocalDate.now()
                    val nextDate = generateSequence(today.plusDays(1)) { it.plusDays(1) }
                        .take(60)
                        .firstOrNull { date ->
                            store.record(date)?.shiftId != null
                        }

                    CurrentDayPanel(
                        date = today,
                        record = store.record(today),
                        nextDate = nextDate,
                        nextRecord = nextDate?.let(store::record),
                        onEdit = {
                            focusDateValue = today.toString()
                            editingDateValue = today.toString()
                        },
                    )
                }

                PeriodNavigator(
                    label = periodLabel,
                    onPrevious = goPrevious,
                    onNext = goNext,
                    onToday = goToday,
                    modifier = Modifier.padding(horizontal = AppSpacing.xs),
                )

                InlineMetrics(
                    items = listOf(
                        workingDays.toString() to "смен",
                        formatHours(totalMinutes / 60.0) to "ч",
                        daysOff.toString() to "выходных",
                    ),
                    modifier = Modifier.padding(
                        start = AppSpacing.md,
                        end = AppSpacing.md,
                        bottom = AppSpacing.xs,
                    ),
                )

                ScheduleModeTabs(
                    selected = mode,
                    onSelect = { selected ->
                        modeValue = selected.name

                        if (selected == ScheduleViewMode.WEEK) {
                            val candidate = if (YearMonth.from(focusDate) == month) {
                                focusDate
                            } else {
                                month.atDay(1)
                            }

                            focusDateValue = candidate.toString()
                        }
                    },
                    modifier = Modifier.padding(horizontal = AppSpacing.sm),
                )

                Box(
                    modifier = Modifier.weight(1f),
                ) {
                    Crossfade(
                        targetState = mode,
                        label = "scheduleMode",
                    ) { target ->
                        when (target) {
                            ScheduleViewMode.MONTH -> MonthCalendar(
                                month = month,
                                store = store,
                                onDayClick = { date ->
                                    focusDateValue = date.toString()
                                    editingDateValue = date.toString()
                                },
                                onDayLongPress = { date ->
                                    focusDateValue = date.toString()
                                    quickDateValue = date.toString()
                                },
                                onSwipePrevious = goPrevious,
                                onSwipeNext = goNext,
                            )

                            ScheduleViewMode.WEEK -> WeekCalendar(
                                focusDate = focusDate,
                                store = store,
                                onDaySelect = { date ->
                                    focusDateValue = date.toString()
                                    monthValue = YearMonth.from(date).toString()
                                },
                                onEditDay = { date ->
                                    focusDateValue = date.toString()
                                    monthValue = YearMonth.from(date).toString()
                                    editingDateValue = date.toString()
                                },
                                onDayLongPress = { date ->
                                    focusDateValue = date.toString()
                                    monthValue = YearMonth.from(date).toString()
                                    quickDateValue = date.toString()
                                },
                                onSwipePrevious = goPrevious,
                                onSwipeNext = goNext,
                            )

                            ScheduleViewMode.LIST -> MonthScheduleList(
                                month = month,
                                store = store,
                                onDayClick = { date ->
                                    focusDateValue = date.toString()
                                    editingDateValue = date.toString()
                                },
                                onDayLongPress = { date ->
                                    focusDateValue = date.toString()
                                    quickDateValue = date.toString()
                                },
                            )
                        }
                    }
                }
            }
        }

        SnackbarHost(
            hostState = snackbar,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(AppSpacing.md),
        )
    }

    quickDateValue?.let { value ->
        val date = LocalDate.parse(value)
        val previousDate = date.minusDays(1)
        val previous = store.record(previousDate)

        QuickDayActionsSheet(
            date = date,
            current = store.record(date),
            previousDate = previousDate,
            previous = previous,
            onDismiss = {
                quickDateValue = null
            },
            onEdit = {
                quickDateValue = null
                editingDateValue = date.toString()
            },
            onRepeatPrevious = previous?.let { previousRecord ->
                {
                    quickDateValue = null
                    applyWithUndo(
                        date = date,
                        value = previousRecord.copy(),
                        message = "Повторён предыдущий день",
                    )
                }
            },
            onDayOff = {
                quickDateValue = null
                applyWithUndo(
                    date = date,
                    value = DayRecord(status = DayStatus.DAY_OFF),
                    message = "День отмечен выходным",
                )
            },
            onClear = if (store.record(date) != null) {
                {
                    quickDateValue = null
                    applyWithUndo(
                        date = date,
                        value = null,
                        message = "День очищен",
                    )
                }
            } else {
                null
            },
        )
    }

    editingDateValue?.let { value ->
        val date = LocalDate.parse(value)

        DayEditorSheet(
            date = date,
            initial = store.record(date) ?: DayRecord(),
            onDismiss = {
                editingDateValue = null
            },
            onSave = { record ->
                store.saveDay(date, record)
                editingDateValue = null
            },
            onClear = {
                editingDateValue = null
                applyWithUndo(
                    date = date,
                    value = null,
                    message = "День очищен",
                )
            },
        )
    }

    if (showImport) {
        ImportScheduleDialog(
            initialMonth = month,
            onDismiss = {
                showImport = false
            },
            onApply = { selectedMonth: YearMonth, parsed: ParsedImport, mappings: Map<String, String> ->
                val imported = parsed.days.mapNotNull { day ->
                    val record = when (val value = day.value) {
                        ParsedCell.Empty -> null
                        is ParsedCell.Shift -> DayRecord(
                            shiftId = value.shiftId,
                        )
                        is ParsedCell.Status -> DayRecord(
                            status = value.status,
                        )
                        is ParsedCell.Unresolved -> mappings[value.raw]
                            ?.let { shiftId ->
                                DayRecord(shiftId = shiftId)
                            }
                    }

                    record?.let { day.date to it }
                }.toMap()

                store.replaceMonth(
                    month = selectedMonth,
                    imported = imported,
                    importedEmployeeName = parsed.employeeName,
                )

                monthValue = selectedMonth.toString()
                focusDateValue = selectedMonth.atDay(1).toString()
                showImport = false

                scope.launch {
                    snackbar.showSnackbar(
                        message = "График за ${monthLabel(selectedMonth)} сохранён",
                        withDismissAction = true,
                    )
                }
            },
        )
    }
}

private fun weekRangeLabel(
    date: LocalDate,
): String {
    val monday = date.minusDays((date.dayOfWeek.value - 1).toLong())
    val sunday = monday.plusDays(6)
    val startMonth = monday.month
        .getDisplayName(TextStyle.SHORT, UiLocale)
        .replace(".", "")
    val endMonth = sunday.month
        .getDisplayName(TextStyle.SHORT, UiLocale)
        .replace(".", "")

    return if (monday.month == sunday.month) {
        "${monday.dayOfMonth}–${sunday.dayOfMonth} $endMonth ${sunday.year}"
    } else {
        "${monday.dayOfMonth} $startMonth – ${sunday.dayOfMonth} $endMonth ${sunday.year}"
    }
}
