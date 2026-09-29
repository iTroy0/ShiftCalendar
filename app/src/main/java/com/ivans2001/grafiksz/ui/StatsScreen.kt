package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.StatsPeriod
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToInt

private val statsLocale = Locale("ru")
private val statsMonthFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", statsLocale)

private data class PeriodStats(
    val workingDays: Int,
    val daysOff: Int,
    val leaveDays: Int,
    val totalMinutes: Int,
    val overtimeMinutes: Int,
    val shiftCounts: Map<String, Int>,
)

@Composable
fun StatsScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    var periodName by rememberSaveable { mutableStateOf(StatsPeriod.MONTH.name) }
    var monthString by rememberSaveable { mutableStateOf(YearMonth.now().toString()) }

    val period = StatsPeriod.valueOf(periodName)
    val month = YearMonth.parse(monthString)
    val stats = calculateStats(store, month, period)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Text(
            "Итоги",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
        )
        Text(
            if (period == StatsPeriod.MONTH) {
                month.format(statsMonthFormatter).replaceFirstChar { it.uppercaseChar() }
            } else {
                month.year.toString()
            },
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = period == StatsPeriod.MONTH,
                onClick = { periodName = StatsPeriod.MONTH.name },
                label = { Text("Месяц") },
                modifier = Modifier.weight(1f),
            )
            FilterChip(
                selected = period == StatsPeriod.YEAR,
                onClick = { periodName = StatsPeriod.YEAR.name },
                label = { Text("Год") },
                modifier = Modifier.weight(1f),
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            TextButton(
                onClick = {
                    monthString = if (period == StatsPeriod.MONTH) {
                        month.minusMonths(1).toString()
                    } else {
                        YearMonth.of(month.year - 1, month.month).toString()
                    }
                },
            ) { Text("‹ Назад") }

            TextButton(
                onClick = {
                    monthString = if (period == StatsPeriod.MONTH) {
                        month.plusMonths(1).toString()
                    } else {
                        YearMonth.of(month.year + 1, month.month).toString()
                    }
                },
            ) { Text("Вперёд ›") }
        }

        MetricGrid(stats)

        if (period == StatsPeriod.YEAR) {
            Spacer(modifier = Modifier.height(18.dp))
            Text(
                "Нагрузка по месяцам",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Spacer(modifier = Modifier.height(8.dp))
            YearLoad(store = store, year = month.year)
        }

        Spacer(modifier = Modifier.height(18.dp))
        Text(
            "Типы смен",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
        )
        Spacer(modifier = Modifier.height(8.dp))

        val maxCount = max(1, stats.shiftCounts.values.maxOrNull() ?: 1)
        ShiftPool.all
            .filter { (stats.shiftCounts[it.id] ?: 0) > 0 }
            .sortedByDescending { stats.shiftCounts[it.id] ?: 0 }
            .forEachIndexed { index, shift ->
                val count = stats.shiftCounts[shift.id] ?: 0
                ShiftStatRow(
                    title = shift.rangeLabel,
                    subtitle = shift.title + " · " + shift.purpose,
                    count = count,
                    fraction = count.toFloat() / maxCount,
                    color = Color(shift.color),
                )
                if (index < stats.shiftCounts.size - 1) {
                    HorizontalDivider(
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
                    )
                }
            }

        if (stats.shiftCounts.isEmpty()) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            ) {
                Text(
                    "За этот период рабочих смен нет.",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))
    }
}

@Composable
private fun MetricGrid(stats: PeriodStats) {
    val hours = stats.totalMinutes / 60.0
    val overtime = stats.overtimeMinutes / 60.0
    val average = if (stats.workingDays > 0) hours / stats.workingDays else 0.0

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile(stats.workingDays.toString(), "рабочих дней", Modifier.weight(1f))
            StatTile(formatHoursStat(hours), "часов", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile(stats.daysOff.toString(), "выходных", Modifier.weight(1f))
            StatTile(formatHoursStat(overtime), "переработка, ч", Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile(formatHoursStat(average), "часов / день", Modifier.weight(1f))
            StatTile(stats.leaveDays.toString(), "отпуск / больничный / сессия", Modifier.weight(1f))
        }
    }
}

@Composable
private fun StatTile(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
            )
            Text(
                label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun YearLoad(
    store: ScheduleStore,
    year: Int,
) {
    val months = (1..12).map { monthNumber ->
        val month = YearMonth.of(year, monthNumber)
        month to calculateStats(store, month, StatsPeriod.MONTH)
    }
    val maxMinutes = max(1, months.maxOfOrNull { it.second.totalMinutes } ?: 1)

    Surface(
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp)) {
            months.forEach { pair ->
                val label = pair.first.month
                    .getDisplayName(java.time.format.TextStyle.SHORT, statsLocale)
                    .replace(".", "")
                    .replaceFirstChar { it.uppercaseChar() }
                val value = pair.second.totalMinutes

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                ) {
                    Text(label, modifier = Modifier.width(38.dp), fontWeight = FontWeight.Bold)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(8.dp)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant,
                                CircleShape,
                            ),
                    ) {
                        if (value > 0) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(value.toFloat() / maxMinutes)
                                    .height(8.dp)
                                    .background(MaterialTheme.colorScheme.primary, CircleShape),
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        formatHoursStat(value / 60.0),
                        modifier = Modifier.width(46.dp),
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

@Composable
private fun ShiftStatRow(
    title: String,
    subtitle: String,
    count: Int,
    fraction: Float,
    color: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
    ) {
        Box(
            modifier = Modifier
                .width(5.dp)
                .height(48.dp)
                .background(color, CircleShape),
        )
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(title, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                Text(count.toString(), fontWeight = FontWeight.Black, color = color)
            }
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction.coerceIn(0f, 1f))
                        .height(5.dp)
                        .background(color, CircleShape),
                )
            }
        }
    }
}

private fun calculateStats(
    store: ScheduleStore,
    month: YearMonth,
    period: StatsPeriod,
): PeriodStats {
    val records = store.records.filterKeys { date ->
        if (period == StatsPeriod.MONTH) {
            YearMonth.from(date) == month
        } else {
            date.year == month.year
        }
    }

    val shiftCounts = mutableMapOf<String, Int>()
    var workingDays = 0
    var daysOff = 0
    var leaveDays = 0
    var totalMinutes = 0
    var overtimeMinutes = 0

    records.values.forEach { record ->
        record.shiftId?.let { shiftId ->
            workingDays++
            shiftCounts[shiftId] = (shiftCounts[shiftId] ?: 0) + 1
            totalMinutes += ShiftPool.byId(shiftId)?.durationMinutes ?: 0
        }

        if (record.status == DayStatus.DAY_OFF) {
            daysOff++
        }

        if (
            record.status == DayStatus.VACATION
            || record.status == DayStatus.SICK
            || record.status == DayStatus.STUDY
        ) {
            leaveDays++
        }

        overtimeMinutes += record.overtimeMinutes
        totalMinutes += record.overtimeMinutes
    }

    return PeriodStats(
        workingDays = workingDays,
        daysOff = daysOff,
        leaveDays = leaveDays,
        totalMinutes = totalMinutes,
        overtimeMinutes = overtimeMinutes,
        shiftCounts = shiftCounts,
    )
}

private fun formatHoursStat(value: Double): String {
    val rounded = (value * 10).roundToInt() / 10.0
    return if (rounded % 1.0 == 0.0) rounded.toInt().toString() else rounded.toString()
}
