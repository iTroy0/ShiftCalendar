package com.ivans2001.grafiksz.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.ContentPaste
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ScheduleViewMode
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.ui.theme.SchedulePalette
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt

private val scheduleUiLocale = Locale("ru")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleTopBar(
    employeeName: String,
    onImport: () -> Unit,
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = employeeName.ifBlank { "График СЗ" },
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
                if (employeeName.isNotBlank()) {
                    Text(
                        text = "График СЗ",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        },
        actions = {
            FilledTonalButton(
                onClick = onImport,
                modifier = Modifier.padding(end = 8.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.ContentPaste,
                    contentDescription = null,
                    modifier = Modifier.width(18.dp),
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Таблицы")
            }
        },
    )
}

@Composable
fun FirstRunImportCard(
    onImport: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
        ) {
            Text(
                text = "Сделай график своим",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = "Скопируй свой столбец из листа СЗ01…СЗ12 вместе с ФИО и вставь сюда. Приложение соберёт личный календарь на месяц.",
                modifier = Modifier.padding(top = 4.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f),
            )

            FilledTonalButton(
                onClick = onImport,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 14.dp)
                    .heightIn(min = 52.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.ContentPaste,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Вставить график")
            }
        }
    }
}

@Composable
fun TodayOverview(
    date: LocalDate,
    record: DayRecord?,
    nextDate: LocalDate?,
    nextRecord: DayRecord?,
    onEdit: () -> Unit,
) {
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = shift?.let { Color(it.color) }
        ?: statusColor(record?.status)
        ?: MaterialTheme.colorScheme.outlineVariant

    val nextShift = ShiftPool.byId(nextRecord?.shiftId)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .width(5.dp)
                        .height(52.dp)
                        .background(accent, CircleShape),
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Сегодня · " + date.dayOfMonth + " " +
                            date.month
                                .getDisplayName(TextStyle.SHORT, scheduleUiLocale)
                                .replace(".", ""),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = when {
                            shift != null -> shift.rangeLabel
                            record?.status != null -> record.status.title
                            else -> "Смена не назначена"
                        },
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    if (shift != null) {
                        Text(
                            text = shift.purpose,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }

                IconButton(
                    onClick = onEdit,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Изменить сегодняшний день",
                    )
                }
            }

            if (nextDate != null && nextShift != null) {
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 12.dp),
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.65f),
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(Color(nextShift.color), CircleShape),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Следующая: " +
                            nextDate.dayOfMonth + " " +
                            nextDate.month
                                .getDisplayName(TextStyle.SHORT, scheduleUiLocale)
                                .replace(".", "") +
                            " · " + nextShift.rangeLabel,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }
    }
}

@Composable
fun PeriodNavigator(
    label: String,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onToday: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 2.dp),
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
            maxLines = 1,
        )

        TextButton(onClick = onToday) {
            Text("Сегодня")
        }

        IconButton(onClick = onNext) {
            Icon(
                imageVector = Icons.Outlined.ChevronRight,
                contentDescription = "Следующий период",
            )
        }
    }
}

@Composable
fun PeriodSummaryLine(
    workingDays: Int,
    daysOff: Int,
    hours: Double,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        CompactSummaryItem(
            value = workingDays.toString(),
            label = "смен",
        )
        SummaryDot()
        CompactSummaryItem(
            value = formatHours(hours),
            label = "ч",
        )
        SummaryDot()
        CompactSummaryItem(
            value = daysOff.toString(),
            label = "выходных",
        )
    }
}

@Composable
private fun CompactSummaryItem(
    value: String,
    label: String,
) {
    Text(
        text = "$value $label",
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontWeight = FontWeight.Medium,
    )
}

@Composable
private fun SummaryDot() {
    Box(
        modifier = Modifier
            .padding(horizontal = 9.dp)
            .size(3.dp)
            .background(
                MaterialTheme.colorScheme.outline,
                CircleShape,
            ),
    )
}

