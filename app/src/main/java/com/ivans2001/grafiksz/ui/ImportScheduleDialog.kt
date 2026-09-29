package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.ExcelColumnParser
import com.ivans2001.grafiksz.data.ParsedImport
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

private val importMonthFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", Locale("ru"))

@Composable
fun ImportScheduleDialog(
    month: YearMonth,
    onDismiss: () -> Unit,
    onApply: (ParsedImport, Map<String, String>) -> Unit,
) {
    val clipboard = LocalClipboardManager.current
    var sourceText by remember { mutableStateOf("") }
    var parsed by remember { mutableStateOf<ParsedImport?>(null) }
    val mappings = remember { mutableStateMapOf<String, String>() }
    var openMappingFor by remember { mutableStateOf<String?>(null) }

    fun updateText(value: String) {
        sourceText = value
        parsed = if (value.isBlank()) null else ExcelColumnParser.parse(value, month)
        mappings.keys.retainAll(parsed?.unresolvedValues.orEmpty().toSet())
    }

    val unresolved = parsed?.unresolvedValues.orEmpty()
    val canApply = parsed?.let {
        it.isCompleteColumn && unresolved.all(mappings::containsKey)
    } == true

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Вставить график из Excel")
                Text(
                    text = month.format(importMonthFormatter).replaceFirstChar { it.uppercaseChar() },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .height(500.dp)
                    .verticalScroll(rememberScrollState()),
            ) {
                Text(
                    text = "Скопируй свой столбец вместе с ФИО и днями месяца. Новые типы смен из Excel не создаются.",
                )

                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        clipboard.getText()?.text?.let(::updateText)
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Вставить из буфера")
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = sourceText,
                    onValueChange = ::updateText,
                    label = { Text("Столбец Excel") },
                    minLines = 6,
                    modifier = Modifier.fillMaxWidth(),
                )

                parsed?.let { result ->
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = result.employeeName.ifBlank { "ФИО не найдено" },
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                text = "Смен: " + result.recognizedCount
                                    + " · статусов: " + result.statusCount
                                    + " · назначить: " + result.unresolvedCount,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            if (!result.isCompleteColumn) {
                                Text(
                                    text = "Скопировано " + result.sourceDayCount
                                        + " строк на " + result.daysInMonth
                                        + " дней. Нужен месяц целиком.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    }

                    unresolved.forEach { raw ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Box {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { openMappingFor = raw },
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.46f),
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(raw, fontWeight = FontWeight.Bold)
                                        Text(
                                            text = mappings[raw]
                                                ?.let(ShiftPool::byId)
                                                ?.let { it.rangeLabel + " · " + it.purpose }
                                                ?: "Назначить смену из пула",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (mappings[raw] == null) {
                                                MaterialTheme.colorScheme.error
                                            } else {
                                                MaterialTheme.colorScheme.onSurfaceVariant
                                            },
                                        )
                                    }
                                    Text("›")
                                }
                            }

                            DropdownMenu(
                                expanded = openMappingFor == raw,
                                onDismissRequest = { openMappingFor = null },
                            ) {
                                ShiftPool.all.forEach { shift ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(shift.rangeLabel, fontWeight = FontWeight.Bold)
                                                Text(
                                                    text = shift.title + " · " + shift.purpose,
                                                    style = MaterialTheme.typography.bodySmall,
                                                )
                                            }
                                        },
                                        onClick = {
                                            mappings[raw] = shift.id
                                            openMappingFor = null
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                enabled = canApply,
                onClick = {
                    parsed?.let { onApply(it, mappings.toMap()) }
                },
            ) {
                Text("Загрузить месяц")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Отмена") }
        },
    )
}
