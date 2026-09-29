package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ParsedCell
import com.ivans2001.grafiksz.data.ParsedImport
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ScheduleViewMode
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.LocalDate
import java.time.YearMonth

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
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
        ) {
            ScheduleHeader(
                employeeName = store.employeeName,
                month = month,
                onPrevious = goPrevious,
                onNext = goNext,
                onToday = goToday,
                onImport = { showImport = true },
            )

            SummaryStrip(
                workingDays = workingDays,
                daysOff = daysOff,
                hours = totalMinutes / 60.0,
            )

            ViewModeSelector(
                selected = viewMode,
                onSelect = { viewModeName = it.name },
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .pointerInput(viewModeName, monthString, focusDateString) {
                        var totalDrag = 0f
                        val threshold = 72.dp.toPx()

                        detectHorizontalDragGestures(
                            onDragStart = { totalDrag = 0f },
                            onHorizontalDrag = { _, dragAmount ->
                                totalDrag += dragAmount
                            },
                            onDragEnd = {
                                when {
                                    totalDrag <= -threshold -> goNext()
                                    totalDrag >= threshold -> goPrevious()
                                }
                                totalDrag = 0f
                            },
                            onDragCancel = { totalDrag = 0f },
                        )
                    },
            ) {
                when (viewMode) {
                    ScheduleViewMode.MONTH -> MonthGrid(
                        month = month,
                        store = store,
                        onDayClick = { date ->
                            focusDateString = date.toString()
                            editingDateString = date.toString()
                        },
                    )

                    ScheduleViewMode.WEEK -> WeekScheduleView(
                        focusDate = if (YearMonth.from(focusDate) == month) focusDate else month.atDay(1),
                        store = store,
                        onPreviousWeek = goPrevious,
                        onNextWeek = goNext,
                        onDayClick = { date ->
                            focusDateString = date.toString()
                            monthString = YearMonth.from(date).toString()
                            editingDateString = date.toString()
                        },
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

            Spacer(modifier = Modifier.height(24.dp))
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
            month = month,
            onDismiss = { showImport = false },
            onApply = { imported: ParsedImport, mappings: Map<String, String> ->
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
                    month = month,
                    imported = records,
                    importedEmployeeName = imported.employeeName,
                )
                showImport = false
            },
        )
    }
}
