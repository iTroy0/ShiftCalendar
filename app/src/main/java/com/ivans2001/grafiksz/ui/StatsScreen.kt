@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.StatsPeriod
import java.time.YearMonth
import java.time.format.TextStyle
import kotlin.math.max

private data class StatsData(
    val workDays: Int,
    val daysOff: Int,
    val absenceDays: Int,
    val totalMinutes: Int,
    val overtimeMinutes: Int,
    val shiftCounts: Map<String, Int>,
)

@Composable
fun StatsScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    var periodValue by rememberSaveable {
        mutableStateOf(StatsPeriod.MONTH.name)
    }
    var monthValue by rememberSaveable {
        mutableStateOf(YearMonth.now().toString())
    }

    val period = StatsPeriod.valueOf(periodValue)
    val month = YearMonth.parse(monthValue)
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
                    fontWeight = FontWeight.SemiBold,
                )
            },
        )

        TabRow(
            selectedTabIndex = if (period == StatsPeriod.MONTH) 0 else 1,
            containerColor = Color.Transparent,
            contentColor = MaterialTheme.colorScheme.primary,
            divider = {},
        ) {
            Tab(
                selected = period == StatsPeriod.MONTH,
                onClick = { periodValue = StatsPeriod.MONTH.name },
                modifier = Modifier.height(48.dp),
                text = { Text("Месяц") },
            )
            Tab(
                selected = period == StatsPeriod.YEAR,
                onClick = { periodValue = StatsPeriod.YEAR.name },
                modifier = Modifier.height(48.dp),
                text = { Text("Год") },
            )
        }

        PeriodNavigator(
            label = if (period == StatsPeriod.MONTH) {
                monthLabel(month)
            } else {
                month.year.toString()
            },
            onPrevious = {
                monthValue = if (period == StatsPeriod.MONTH) {
                    month.minusMonths(1).toString()
                } else {
                    YearMonth.of(month.year - 1, month.month).toString()
                }
            },
            onNext = {
                monthValue = if (period == StatsPeriod.MONTH) {
                    month.plusMonths(1).toString()
                } else {
                    YearMonth.of(month.year + 1, month.month).toString()
                }
            },
            modifier = Modifier.padding(horizontal = AppSpacing.xs),
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = AppSpacing.md,
                end = AppSpacing.md,
                bottom = AppSpacing.lg,
            ),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            item {
                WorkSummary(stats)
            }

            if (period == StatsPeriod.YEAR) {
                item {
                    YearOverview(
                        store = store,
                        year = month.year,
                    )
                }
            }

            item {
                SectionHeader(
                    title = "Смены",
                    subtitle = "Сколько раз встречался каждый тип смены.",
                )
            }

            val usedShifts = ShiftPool.all
                .filter { (stats.shiftCounts[it.id] ?: 0) > 0 }
                .sortedByDescending { stats.shiftCounts[it.id] ?: 0 }

            if (usedShifts.isEmpty()) {
                item {
                    Text(
                        text = "За выбранный период рабочих смен нет.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                items(
                    items = usedShifts,
                    key = { shift -> shift.id },
                ) { shift ->
                    val count = stats.shiftCounts[shift.id] ?: 0

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 56.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .width(5.dp)
                                .height(40.dp)
                                .background(Color(shift.color), CircleShape),
                        )

                        Spacer(modifier = Modifier.width(AppSpacing.sm))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = shift.rangeLabel,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = shift.purpose,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }

                        Text(
                            text = count.toString(),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkSummary(
    stats: StatsData,
) {
    val hours = stats.totalMinutes / 60.0
    val average = if (stats.workDays > 0) {
        hours / stats.workDays
    } else {
        0.0
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.lg),
        ) {
            Text(
                text = "${formatHours(hours)} ч",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )

            Text(
                text = "${stats.workDays} рабочих дней · ${formatHours(average)} ч в среднем",
                modifier = Modifier.padding(top = 2.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f),
            )

            HorizontalDivider(
                modifier = Modifier.padding(vertical = AppSpacing.md),
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.18f),
            )

            InlineMetrics(
                items = listOf(
                    stats.daysOff.toString() to "выходных",
                    formatHours(stats.overtimeMinutes / 60.0) to "ч переработки",
                    stats.absenceDays.toString() to "отсутствий",
                ),
            )
        }
    }
}

@Composable
private fun YearOverview(
    store: ScheduleStore,
    year: Int,
) {
    val months = (1..12).map { monthNumber ->
        val month = YearMonth.of(year, monthNumber)
        month to calculateStats(
            store = store,
            month = month,
            period = StatsPeriod.MONTH,
        )
    }
    val maxMinutes = max(
        1,
        months.maxOfOrNull { entry -> entry.second.totalMinutes } ?: 1,
    )

    Column {
        SectionHeader(
            title = "Нагрузка по месяцам",
            subtitle = "Рабочие часы вместе с переработкой.",
        )

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = AppSpacing.sm),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(168.dp)
                    .padding(
                        horizontal = AppSpacing.sm,
                        vertical = AppSpacing.md,
                    ),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                months.forEach { entry ->
                    val month = entry.first
                    val value = entry.second.totalMinutes
                    val fraction = if (value > 0) {
                        value.toFloat() / maxMinutes
                    } else {
                        0f
                    }

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
                                    .fillMaxHeight(
                                        fraction.coerceIn(
                                            minimumValue = if (value > 0) 0.05f else 0f,
                                            maximumValue = 1f,
                                        ),
                                    )
                                    .background(
                                        color = if (value > 0) {
                                            MaterialTheme.colorScheme.primary
                                        } else {
                                            MaterialTheme.colorScheme.outlineVariant
                                        },
                                        shape = RoundedCornerShape(
                                            topStart = 6.dp,
                                            topEnd = 6.dp,
                                        ),
                                    ),
                            )
                        }

                        Text(
                            text = month.month
                                .getDisplayName(TextStyle.SHORT, UiLocale)
                                .replace(".", "")
                                .take(3),
                            modifier = Modifier.padding(top = AppSpacing.xs),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

private fun calculateStats(
    store: ScheduleStore,
    month: YearMonth,
    period: StatsPeriod,
): StatsData {
    val records = store.records.filterKeys { date ->
        if (period == StatsPeriod.MONTH) {
            YearMonth.from(date) == month
        } else {
            date.year == month.year
        }
    }

    val shiftCounts = mutableMapOf<String, Int>()
    var workDays = 0
    var daysOff = 0
    var absenceDays = 0
    var totalMinutes = 0
    var overtimeMinutes = 0

    records.values.forEach { record ->
        record.shiftId?.let { shiftId ->
            workDays++
            shiftCounts[shiftId] = (shiftCounts[shiftId] ?: 0) + 1
            totalMinutes += ShiftPool.byId(shiftId)?.durationMinutes ?: 0
            overtimeMinutes += record.overtimeMinutes
            totalMinutes += record.overtimeMinutes
        }

        if (record.status == DayStatus.DAY_OFF) {
            daysOff++
        }

        if (
            record.status == DayStatus.VACATION ||
            record.status == DayStatus.SICK ||
            record.status == DayStatus.STUDY
        ) {
            absenceDays++
        }
    }

    return StatsData(
        workDays = workDays,
        daysOff = daysOff,
        absenceDays = absenceDays,
        totalMinutes = totalMinutes,
        overtimeMinutes = overtimeMinutes,
        shiftCounts = shiftCounts,
    )
}
