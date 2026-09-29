@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.ivans2001.grafiksz.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.LocalDate
import kotlin.math.roundToInt

@Composable
fun DayEditorSheet(
    date: LocalDate,
    initial: DayRecord,
    onDismiss: () -> Unit,
    onSave: (DayRecord) -> Unit,
    onClear: () -> Unit,
) {
    var shiftId by remember(date) { mutableStateOf(initial.shiftId) }
    var statusName by remember(date) { mutableStateOf(initial.status?.name) }
    var overtimeText by remember(date) {
        mutableStateOf(
            if (initial.overtimeMinutes > 0) {
                (initial.overtimeMinutes / 60.0).toString().removeSuffix(".0")
            } else {
                ""
            },
        )
    }
    var note by remember(date) { mutableStateOf(initial.note) }
    var confirmClose by remember { mutableStateOf(false) }

    fun buildRecord(): DayRecord {
        val overtimeMinutes = if (shiftId == null) {
            0
        } else {
            overtimeText
                .replace(',', '.')
                .toDoubleOrNull()
                ?.coerceAtLeast(0.0)
                ?.times(60)
                ?.roundToInt()
                ?: 0
        }

        return DayRecord(
            shiftId = shiftId,
            status = statusName?.let(DayStatus::valueOf),
            overtimeMinutes = overtimeMinutes,
            note = note.trim(),
        )
    }

    val dirty = buildRecord() != initial

    BackHandler {
        if (dirty) {
            confirmClose = true
        } else {
            onDismiss()
        }
    }

    ModalBottomSheet(
        onDismissRequest = {
            if (dirty) {
                confirmClose = true
            } else {
                onDismiss()
            }
        },
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AppSpacing.md)
                .padding(bottom = AppSpacing.lg),
        ) {
            Text(
                text = fullDateLabel(date),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )

            Text(
                text = "Выбери смену или статус дня",
                modifier = Modifier.padding(top = 2.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(AppSpacing.lg))

            SectionHeader(
                title = "Смена",
                subtitle = "Пул фиксирован по времени и назначению.",
            )

            Spacer(modifier = Modifier.height(AppSpacing.xs))

            Column(
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                ShiftPool.all.forEach { shift ->
                    val selected = shiftId == shift.id

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                shiftId = shift.id
                                statusName = null
                            },
                        shape = RoundedCornerShape(14.dp),
                        color = if (selected) {
                            MaterialTheme.colorScheme.primaryContainer
                        } else {
                            Color.Transparent
                        },
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(
                                    horizontal = AppSpacing.sm,
                                    vertical = AppSpacing.xs,
                                ),
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
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }

                            RadioButton(
                                selected = selected,
                                onClick = null,
                            )
                        }
                    }
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = AppSpacing.lg),
                color = MaterialTheme.colorScheme.outlineVariant,
            )

            SectionHeader(
                title = "Статус дня",
                subtitle = "Статус заменяет смену на выбранный день.",
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(top = AppSpacing.xs),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
            ) {
                FilterChip(
                    selected = shiftId == null && statusName == null,
                    onClick = {
                        shiftId = null
                        statusName = null
                        overtimeText = ""
                    },
                    label = { Text("Пусто") },
                )

                DayStatus.values().forEach { status ->
                    FilterChip(
                        selected = statusName == status.name,
                        onClick = {
                            shiftId = null
                            statusName = status.name
                            overtimeText = ""
                        },
                        label = { Text(status.title) },
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = AppSpacing.lg),
                color = MaterialTheme.colorScheme.outlineVariant,
            )

            SectionHeader(
                title = "Переработка",
                subtitle = "Дополнительное время поверх выбранной смены.",
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(top = AppSpacing.xs),
                horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
            ) {
                listOf("0.5", "1", "2", "4").forEach { hours ->
                    OutlinedButton(
                        onClick = { overtimeText = hours },
                        modifier = Modifier.heightIn(min = 48.dp),
                    ) {
                        Text("+$hours ч")
                    }
                }
            }

            OutlinedTextField(
                value = overtimeText,
                onValueChange = { value ->
                    overtimeText = value.filter { char ->
                        char.isDigit() || char == '.' || char == ','
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = AppSpacing.xs),
                label = { Text("Часы переработки") },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Decimal,
                ),
                singleLine = true,
            )

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = AppSpacing.md),
                label = { Text("Заметка") },
                placeholder = { Text("Например: подмена или важная задача") },
                minLines = 2,
                maxLines = 4,
            )

            Button(
                onClick = { onSave(buildRecord()) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = AppSpacing.lg)
                    .heightIn(min = 52.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.Check,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.width(AppSpacing.xs))
                Text("Сохранить")
            }

            if (!initial.isEmpty) {
                TextButton(
                    onClick = onClear,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp),
                ) {
                    Icon(
                        imageVector = Icons.Outlined.DeleteOutline,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                    )
                    Spacer(modifier = Modifier.width(AppSpacing.xs))
                    Text(
                        text = "Очистить день",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }

    if (confirmClose) {
        AlertDialog(
            onDismissRequest = { confirmClose = false },
            title = { Text("Закрыть без сохранения?") },
            text = { Text("Изменения этого дня будут потеряны.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmClose = false
                        onDismiss()
                    },
                ) {
                    Text(
                        text = "Закрыть",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmClose = false }) {
                    Text("Остаться")
                }
            },
        )
    }
}
