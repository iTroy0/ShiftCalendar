package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.StatsPeriod
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
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

@OptIn(ExperimentalMaterial3Api::class)
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
            .padding(contentPadding),
    ) {
        TopAppBar(
            title = {
                Text(
                    text = "Итоги",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
            },
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
        ) {
            StatsPeriodSelector(
                selected = period,
                onSelect = { periodName = it.name },
            )

            StatsPeriodNavigator(
                label = if (period == StatsPeriod.MONTH) {
                    month.format(statsMonthFormatter).replaceFirstChar { it.uppercaseChar() }
                } else {
                    month.year.toString()
                },
                onPrevious = {
                    monthString = if (period == StatsPeriod.MONTH) {
                        month.minusMonths(1).toString()
                    } else {
                        YearMonth.of(month.year - 1, month.month).toString()
                    }
                },
                onNext = {
                    monthString = if (period == StatsPeriod.MONTH) {
                        month.plusMonths(1).toString()
                    } else {
                        YearMonth.of(month.year + 1, month.month).toString()
                    }
                },
            )

            WorkloadHero(stats)

            Spacer(modifier = Modifier.height(10.dp))

            InlineStats(stats)

            if (period == StatsPeriod.YEAR) {
                Spacer(modifier = Modifier.height(22.dp))
                SectionHeading(
                    title = "Нагрузка по месяцам",
                    subtitle = "Часы по графику и переработка",
                )
                Spacer(modifier = Modifier.height(10.dp))
                YearLoad(store = store, year = month.year)
            }

            Spacer(modifier = Modifier.height(22.dp))
            SectionHeading(
                title = "Типы смен",
                subtitle = "Какие смены встречались чаще",
            )
            Spacer(modifier = Modifier.height(10.dp))

            ShiftDistribution(stats)

            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
private fun StatsPeriodSelector(
    selected: StatsPeriod,
    onSelect: (StatsPeriod) -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .selectableGroup(),
        ) {
            listOf(
                StatsPeriod.MONTH to "Месяц",
                StatsPeriod.YEAR to "Год",
            ).forEach { pair ->
                val period = pair.first
                val label = pair.second
                val isSelected = selected == period

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .background(
                            color = if (isSelected) MaterialTheme.colorScheme.surface else Color.Transparent,
                            shape = RoundedCornerShape(12.dp),
                        )
                        .selectable(
                            selected = isSelected,
                            role = Role.RadioButton,
                            onClick = { onSelect(period) },
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun StatsPeriodNavigator(
    label: String,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onPrevious) {
            Icon(
                imageVector = Icons.Outlined.ChevronLeft,
                contentDescription = "Предыдущий период",
            )
        }
        Text(
            text = label,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        IconButton(onClick = onNext) {
            Icon(
                imageVector = Icons.Outlined.ChevronRight,
                contentDescription = "Следующий период",
            )
        }
    }
}

@Composable
private fun WorkloadHero(stats: PeriodStats) {
    val hours = stats.totalMinutes / 60.0
    val average = if (stats.workingDays > 0) hours / stats.workingDays else 0.0

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp),
        ) {
            Text(
                text = formatHoursStat(hours) + " ч",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = stats.workingDays.toString() + " рабочих дней · " +
                    formatHoursStat(average) + " ч в среднем",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f),
            )
        }
    }
}

@Composable
private fun InlineStats(stats: PeriodStats) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            InlineStat(
                value = stats.daysOff.toString(),
                label = "выходных",
                modifier = Modifier.weight(1f),
            )
            TinyDivider()
            InlineStat(
                value = formatHoursStat(stats.overtimeMinutes / 60.0),
                label = "ч переработки",
                modifier = Modifier.weight(1f),
            )
            TinyDivider()
            InlineStat(
                value = stats.leaveDays.toString(),
                label = "отсутствий",
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun InlineStat(
    value: String,
    label: String,
    modifier: Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun TinyDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(30.dp)
            .background(MaterialTheme.colorScheme.outlineVariant),
    )
}

@Composable
private fun SectionHeading(
    title: String,
    subtitle: String,
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
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
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp)
                .padding(horizontal = 10.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
            months.forEach { pair ->
                val label = pair.first.month
                    .getDisplayName(TextStyle.SHORT, statsLocale)
                    .replace(".", "")
                    .take(3)
                val value = pair.second.totalMinutes
                val fraction = if (value <= 0) 0f else value.toFloat() / maxMinutes

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Bottom,
                ) {
                    Box(
                        modifier = Modifier
                            .width(12.dp)
                            .weight(1f),
                        contentAlignment = Alignment.BottomCenter,
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .fillMaxHeight(fraction.coerceIn(0.04f, 1f))
                                .background(
                                    color = if (value > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                                    shape = RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp),
                                ),
                        )
                    }
                    Spacer(modifier = Modifier.height(7.dp))
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun ShiftDistribution(stats: PeriodStats) {
    val shifts = ShiftPool.all
        .filter { (stats.shiftCounts[it.id] ?: 0) > 0 }
        .sortedByDescending { stats.shiftCounts[it.id] ?: 0 }
    val maxCount = max(1, shifts.maxOfOrNull { stats.shiftCounts[it.id] ?: 0 } ?: 1)

    if (shifts.isEmpty()) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
        ) {
            Text(
                text = "За этот период рабочих смен нет.",
                modifier = Modifier.padding(16.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        return
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp),
        ) {
            shifts.forEachIndexed { index, shift ->
                val count = stats.shiftCounts[shift.id] ?: 0
                val fraction = count.toFloat() / maxCount

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .width(5.dp)
                            .height(46.dp)
                            .background(Color(shift.color), CircleShape),
                    )
                    Spacer(modifier = Modifier.width(11.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = shift.rangeLabel,
                                modifier = Modifier.weight(1f),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = count.toString(),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color(shift.color),
                            )
                        }

                        Text(
                            text = shift.purpose,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )

                        Spacer(modifier = Modifier.height(7.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(5.dp)
                                .background(
                                    MaterialTheme.colorScheme.surfaceVariant,
                                    CircleShape,
                                ),
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(fraction.coerceIn(0f, 1f))
                                    .height(5.dp)
                                    .background(Color(shift.color), CircleShape),
                            )
                        }
                    }
                }

                if (index < shifts.lastIndex) {
                    HorizontalDivider(
                        modifier = Modifier.padding(start = 16.dp),
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f),
                    )
                }
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
