@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.foundation.ExperimentalFoundationApi::class)

package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.TableView
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ScheduleViewMode
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle

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
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )

                if (employeeName.isNotBlank()) {
                    Text(
                        text = "Личный график",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        },
        actions = {
            FilledTonalButton(
                onClick = onImport,
                modifier = Modifier
                    .padding(end = AppSpacing.sm)
                    .heightIn(min = 48.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.TableView,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(AppSpacing.xs))
                Text("Добавить")
            }
        },
    )
}

@Composable
fun EmptyScheduleState(
    onImport: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = AppSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Surface(
            modifier = Modifier.size(72.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primaryContainer,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Outlined.CalendarMonth,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.size(34.dp),
                )
            }
        }

        Text(
            text = "Добавь свой график",
            modifier = Modifier.padding(top = AppSpacing.lg),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
        )

        Text(
            text = "Скопируй один столбик из Google Таблиц. Приложение разложит его по дням выбранного месяца.",
            modifier = Modifier.padding(top = AppSpacing.xs),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )

        FilledTonalButton(
            onClick = onImport,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = AppSpacing.lg)
                .heightIn(min = 52.dp),
        ) {
            Icon(
                imageVector = Icons.Outlined.Add,
                contentDescription = null,
            )
            Spacer(modifier = Modifier.width(AppSpacing.xs))
            Text("Добавить из Google Таблиц")
        }
    }
}

