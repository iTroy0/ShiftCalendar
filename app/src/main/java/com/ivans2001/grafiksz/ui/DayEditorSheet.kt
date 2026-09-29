package com.ivans2001.grafiksz.ui

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

private val editorDateFormatter = DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale("ru"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DayEditorSheet(
    date: LocalDate,
    initial: DayRecord,
    onDismiss: () -> Unit,
    onSave: (DayRecord) -> Unit,
    onClear: () -> Unit,
) {
    var selectedShiftId by remember(date) { mutableStateOf(initial.shiftId) }
    var selectedStatusName by remember(date) { mutableStateOf(initial.status?.name) }
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
    var confirmDismiss by remember { mutableStateOf(false) }

    fun currentRecord(): DayRecord {
        val overtimeMinutes = overtimeText
            .replace(',', '.')
            .toDoubleOrNull()
            ?.coerceAtLeast(0.0)
            ?.times(60)
            ?.roundToInt()
            ?: 0

        return DayRecord(
            shiftId = selectedShiftId,
            status = selectedStatusName?.let(DayStatus::valueOf),
            overtimeMinutes = overtimeMinutes,
            note = note.trim(),
        )
    }

    val dirty = currentRecord() != initial

    ModalBottomSheet(
        onDismissRequest = {
            if (dirty) confirmDismiss = true else onDismiss()
        },
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 28.dp),
        ) {
            Text(
                text = date.format(editorDateFormatter).replaceFirstChar { it.uppercaseChar() },
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Смена, статус и заметки на один день",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "Смена",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "Выбирается только из системного пула",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(8.dp))

            ShiftPool.all.chunked(2).forEach { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    pair.forEach { shift ->
                        val selected = selectedShiftId == shift.id
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 86.dp)
                                .clickable {
                                    selectedShiftId = shift.id
                                    selectedStatusName = null
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = if (selected) {
                                Color(shift.color).copy(alpha = 0.15f)
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.48f)
                            },
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(9.dp)
                                            .background(Color(shift.color), CircleShape),
                                    )
                                    Spacer(modifier = Modifier.width(7.dp))
                                    Text(
                                        text = shift.rangeLabel,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }

                                Spacer(modifier = Modifier.height(5.dp))

                                Text(
                                    text = shift.purpose,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 2,
                                )
                            }
                        }
                    }

                    if (pair.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Статус дня",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = selectedStatusName == null && selectedShiftId == null,
                    onClick = {
                        selectedStatusName = null
                        selectedShiftId = null
                    },
                    label = { Text("Пусто") },
                )

                DayStatus.entries.forEach { status ->
                    FilterChip(
                        selected = selectedStatusName == status.name,
                        onClick = {
                            selectedStatusName = status.name
                            selectedShiftId = null
                        },
                        label = { Text(status.title) },
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Переработка",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf("1", "2", "4").forEach { hours ->
                    OutlinedButton(
                        onClick = { overtimeText = hours },
                    ) {
                        Text("+$hours ч")
                    }
                }

                TextButton(onClick = { overtimeText = "" }) {
                    Text("Сбросить")
                }
            }

            OutlinedTextField(
                value = overtimeText,
                onValueChange = { value ->
                    overtimeText = value.filter { char ->
                        char.isDigit() || char == '.' || char == ','
                    }
                },
                label = { Text("Часы переработки") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Заметка") },
                supportingText = { Text("Например: подмена, встреча, важная задача") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(18.dp))

            Button(
                onClick = { onSave(currentRecord()) },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.Check,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.width(8.dp))
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
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Очистить день",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
    }

    if (confirmDismiss) {
        AlertDialog(
            onDismissRequest = { confirmDismiss = false },
            title = { Text("Закрыть без сохранения?") },
            text = { Text("Изменения этого дня будут потеряны.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmDismiss = false
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
                TextButton(onClick = { confirmDismiss = false }) {
                    Text("Продолжить редактирование")
                }
            },
        )
    }
}
