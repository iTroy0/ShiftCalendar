package com.ivans2001.grafiksz.ui

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentPaste
import androidx.compose.material.icons.outlined.Keyboard
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.ExcelColumnParser
import com.ivans2001.grafiksz.data.ParsedImport
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

private val importMonthFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", Locale("ru"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImportScheduleDialog(
    month: YearMonth,
    onDismiss: () -> Unit,
    onApply: (ParsedImport, Map<String, String>) -> Unit,
) {
    val clipboard = LocalClipboardManager.current
    var sourceText by remember { mutableStateOf("") }
    var parsed by remember { mutableStateOf<ParsedImport?>(null) }
    var showManualInput by remember { mutableStateOf(false) }
    val mappings = remember { mutableStateMapOf<String, String>() }
    var openMappingFor by remember { mutableStateOf<String?>(null) }

    fun updateText(value: String) {
        sourceText = value
        parsed = if (value.isBlank()) null else ExcelColumnParser.parse(value, month)
        mappings.keys.retainAll(parsed?.unresolvedValues.orEmpty().toSet())
    }

    val unresolved = parsed?.unresolvedValues.orEmpty()
    val canApply = parsed?.let { result ->
        result.isCompleteColumn && unresolved.all(mappings::containsKey)
    } == true

    ModalBottomSheet(
        onDismissRequest = onDismiss,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(bottom = 28.dp),
        ) {
            Text(
                text = "Импорт из Excel",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = month
                    .format(importMonthFormatter)
                    .replaceFirstChar { it.uppercaseChar() },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(14.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.72f),
            ) {
                Text(
                    text = "Скопируй свой столбец вместе с ФИО и всеми днями месяца. Если время не найдено в пуле, приложение попросит выбрать существующую смену.",
                    modifier = Modifier.padding(14.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = {
                    clipboard.getText()?.text?.let(::updateText)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.ContentPaste,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                Text("Вставить из буфера")
            }

            OutlinedButton(
                onClick = { showManualInput = !showManualInput },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
                    .heightIn(min = 48.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.Keyboard,
                    contentDescription = null,
                )
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                Text(
                    if (showManualInput) {
                        "Скрыть ручной ввод"
                    } else {
                        "Вставить вручную"
                    },
                )
            }

            if (showManualInput) {
                OutlinedTextField(
                    value = sourceText,
                    onValueChange = ::updateText,
                    label = { Text("Столбец Excel") },
                    minLines = 6,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                )
            }

            parsed?.let { result ->
                Spacer(modifier = Modifier.height(16.dp))

                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                    ) {
                        Text(
                            text = result.employeeName.ifBlank { "ФИО не найдено" },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            ImportMetric(
                                value = result.recognizedCount.toString(),
                                label = "смен",
                            )
                            ImportMetric(
                                value = result.statusCount.toString(),
                                label = "статусов",
                            )
                            ImportMetric(
                                value = result.unresolvedCount.toString(),
                                label = "назначить",
                            )
                        }

                        if (!result.isCompleteColumn) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Скопировано \${result.sourceDayCount} строк на \${result.daysInMonth} дней. Нужен месяц целиком.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }

                if (unresolved.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(18.dp))
                    Text(
                        text = "Нужно назначить",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = "Эти значения не создадут новые типы смен.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    unresolved.forEach { raw ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Box {
                            val selectedShift = mappings[raw]?.let(ShiftPool::byId)
                            val selectedColor = selectedShift?.let { Color(it.color) }

                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { openMappingFor = raw },
                                shape = RoundedCornerShape(16.dp),
                                color = if (selectedShift == null) {
                                    MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.40f)
                                } else {
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f)
                                },
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = selectedColor
                                            ?: MaterialTheme.colorScheme.error,
                                        modifier = Modifier.height(34.dp),
                                    ) {
                                        Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                                    }

                                    Spacer(modifier = Modifier.padding(horizontal = 5.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = raw,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                        )
                                        Text(
                                            text = selectedShift?.let {
                                                "\${it.rangeLabel} · \${it.purpose}"
                                            } ?: "Нажми и выбери смену из пула",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = if (selectedShift == null) {
                                                MaterialTheme.colorScheme.error
                                            } else {
                                                MaterialTheme.colorScheme.onSurfaceVariant
                                            },
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                }
                            }

                            DropdownMenu(
                                expanded = openMappingFor == raw,
                                onDismissRequest = { openMappingFor = null },
                            ) {
                                ShiftPool.all.forEach { shift ->
                                    DropdownMenuItem(
                                        leadingIcon = {
                                            Icon(
                                                imageVector = Icons.Outlined.Schedule,
                                                contentDescription = null,
                                                tint = Color(shift.color),
                                            )
                                        },
                                        text = {
                                            Column {
                                                Text(
                                                    text = shift.rangeLabel,
                                                    fontWeight = FontWeight.Bold,
                                                )
                                                Text(
                                                    text = shift.purpose,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
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

                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    enabled = canApply,
                    onClick = {
                        onApply(result, mappings.toMap())
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 52.dp),
                ) {
                    Text("Загрузить месяц")
                }
            }
        }
    }
}

@Composable
private fun ImportMetric(
    value: String,
    label: String,
) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
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
}