@Composable
fun CurrentDayPanel(
    date: LocalDate,
    record: DayRecord?,
    nextDate: LocalDate?,
    nextRecord: DayRecord?,
    onEdit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val accent = recordAccent(record)
    val primary = recordPrimary(record)
    val secondary = recordSecondary(record)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = AppSpacing.md),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.62f),
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.md),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .width(5.dp)
                        .height(58.dp)
                        .background(accent, CircleShape),
                )

                Spacer(modifier = Modifier.width(AppSpacing.sm))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Сегодня · ${date.dayOfMonth} " +
                            date.month.getDisplayName(TextStyle.SHORT, UiLocale).replace(".", ""),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Text(
                        text = primary,
                        modifier = Modifier.padding(top = 2.dp),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )

                    if (secondary.isNotBlank()) {
                        Text(
                            text = secondary,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }

                IconButton(onClick = onEdit) {
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Изменить сегодняшний день",
                    )
                }
            }

            if (nextDate != null && nextRecord != null) {
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = AppSpacing.sm),
                    color = MaterialTheme.colorScheme.outlineVariant,
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(recordAccent(nextRecord), CircleShape),
                    )
                    Spacer(modifier = Modifier.width(AppSpacing.xs))
                    Text(
                        text = "Следующая · ${nextDate.dayOfMonth} " +
                            nextDate.month.getDisplayName(TextStyle.SHORT, UiLocale).replace(".", "") +
                            " · " + recordPrimary(nextRecord),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
fun ScheduleModeTabs(
    selected: ScheduleViewMode,
    onSelect: (ScheduleViewMode) -> Unit,
    modifier: Modifier = Modifier,
) {
    val items = listOf(
        ScheduleViewMode.MONTH to "Месяц",
        ScheduleViewMode.WEEK to "Неделя",
        ScheduleViewMode.LIST to "Список",
    )
    val selectedIndex = items.indexOfFirst { it.first == selected }.coerceAtLeast(0)

    TabRow(
        selectedTabIndex = selectedIndex,
        modifier = modifier.fillMaxWidth(),
        containerColor = Color.Transparent,
        contentColor = MaterialTheme.colorScheme.primary,
        divider = {},
    ) {
        items.forEach { item ->
            Tab(
                selected = item.first == selected,
                onClick = { onSelect(item.first) },
                modifier = Modifier.height(48.dp),
                text = {
                    Text(
                        text = item.second,
                        fontWeight = if (item.first == selected) {
                            FontWeight.SemiBold
                        } else {
                            FontWeight.Medium
                        },
                    )
                },
            )
        }
    }
}

@Composable
fun MonthCalendar(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
    onDayLongPress: (LocalDate) -> Unit,
    onSwipePrevious: () -> Unit,
    onSwipeNext: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val leadingEmpty = month.atDay(1).dayOfWeek.value - 1
    val totalCells = leadingEmpty + month.lengthOfMonth()
    val rowCount = (totalCells + 6) / 7

    Column(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(month) {
                var total = 0f
                var gestureAllowed = true
                val threshold = 72.dp.toPx()
                val edgeGuard = 24.dp.toPx()

                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        total = 0f
                        gestureAllowed =
                            offset.x > edgeGuard &&
                                offset.x < size.width - edgeGuard
                    },
                    onHorizontalDrag = { _, amount ->
                        if (gestureAllowed) {
                            total += amount
                        }
                    },
                    onDragEnd = {
                        if (gestureAllowed && total <= -threshold) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSwipeNext()
                        }
                        if (gestureAllowed && total >= threshold) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSwipePrevious()
                        }
                        total = 0f
                    },
                    onDragCancel = {
                        total = 0f
                    },
                )
            }
            .verticalScroll(rememberScrollState())
            .padding(horizontal = AppSpacing.sm),
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

        repeat(rowCount) { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
            ) {
                repeat(7) { column ->
                    val day = (row * 7) + column - leadingEmpty + 1

                    if (day !in 1..month.lengthOfMonth()) {
                        Spacer(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(0.88f),
                        )
                    } else {
                        val date = month.atDay(day)

                        MonthDayCell(
                            date = date,
                            record = store.record(date),
                            onClick = { onDayClick(date) },
                            onLongPress = { onDayLongPress(date) },
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(0.88f),
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(AppSpacing.md))
    }
}

@Composable
private fun MonthDayCell(
    date: LocalDate,
    record: DayRecord?,
    onClick: () -> Unit,
    onLongPress: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = recordAccent(record)
    val isToday = date == LocalDate.now()

    val description = buildString {
        append(fullDateLabel(date))
        append(". ")
        append(recordPrimary(record))
        val secondary = recordSecondary(record)
        if (secondary.isNotBlank()) {
            append(". ")
            append(secondary)
        }
    }

    Column(
        modifier = modifier
            .padding(2.dp)
            .semantics { contentDescription = description }
            .combinedClickable(
                onClick = onClick,
                onLongClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    onLongPress()
                },
            )
            .padding(horizontal = 3.dp, vertical = 5.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Surface(
            modifier = Modifier.size(30.dp),
            shape = CircleShape,
            color = if (isToday) {
                MaterialTheme.colorScheme.primary
            } else {
                Color.Transparent
            },
        ) {
            Box(contentAlignment = Alignment.Center) {
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

                        if (record?.shiftId != null && record.overtimeMinutes > 0) {
                            Box(
                                modifier = Modifier
                                    .size(4.dp)
                                    .background(OvertimeColor, CircleShape),
                            )
                        }
                    }

                    Text(
                        text = compactRange(shift.rangeLabel),
                        modifier = Modifier.padding(top = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                    )
                }
            }

            record?.status != null -> {
                Text(
                    text = record.status.shortCode,
                    style = MaterialTheme.typography.labelSmall,
                    color = accent,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                )
            }

            else -> Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@Composable
fun WeekCalendar(
    focusDate: LocalDate,
    store: ScheduleStore,
    onDaySelect: (LocalDate) -> Unit,
    onEditDay: (LocalDate) -> Unit,
    onDayLongPress: (LocalDate) -> Unit,
    onSwipePrevious: () -> Unit,
    onSwipeNext: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val monday = focusDate.minusDays((focusDate.dayOfWeek.value - 1).toLong())
    val days = (0L..6L).map(monday::plusDays)
    val selectedRecord = store.record(focusDate)

    Column(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(focusDate) {
                var total = 0f
                var gestureAllowed = true
                val threshold = 72.dp.toPx()
                val edgeGuard = 24.dp.toPx()

                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        total = 0f
                        gestureAllowed =
                            offset.x > edgeGuard &&
                                offset.x < size.width - edgeGuard
                    },
                    onHorizontalDrag = { _, amount ->
                        if (gestureAllowed) {
                            total += amount
                        }
                    },
                    onDragEnd = {
                        if (gestureAllowed && total <= -threshold) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSwipeNext()
                        }
                        if (gestureAllowed && total >= threshold) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onSwipePrevious()
                        }
                        total = 0f
                    },
                    onDragCancel = {
                        total = 0f
                    },
                )
            },
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = AppSpacing.sm),
            horizontalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            days.forEach { date ->
                WeekDayTile(
                    date = date,
                    record = store.record(date),
                    selected = date == focusDate,
                    onClick = { onDaySelect(date) },
                    onLongPress = { onDayLongPress(date) },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        SelectedDayDetails(
            date = focusDate,
            record = selectedRecord,
            onEdit = { onEditDay(focusDate) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    start = AppSpacing.md,
                    end = AppSpacing.md,
                    top = AppSpacing.md,
                ),
        )
    }
}

