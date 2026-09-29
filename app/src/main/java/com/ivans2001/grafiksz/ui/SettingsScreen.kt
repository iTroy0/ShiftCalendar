package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarViewWeek
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material.icons.outlined.Widgets
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.ThemeMode
import com.ivans2001.grafiksz.widget.ScheduleWidgetPinning
import com.ivans2001.grafiksz.widget.ScheduleWidgetType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    val context = LocalContext.current
    var confirmReset by remember { mutableStateOf(false) }
    var poolExpanded by remember { mutableStateOf(false) }

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
            SectionHeadingSettings(
                title = "Оформление",
                subtitle = "Тема интерфейса",
            )
            Spacer(modifier = Modifier.height(10.dp))

            ThemeSelector(
                selected = store.themeMode,
                onSelect = store::updateThemeMode,
            )

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeadingSettings(
                title = "Виджеты",
                subtitle = "Выбери формат под свой главный экран",
            )
            Spacer(modifier = Modifier.height(10.dp))

            WidgetChoiceCard(
                title = "Сегодня",
                description = "Компактно: текущая смена, назначение и ближайшая следующая.",
                icon = {
                    Icon(
                        imageVector = Icons.Outlined.Event,
                        contentDescription = null,
                    )
                },
                onAdd = {
                    ScheduleWidgetPinning.request(
                        context,
                        ScheduleWidgetType.TODAY,
                    )
                },
            )

            Spacer(modifier = Modifier.height(8.dp))

            WidgetChoiceCard(
                title = "Ближайшие",
                description = "Сегодня, завтра и следующая рабочая смена в одном блоке.",
                icon = {
                    Icon(
                        imageVector = Icons.Outlined.ViewAgenda,
                        contentDescription = null,
                    )
                },
                onAdd = {
                    ScheduleWidgetPinning.request(
                        context,
                        ScheduleWidgetType.UPCOMING,
                    )
                },
            )

            Spacer(modifier = Modifier.height(8.dp))

            WidgetChoiceCard(
                title = "Неделя",
                description = "Семь дней горизонтально, с цветами смен из графика.",
                icon = {
                    Icon(
                        imageVector = Icons.Outlined.CalendarViewWeek,
                        contentDescription = null,
                    )
                },
                onAdd = {
                    ScheduleWidgetPinning.request(
                        context,
                        ScheduleWidgetType.WEEK,
                    )
                },
            )

            if (!ScheduleWidgetPinning.isSupported(context)) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "На этом лаунчере виджеты добавляются через системное меню главного экрана.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeadingSettings(
                title = "Пул смен",
                subtitle = "Цвета основаны на легенде Excel СЗ",
            )
            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { poolExpanded = !poolExpanded },
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Widgets,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = ShiftPool.all.size.toString() + " смен",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = "Excel только назначает существующую смену",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Icon(
                        imageVector = if (poolExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                        contentDescription = if (poolExpanded) "Скрыть пул смен" else "Показать пул смен",
                    )
                }
            }

            if (poolExpanded) {
                Spacer(modifier = Modifier.height(8.dp))
                ShiftPool.all.forEach { shift ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            modifier = Modifier.size(12.dp),
                            shape = CircleShape,
                            color = Color(shift.color),
                            content = {},
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = shift.rangeLabel,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                text = shift.purpose,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeadingSettings(
                title = "Данные",
                subtitle = "Всё хранится только на этом устройстве",
            )
            Spacer(modifier = Modifier.height(10.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                ) {
                    Text(
                        text = store.employeeName.ifBlank { "Личный график" },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Записей в календаре: " + store.records.size,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = { confirmReset = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.DeleteOutline,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Очистить все данные",
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.65f),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                ) {
                    Text(
                        text = "График СЗ",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                    Text(
                        text = "Нативное Android-приложение · Kotlin + Jetpack Compose",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f),
                    )
                    Text(
                        text = "Без аккаунта и сервера",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f),
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }

    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("Очистить весь график?") },
            text = {
                Text("Будут удалены все импортированные и добавленные вручную дни. Это действие нельзя отменить.")
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
private fun WidgetChoiceCard(
    title: String,
    description: String,
    icon: @Composable () -> Unit,
    onAdd: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
            ) {
                androidx.compose.foundation.layout.Box(
                    contentAlignment = Alignment.Center,
                ) {
                    icon()
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            FilledTonalButton(
                onClick = onAdd,
            ) {
                Text("Добавить")
            }
        }
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

                androidx.compose.foundation.layout.Box(
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
private fun SectionHeadingSettings(
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