@Composable
fun ViewModeSelector(
    selected: ScheduleViewMode,
    onSelect: (ScheduleViewMode) -> Unit,
) {
    val options = listOf(
        ScheduleViewMode.MONTH to "Месяц",
        ScheduleViewMode.WEEK to "Неделя",
        ScheduleViewMode.LIST to "Список",
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .selectableGroup(),
        ) {
            options.forEach { pair ->
                val mode = pair.first
                val label = pair.second
                val isSelected = selected == mode
                val background by animateColorAsState(
                    targetValue = if (isSelected) MaterialTheme.colorScheme.surface else Color.Transparent,
                    label = "viewModeColor",
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .background(background, RoundedCornerShape(12.dp))
                        .selectable(
                            selected = isSelected,
                            role = Role.RadioButton,
                            onClick = { onSelect(mode) },
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
fun MonthGrid(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
    onSwipePrevious: () -> Unit,
    onSwipeNext: () -> Unit,
) {
    val leadingEmpty = month.atDay(1).dayOfWeek.value - 1
    val totalCells = leadingEmpty + month.lengthOfMonth()
    val rows = (totalCells + 6) / 7

    Surface(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .pointerInput(month) {
                var total = 0f
                val threshold = 72.dp.toPx()
                detectHorizontalDragGestures(
                    onDragStart = { total = 0f },
                    onHorizontalDrag = { _, amount -> total += amount },
                    onDragEnd = {
                        if (total <= -threshold) onSwipeNext()
                        if (total >= threshold) onSwipePrevious()
                        total = 0f
                    },
                    onDragCancel = { total = 0f },
                )
            },
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp, vertical = 8.dp),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(34.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                listOf("Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс").forEach { label ->
                    Text(
                        text = label,
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                    )
                }
            }

            repeat(rows) { row ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                ) {
                    repeat(7) { column ->
                        val day = row * 7 + column - leadingEmpty + 1
                        if (day !in 1..month.lengthOfMonth()) {
                            Spacer(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxSize(),
                            )
                        } else {
                            val date = month.atDay(day)
                            MonthDayCell(
                                date = date,
                                record = store.record(date),
                                onClick = { onDayClick(date) },
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxSize(),
                            )
                        }
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
        ?: MaterialTheme.colorScheme.outlineVariant
    val isToday = date == LocalDate.now()

    Column(
        modifier = modifier
            .padding(2.dp)
            .clickable(onClick = onClick)
            .padding(horizontal = 3.dp, vertical = 5.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .background(
                    color = if (isToday) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        Color.Transparent
                    },
                    shape = CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.labelLarge,
                color = if (isToday) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Medium,
            )
        }

        when {
            shift != null -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .width(18.dp)
                                .height(4.dp)
                                .background(accent, CircleShape),
                        )

                        if ((record?.overtimeMinutes ?: 0) > 0) {
                            Box(
                                modifier = Modifier
                                    .size(4.dp)
                                    .background(
                                        Color(SchedulePalette.Overtime),
                                        CircleShape,
                                    ),
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(3.dp))

                    Text(
                        text = compactRange(shift.rangeLabel),
                        style = MaterialTheme.typography.labelMedium,
                        color = accent,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
            }

            record?.status != null -> {
                Text(
                    text = record.status.shortCode,
                    style = MaterialTheme.typography.labelMedium,
                    color = accent,
                    fontWeight = FontWeight.Bold,
                )
            }

            else -> Spacer(modifier = Modifier.height(18.dp))
        }
    }
}

@Composable
fun WeekScheduleView(
    focusDate: LocalDate,
    store: ScheduleStore,
    onDaySelect: (LocalDate) -> Unit,
    onEditDay: (LocalDate) -> Unit,
    onSwipePrevious: () -> Unit,
    onSwipeNext: () -> Unit,
) {
    val monday = focusDate.minusDays((focusDate.dayOfWeek.value - 1).toLong())
    val days = (0L..6L).map(monday::plusDays)
    val currentRecord = store.record(focusDate)
    val currentShift = ShiftPool.byId(currentRecord?.shiftId)
    val currentAccent = currentShift?.let { Color(it.color) }
        ?: statusColor(currentRecord?.status)
        ?: MaterialTheme.colorScheme.outlineVariant

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .pointerInput(focusDate) {
                var total = 0f
                val threshold = 72.dp.toPx()
                detectHorizontalDragGestures(
                    onDragStart = { total = 0f },
                    onHorizontalDrag = { _, amount -> total += amount },
                    onDragEnd = {
                        if (total <= -threshold) onSwipeNext()
                        if (total >= threshold) onSwipePrevious()
                        total = 0f
                    },
                    onDragCancel = { total = 0f },
                )
            },
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            color = MaterialTheme.colorScheme.surface,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(5.dp),
                horizontalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                days.forEach { date ->
                    WeekDayCell(
                        date = date,
                        record = store.record(date),
                        selected = date == focusDate,
                        onClick = { onDaySelect(date) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.56f),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .width(5.dp)
                        .height(48.dp)
                        .background(currentAccent, CircleShape),
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = focusDate.dayOfWeek
                            .getDisplayName(TextStyle.FULL, scheduleUiLocale)
                            .replaceFirstChar { it.uppercaseChar() } +
                            ", " + focusDate.dayOfMonth + " " +
                            focusDate.month.getDisplayName(TextStyle.FULL, scheduleUiLocale),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Text(
                        text = when {
                            currentShift != null -> currentShift.rangeLabel
                            currentRecord?.status != null -> currentRecord.status.title
                            else -> "Смена не назначена"
                        },
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )

                    val detail = when {
                        currentShift != null -> currentShift.purpose
                        currentRecord?.note?.isNotBlank() == true -> currentRecord.note
                        else -> "Нажми на карандаш, чтобы изменить день"
                    }

                    Text(
                        text = detail,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }

                IconButton(
                    onClick = { onEditDay(focusDate) },
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Изменить выбранный день",
                    )
                }
            }
        }
    }
}

@Composable
private fun WeekDayCell(
    date: LocalDate,
    record: DayRecord?,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier,
) {
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = shift?.let { Color(it.color) }
        ?: statusColor(record?.status)
        ?: MaterialTheme.colorScheme.outlineVariant
    val isToday = date == LocalDate.now()
    val background by animateColorAsState(
        targetValue = if (selected) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            Color.Transparent
        },
        label = "weekDayBackground",
    )

    Column(
        modifier = modifier
            .height(108.dp)
            .background(background, RoundedCornerShape(15.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 2.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = date.dayOfWeek
                .getDisplayName(TextStyle.SHORT, scheduleUiLocale)
                .replace(".", "")
                .replaceFirstChar { it.uppercaseChar() },
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) {
                MaterialTheme.colorScheme.onPrimaryContainer
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            },
            fontWeight = if (isToday) FontWeight.Bold else FontWeight.Medium,
        )

        Box(
            modifier = Modifier
                .size(30.dp)
                .background(
                    color = when {
                        isToday && !selected -> MaterialTheme.colorScheme.primary
                        else -> Color.Transparent
                    },
                    shape = CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = when {
                    isToday && !selected -> MaterialTheme.colorScheme.onPrimary
                    selected -> MaterialTheme.colorScheme.onPrimaryContainer
                    else -> MaterialTheme.colorScheme.onSurface
                },
            )
        }

        Box(
            modifier = Modifier
                .width(20.dp)
                .height(4.dp)
                .background(accent, CircleShape),
        )

        Text(
            text = when {
                shift != null -> compactRange(shift.rangeLabel)
                record?.status != null -> record.status.shortCode
                else -> "—"
            },
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = if (record == null) {
                MaterialTheme.colorScheme.onSurfaceVariant
            } else {
                accent
            },
            maxLines = 1,
        )
    }
}

@Composable
fun MonthList(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
) {
    val dates = (1..month.lengthOfMonth()).map(month::atDay)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = 4.dp,
            bottom = 20.dp,
        ),
    ) {
        items(
            items = dates,
            key = { it.toString() },
        ) { date ->
            ScheduleListRow(
                date = date,
                record = store.record(date),
                onClick = { onDayClick(date) },
            )
            if (date.dayOfMonth < month.lengthOfMonth()) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 58.dp),
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.55f),
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
        ?: MaterialTheme.colorScheme.outlineVariant
    val isToday = date == LocalDate.now()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 68.dp)
            .clickable(onClick = onClick)
            .padding(vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            modifier = Modifier.width(48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = date.dayOfWeek
                    .getDisplayName(TextStyle.SHORT, scheduleUiLocale)
                    .replace(".", "")
                    .uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleLarge,
                color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
            )
        }

        Box(
            modifier = Modifier
                .width(4.dp)
                .height(42.dp)
                .background(accent, CircleShape),
        )

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = when {
                    shift != null -> shift.rangeLabel
                    record?.status != null -> record.status.title
                    else -> "Не заполнено"
                },
                style = MaterialTheme.typography.titleMedium,
                color = if (record == null) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (record == null) FontWeight.Medium else FontWeight.SemiBold,
            )

            Text(
                text = when {
                    shift != null -> shift.purpose
                    record?.note?.isNotBlank() == true -> record.note
                    else -> "Нажми, чтобы изменить"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if ((record?.overtimeMinutes ?: 0) > 0) {
            Text(
                text = "+" + formatMinutes(record!!.overtimeMinutes),
                style = MaterialTheme.typography.labelLarge,
                color = Color(SchedulePalette.Overtime),
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
fun statusColor(status: DayStatus?): Color? = when (status) {
    DayStatus.DAY_OFF -> Color(0xFF747B8A)
    DayStatus.VACATION -> Color(0xFF27815B)
    DayStatus.SICK -> Color(0xFFC9463F)
    DayStatus.STUDY -> Color(0xFF7456B7)
    DayStatus.K_MARK -> Color(0xFF5268B8)
    null -> null
}

private fun compactRange(value: String): String = value
    .replace(":00", "")
    .replace("00:00", "0")

private fun formatHours(hours: Double): String {
    val rounded = (hours * 10).roundToInt() / 10.0
    return if (rounded % 1.0 == 0.0) rounded.toInt().toString() else rounded.toString()
}

private fun formatMinutes(minutes: Int): String {
    val hours = minutes / 60
    val remainder = minutes % 60
    return when {
        remainder == 0 -> "$hours ч"
        hours == 0 -> "$remainder мин"
        else -> "$hours ч $remainder мин"
    }
}