@Composable
private fun WeekDayTile(
    date: LocalDate,
    record: DayRecord?,
    selected: Boolean,
    onClick: () -> Unit,
    onLongPress: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val shift = ShiftPool.byId(record?.shiftId)
    val accent = recordAccent(record)
    val isToday = date == LocalDate.now()

    Surface(
        modifier = modifier
            .height(108.dp)
            .combinedClickable(
                onClick = onClick,
                onLongClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    onLongPress()
                },
            ),
        shape = RoundedCornerShape(18.dp),
        color = if (selected) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.surface
        },
        border = if (isToday && !selected) {
            BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
        } else {
            null
        },
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = date.dayOfWeek
                    .getDisplayName(TextStyle.SHORT, UiLocale)
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

            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleLarge,
                color = if (selected) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                fontWeight = FontWeight.Bold,
            )

            Box(
                modifier = Modifier
                    .width(24.dp)
                    .height(4.dp)
                    .background(accent, CircleShape),
            )

            Text(
                text = when {
                    shift != null -> compactRange(shift.rangeLabel)
                    record?.status != null -> record.status.shortCode
                    else -> "—"
                },
                style = MaterialTheme.typography.labelSmall,
                color = if (record == null) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    accent
                },
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun SelectedDayDetails(
    date: LocalDate,
    record: DayRecord?,
    onEdit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = recordAccent(record)
    val primary = recordPrimary(record)
    val secondary = recordSecondary(record)

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.md),
        ) {
            Row(
                verticalAlignment = Alignment.Top,
            ) {
                Box(
                    modifier = Modifier
                        .width(5.dp)
                        .height(54.dp)
                        .background(accent, CircleShape),
                )

                Spacer(modifier = Modifier.width(AppSpacing.sm))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = fullDateLabel(date),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = primary,
                        modifier = Modifier.padding(top = 2.dp),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    if (secondary.isNotBlank()) {
                        Text(
                            text = secondary,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }

            if (
                (record?.shiftId != null && record.overtimeMinutes > 0) ||
                record?.note?.isNotBlank() == true
            ) {
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = AppSpacing.sm),
                    color = MaterialTheme.colorScheme.outlineVariant,
                )

                if (record?.shiftId != null && record.overtimeMinutes > 0) {
                    Text(
                        text = "Переработка +${formatMinutes(record!!.overtimeMinutes)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OvertimeColor,
                        fontWeight = FontWeight.SemiBold,
                    )
                }

                if (record?.note?.isNotBlank() == true) {
                    Text(
                        text = record.note,
                        modifier = Modifier.padding(
                            top = if (record.shiftId != null && record.overtimeMinutes > 0) {
                                4.dp
                            } else {
                                0.dp
                            },
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            FilledTonalButton(
                onClick = onEdit,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = AppSpacing.md)
                    .heightIn(min = 48.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.Edit,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.width(AppSpacing.xs))
                Text("Изменить день")
            }
        }
    }
}

@Composable
fun MonthScheduleList(
    month: YearMonth,
    store: ScheduleStore,
    onDayClick: (LocalDate) -> Unit,
    onDayLongPress: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
) {
    val dates = (1..month.lengthOfMonth()).map(month::atDay)

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = AppSpacing.md,
            end = AppSpacing.md,
            bottom = AppSpacing.lg,
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
                onLongPress = { onDayLongPress(date) },
            )

            if (date.dayOfMonth < month.lengthOfMonth()) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 64.dp),
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.7f),
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
    onLongPress: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    val accent = recordAccent(record)
    val primary = recordPrimary(record)
    val secondary = recordSecondary(record)
    val isToday = date == LocalDate.now()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 72.dp)
            .combinedClickable(
                onClick = onClick,
                onLongClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    onLongPress()
                },
            )
            .padding(vertical = AppSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(
            modifier = Modifier.width(52.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = date.dayOfWeek
                    .getDisplayName(TextStyle.SHORT, UiLocale)
                    .replace(".", "")
                    .uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = if (isToday) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                },
                fontWeight = FontWeight.SemiBold,
            )

            Text(
                text = date.dayOfMonth.toString(),
                style = MaterialTheme.typography.titleLarge,
                color = if (isToday) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                fontWeight = FontWeight.Bold,
            )
        }

        Box(
            modifier = Modifier
                .width(4.dp)
                .height(44.dp)
                .background(accent, CircleShape),
        )

        Spacer(modifier = Modifier.width(AppSpacing.sm))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = primary,
                style = MaterialTheme.typography.titleMedium,
                color = if (record == null) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                fontWeight = if (record == null) FontWeight.Medium else FontWeight.SemiBold,
            )

            Text(
                text = secondary.ifBlank { "Нажми, чтобы изменить" },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }

        if ((record?.overtimeMinutes ?: 0) > 0) {
            Text(
                text = "+${formatMinutes(record!!.overtimeMinutes)}",
                style = MaterialTheme.typography.labelLarge,
                color = OvertimeColor,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}
