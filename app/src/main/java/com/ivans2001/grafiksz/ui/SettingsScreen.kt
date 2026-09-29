package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarViewWeek
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.AccentMode
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.ThemeMode
import com.ivans2001.grafiksz.ui.theme.accentPreviewColor
import com.ivans2001.grafiksz.widget.ScheduleWidgetPinning
import com.ivans2001.grafiksz.widget.ScheduleWidgetType
import com.ivans2001.grafiksz.widget.ScheduleWidgetUpdater

@Composable
fun SettingsScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    val context = LocalContext.current
    var poolExpanded by remember { mutableStateOf(false) }
    var confirmReset by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding),
    ) {
        TopAppBar(
            title = {
                Text(
                    text = "Настройки",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                )
            },
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = AppSpacing.md,
                end = AppSpacing.md,
                bottom = AppSpacing.xl,
            ),
            verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
        ) {
            item {
                Column {
                    SectionHeader(
                        title = "Оформление",
                        subtitle = "Тема и акцент приложения.",
                    )

                    Spacer(modifier = Modifier.height(AppSpacing.sm))

                    ThemeSelector(
                        selected = store.themeMode,
                        onSelect = store::updateThemeMode,
                    )

                    Spacer(modifier = Modifier.height(AppSpacing.md))

                    Text(
                        text = "Акцент",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Цвета смен не меняются вместе с темой.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    AccentSelector(
                        selected = store.accentMode,
                        onSelect = store::updateAccentMode,
                        modifier = Modifier.padding(top = AppSpacing.xs),
                    )
                }
            }

            item {
                Column {
                    SectionHeader(
                        title = "Виджеты",
                        subtitle = "Добавь нужный формат на главный экран.",
                    )

                    Spacer(modifier = Modifier.height(AppSpacing.xs))

                    WidgetSettingRow(
                        title = "Сегодня",
                        description = "Текущая смена и ближайшая следующая.",
                        icon = Icons.Outlined.Event,
                        onAdd = {
                            ScheduleWidgetPinning.request(
                                context,
                                ScheduleWidgetType.TODAY,
                            )
                        },
                    )

                    HorizontalDivider(
                        color = MaterialTheme.colorScheme.outlineVariant,
                    )

                    WidgetSettingRow(
                        title = "Ближайшие",
                        description = "Сегодня, завтра и следующая смена.",
                        icon = Icons.Outlined.ViewAgenda,
                        onAdd = {
                            ScheduleWidgetPinning.request(
                                context,
                                ScheduleWidgetType.UPCOMING,
                            )
                        },
                    )

                    HorizontalDivider(
                        color = MaterialTheme.colorScheme.outlineVariant,
                    )

                    WidgetSettingRow(
                        title = "Неделя",
                        description = "Понедельник–воскресенье в одной строке.",
                        icon = Icons.Outlined.CalendarViewWeek,
                        onAdd = {
                            ScheduleWidgetPinning.request(
                                context,
                                ScheduleWidgetType.WEEK,
                            )
                        },
                    )

                    OutlinedButton(
                        onClick = { ScheduleWidgetUpdater.updateAll(context) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = AppSpacing.sm)
                            .heightIn(min = 48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Refresh,
                            contentDescription = null,
                        )
                        Spacer(modifier = Modifier.width(AppSpacing.xs))
                        Text("Обновить виджеты")
                    }

                    if (!ScheduleWidgetPinning.isSupported(context)) {
                        Text(
                            text = "Этот лаунчер добавляет виджеты только через системное меню главного экрана.",
                            modifier = Modifier.padding(top = AppSpacing.xs),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            item {
                Column {
                    SectionHeader(
                        title = "Пул смен",
                        subtitle = "Времена и назначения фиксированы.",
                    )

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = AppSpacing.xs)
                            .clickable { poolExpanded = !poolExpanded },
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.50f),
                    ) {
                        Row(
                            modifier = Modifier.padding(AppSpacing.md),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = ShiftPool.all.size.toString() + " смен",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Text(
                                    text = "Цвета адаптированы из рабочего графика СЗ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }

                            Icon(
                                imageVector = if (poolExpanded) {
                                    Icons.Outlined.ExpandLess
                                } else {
                                    Icons.Outlined.ExpandMore
                                },
                                contentDescription = null,
                            )
                        }
                    }

                    if (poolExpanded) {
                        Column(
                            modifier = Modifier.padding(top = AppSpacing.xs),
                        ) {
                            ShiftPool.all.forEachIndexed { index, shift ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .heightIn(min = 54.dp)
                                        .padding(vertical = AppSpacing.xs),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
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
                                }

                                if (index < ShiftPool.all.lastIndex) {
                                    HorizontalDivider(
                                        modifier = Modifier.padding(start = 22.dp),
                                        color = MaterialTheme.colorScheme.outlineVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item {
                Column {
                    SectionHeader(
                        title = "Данные",
                        subtitle = "График хранится локально на устройстве.",
                    )

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = AppSpacing.xs),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.50f),
                    ) {
                        Column(
                            modifier = Modifier.padding(AppSpacing.md),
                        ) {
                            Text(
                                text = store.employeeName.ifBlank { "Личный график" },
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = store.records.size.toString() + " заполненных дней",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    OutlinedButton(
                        onClick = { confirmReset = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = AppSpacing.sm)
                            .heightIn(min = 48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.DeleteOutline,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                        )
                        Spacer(modifier = Modifier.width(AppSpacing.xs))
                        Text(
                            text = "Очистить весь график",
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }
        }
    }

    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("Очистить весь график?") },
            text = {
                Text("Будут удалены импортированные и добавленные вручную дни. Это действие нельзя отменить.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        store.clearAll()
                        confirmReset = false
                    },
                ) {
                    Text("Очистить")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmReset = false }) {
                    Text("Отмена")
                }
            },
        )
    }
}

@Composable
private fun ThemeSelector(
    selected: ThemeMode,
    onSelect: (ThemeMode) -> Unit,
) {
    val options = listOf(
        ThemeMode.SYSTEM to "Система",
        ThemeMode.LIGHT to "Светлая",
        ThemeMode.DARK to "Тёмная",
    )

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp),
        ) {
            options.forEach { option ->
                val isSelected = selected == option.first

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 48.dp)
                        .clickable { onSelect(option.first) },
                    shape = RoundedCornerShape(11.dp),
                    color = if (isSelected) {
                        MaterialTheme.colorScheme.surface
                    } else {
                        Color.Transparent
                    },
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = option.second,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = if (isSelected) {
                                FontWeight.SemiBold
                            } else {
                                FontWeight.Medium
                            },
                            color = if (isSelected) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AccentSelector(
    selected: AccentMode,
    onSelect: (AccentMode) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
    ) {
        AccentMode.values().forEach { mode ->
            val isSelected = selected == mode
            val preview = if (mode == AccentMode.DYNAMIC) {
                MaterialTheme.colorScheme.primary
            } else {
                accentPreviewColor(mode)
            }

            Surface(
                modifier = Modifier
                    .width(if (mode == AccentMode.DYNAMIC) 132.dp else 92.dp)
                    .heightIn(min = 72.dp)
                    .clickable { onSelect(mode) },
                shape = RoundedCornerShape(16.dp),
                color = if (isSelected) {
                    MaterialTheme.colorScheme.primaryContainer
                } else {
                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)
                },
            ) {
                Column(
                    modifier = Modifier.padding(AppSpacing.sm),
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    if (mode == AccentMode.DYNAMIC) {
                        Icon(
                            imageVector = Icons.Outlined.Palette,
                            contentDescription = null,
                            tint = preview,
                            modifier = Modifier.size(20.dp),
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .background(preview, CircleShape),
                        )
                    }

                    Spacer(modifier = Modifier.heightIn(min = 8.dp))

                    Text(
                        text = mode.title,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = if (isSelected) {
                            FontWeight.Bold
                        } else {
                            FontWeight.Medium
                        },
                        color = if (isSelected) {
                            MaterialTheme.colorScheme.onPrimaryContainer
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

@Composable
private fun WidgetSettingRow(
    title: String,
    description: String,
    icon: ImageVector,
    onAdd: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = AppSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(
            modifier = Modifier.size(44.dp),
            shape = RoundedCornerShape(14.dp),
            color = MaterialTheme.colorScheme.primaryContainer,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }
        }

        Spacer(modifier = Modifier.width(AppSpacing.sm))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        FilledTonalButton(
            onClick = onAdd,
            modifier = Modifier.heightIn(min = 48.dp),
        ) {
            Text("Добавить")
        }
    }
}
