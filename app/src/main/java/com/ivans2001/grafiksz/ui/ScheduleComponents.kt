package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ScheduleViewMode
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt

private val ruLocale = Locale("ru")
private val monthFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", ruLocale)

@Composable
fun ScheduleHeader(
    employeeName: String,
    month: YearMonth,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onImport: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = employeeName.ifBlank { "График СЗ" },
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                )
                Text(
                    text = month.format(monthFormatter).replaceFirstChar { it.uppercaseChar() },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            OutlinedButton(onClick = onImport) {
                Text("Вставить Excel")
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(onClick = onPrevious) { Text("‹ Назад") }
            Text(
                text = month.month.getDisplayName(TextStyle.FULL, ruLocale)
                    .replaceFirstChar { it.uppercaseChar() },
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            TextButton(onClick = onNext) { Text("Вперёд ›") }
        }
    }
}

@Composable
fun SummaryStrip(
    workingDays: Int,
    daysOff: Int,
    hours: Double,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        SummaryTile(workingDays.toString(), "рабочих", Modifier.weight(1f))
        SummaryTile(daysOff.toString(), "выходных", Modifier.weight(1f))
        SummaryTile(formatHours(hours), "часов", Modifier.weight(1f))
    }
}

@Composable
private fun SummaryTile(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.62f),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun ViewModeSelector(
    selected: ScheduleViewMode,
    onSelect: (ScheduleViewMode) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        listOf(
            ScheduleViewMode.MONTH to "Месяц",
            ScheduleViewMode.WEEK to "Неделя",
            ScheduleViewMode.LIST to "Список",
        ).forEach { pair ->
            FilterChip(
                selected = selected == pair.first,
                onClick = { onSelect(pair.first) },
                label = { Text(pair.second) },
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
fun MonthGrid(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
) {
    val leadingEmpty = month.atDay(1).dayOfWeek.value - 1
    val totalCells = leadingEmpty + month.lengthOfMonth()
    val rows = (totalCells + 6) / 7

    Column(modifier = Modifier.padding(horizontal = 12.dp)) {
        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс").forEach { label ->
                Text(
                    label,
                    modifier = Modifier.weight(1f).padding(vertical = 6.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        repeat(rows) { row ->
            Row(modifier = Modifier.fillMaxWidth()) {
                repeat(7) { column ->
                    val day = row * 7 + column - leadingEmpty + 1
                    if (day !in 1..month.lengthOfMonth()) {
                        Spacer(modifier = Modifier.weight(1f).aspectRatio(0.88f))
                    } else {
                        val date = month.atDay(day)
                        MonthDayCell(
                            date = date,
                            record = store.record(date),
                            onClick = { onDayClick(date) },
                            modifier = Modifier.weight(1f).aspectRatio(0.88f),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MonthDayCell(
    date: LocalDate,
    record: DayRecord?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = shift?.let { Color(it.color) }
        ?: statusColor(record?.status)
        ?: MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
    val isToday = date == LocalDate.now()

    Surface(
        modifier = modifier.padding(2.dp),
        shape = RoundedCornerShape(14.dp),
        color = if (isToday) {
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.48f)
        } else {
            MaterialTheme.colorScheme.surface
        },
        tonalElevation = if (isToday) 2.dp else 0.dp,
    ) {
        Column(
            modifier = Modifier.fillMaxSize().clickable(onClick = onClick).padding(7.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                date.dayOfMonth.toString(),
                style = MaterialTheme.typography.labelLarge,
                color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
            )
            if (record != null && !record.isEmpty) {
                Column {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(5.dp)
                            .background(accent, CircleShape),
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        when {
                            shift != null -> compactRange(shift.rangeLabel)
                            record.status != null -> record.status.shortCode
                            else -> ""
                        },
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = accent,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
fun WeekScheduleView(
    focusDate: LocalDate,
    store: ScheduleStore,
    onPreviousWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onDayClick: (LocalDate) -> Unit,
) {
    val start = focusDate.minusDays((focusDate.dayOfWeek.value - DayOfWeek.MONDAY.value).toLong())

    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = onPreviousWeek) { Text("‹ Неделя") }
            TextButton(onClick = onNextWeek) { Text("Неделя ›") }
        }

        (0L..6L).forEach { offset ->
            val date = start.plusDays(offset)
            ScheduleListRow(date, store.record(date)) { onDayClick(date) }
            if (offset < 6) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 56.dp),
                    color = MaterialTheme.colorScheme.outline.copy(alpha = 0.18f),
                )
            }
        }
    }
}

@Composable
fun MonthList(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        (1..month.lengthOfMonth()).forEach { day ->
            val date = month.atDay(day)
            ScheduleListRow(date, store.record(date)) { onDayClick(date) }
            if (day < month.lengthOfMonth()) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 56.dp),
                    color = MaterialTheme.colorScheme.outline.copy(alpha = 0.18f),
                )
            }
        }
    }
}

@Composable
private fun ScheduleListRow(
    date: LocalDate,
    record: DayRecord?,
    onClick: () -> Unit,
) {
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = shift?.let { Color(it.color) }
        ?: statusColor(record?.status)
        ?: MaterialTheme.colorScheme.outline
    val isToday = date == LocalDate.now()

    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.width(48.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                date.dayOfWeek.getDisplayName(TextStyle.SHORT, ruLocale).replace(".", "").uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Bold,
            )
            Text(
                date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleMedium,
                color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Black,
            )
        }

        Box(modifier = Modifier.width(4.dp).height(44.dp).background(accent, CircleShape))
        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                when {
                    shift != null -> shift.rangeLabel
                    record?.status != null -> record.status.title
                    else -> "Не заполнено"
                },
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (record == null) FontWeight.Normal else FontWeight.Bold,
                color = if (record == null) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
            )
            Text(
                when {
                    shift != null -> shift.title + " · " + shift.purpose
                    record?.note?.isNotBlank() == true -> record.note
                    else -> "Нажми, чтобы изменить"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if ((record?.overtimeMinutes ?: 0) > 0) {
            Text(
                "+" + formatMinutes(record!!.overtimeMinutes),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.error,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
fun statusColor(status: DayStatus?): Color? = when (status) {
    DayStatus.DAY_OFF -> Color(0xFF7A8192)
    DayStatus.VACATION -> Color(0xFF2E9D68)
    DayStatus.SICK -> Color(0xFFD84B45)
    DayStatus.STUDY -> Color(0xFF7A58C7)
    DayStatus.K_MARK -> Color(0xFF5671C8)
    null -> null
}

private fun compactRange(value: String): String = value.replace(":00", "").replace("00:00", "0")

private fun formatHours(hours: Double): String {
    val rounded = (hours * 10).roundToInt() / 10.0
    return if (rounded % 1.0 == 0.0) rounded.toInt().toString() else rounded.toString()
}

private fun formatMinutes(minutes: Int): String {
    val hours = minutes / 60
    val remainder = minutes % 60
    return when {
        remainder == 0 -> hours.toString() + " ч"
        hours == 0 -> remainder.toString() + " мин"
        else -> hours.toString() + " ч " + remainder.toString() + " мин"
    }
}
