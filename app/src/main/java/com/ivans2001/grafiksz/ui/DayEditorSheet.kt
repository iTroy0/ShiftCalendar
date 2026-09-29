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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
        ) {
            Text(
                text = date.format(editorDateFormatter).replaceFirstChar { it.uppercaseChar() },
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
            )
            Text(
                text = "Выбери смену из пула или статус дня",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(18.dp))
            Text("Смены", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)

            ShiftPool.all.forEach { shift ->
                val selected = selectedShiftId == shift.id
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 7.dp)
                        .clickable {
                            selectedShiftId = shift.id
                            selectedStatusName = null
                        },
                    shape = RoundedCornerShape(14.dp),
                    color = if (selected) {
                        Color(shift.color).copy(alpha = 0.16f)
                    } else {
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f)
                    },
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .background(Color(shift.color), CircleShape),
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(shift.rangeLabel, fontWeight = FontWeight.Black)
                            Text(
                                text = shift.title + " · " + shift.purpose,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))
            Text("Статус дня", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)

            Row(
                modifier = Modifier
                    .horizontalScroll(rememberScrollState())
                    .padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
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
            OutlinedTextField(
                value = overtimeText,
                onValueChange = { value ->
                    overtimeText = value.filter { char ->
                        char.isDigit() || char == '.' || char == ','
                    }
                },
                label = { Text("Переработка, часов") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(10.dp))
            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Заметка") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedButton(onClick = onClear, modifier = Modifier.weight(1f)) {
                    Text("Очистить")
                }
                Button(
                    onClick = {
                        val overtimeMinutes = overtimeText
                            .replace(',', '.')
                            .toDoubleOrNull()
                            ?.coerceAtLeast(0.0)
                            ?.times(60)
                            ?.roundToInt()
                            ?: 0

                        onSave(
                            DayRecord(
                                shiftId = selectedShiftId,
                                status = selectedStatusName?.let(DayStatus::valueOf),
                                overtimeMinutes = overtimeMinutes,
                                note = note.trim(),
                            ),
                        )
                    },
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Сохранить")
                }
            }

            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}
