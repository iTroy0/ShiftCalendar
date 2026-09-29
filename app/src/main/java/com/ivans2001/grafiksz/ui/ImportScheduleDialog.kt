@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.ivans2001.grafiksz.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ContentPaste
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.ivans2001.grafiksz.data.ExcelColumnParser
import com.ivans2001.grafiksz.data.ParsedImport
import com.ivans2001.grafiksz.data.ShiftPool
import java.time.YearMonth

@Composable
fun ImportScheduleDialog(
    initialMonth: YearMonth,
    onDismiss: () -> Unit,
    onApply: (YearMonth, ParsedImport, Map<String, String>) -> Unit,
) {
    val clipboard = LocalClipboardManager.current

    var monthValue by rememberSaveable {
        mutableStateOf(initialMonth.toString())
    }
    var sourceText by rememberSaveable {
        mutableStateOf("")
    }
    var parsed by remember {
        mutableStateOf<ParsedImport?>(null)
    }
    var clipboardMessage by remember {
        mutableStateOf<String?>(null)
    }
    var openMappingFor by remember {
        mutableStateOf<String?>(null)
    }
    val mappings = remember {
        mutableStateMapOf<String, String>()
    }
    var confirmClose by remember {
        mutableStateOf(false)
    }

    val selectedMonth = YearMonth.parse(monthValue)

    fun parse(
        text: String = sourceText,
        month: YearMonth = selectedMonth,
    ) {
        parsed = if (text.isBlank()) {
            null
        } else {
            ExcelColumnParser.parse(text, month)
        }

        val unresolved = parsed?.unresolvedValues.orEmpty().toSet()
        mappings.keys.toList()
            .filterNot(unresolved::contains)
            .forEach(mappings::remove)
    }

    fun updateMonth(month: YearMonth) {
        monthValue = month.toString()
        parse(month = month)
    }

    fun updateSource(value: String) {
        sourceText = value
        clipboardMessage = null
        parse(text = value)
    }

    val unresolved = parsed?.unresolvedValues.orEmpty()
    val canSave = parsed?.isCompleteColumn == true &&
        unresolved.all(mappings::containsKey)

    fun requestClose() {
        if (sourceText.isNotBlank() || mappings.isNotEmpty()) {
            confirmClose = true
        } else {
            onDismiss()
        }
    }

    BackHandler {
        requestClose()
    }

    Dialog(
        onDismissRequest = ::requestClose,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
        ),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding(),
            color = MaterialTheme.colorScheme.background,
        ) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                topBar = {
                    TopAppBar(
                        title = {
                            Text(
                                text = "Добавить график",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.SemiBold,
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = ::requestClose) {
                                Icon(
                                    imageVector = Icons.Outlined.Close,
                                    contentDescription = "Закрыть",
                                )
                            }
                        },
                    )
                },
                bottomBar = {
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        tonalElevation = 1.dp,
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(
                                    start = AppSpacing.md,
                                    end = AppSpacing.md,
                                    top = AppSpacing.sm,
                                    bottom = AppSpacing.md,
                                ),
                        ) {
                            Text(
                                text = "4. Сохрани график",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )

                            Button(
                                enabled = canSave,
                                onClick = {
                                    parsed?.let { result ->
                                        onApply(
                                            selectedMonth,
                                            result,
                                            mappings.toMap(),
                                        )
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = AppSpacing.xs)
                                    .heightIn(min = 52.dp),
                            ) {
                                Text("Сохранить график")
                            }
                        }
                    }
                },
            ) { innerPadding ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentPadding = PaddingValues(
                        start = AppSpacing.md,
                        end = AppSpacing.md,
                        top = AppSpacing.sm,
                        bottom = AppSpacing.lg,
                    ),
                    verticalArrangement = Arrangement.spacedBy(AppSpacing.lg),
                ) {
                    item {
                        ImportStep(
                            number = 1,
                            title = "Скопируй свой столбик",
                            text = "В Google Таблицах выдели только свой столбик: ФИО и все дни одного месяца. Скопируй его как обычный текст.",
                        )
                    }

                    item {
                        Column {
                            ImportStep(
                                number = 2,
                                title = "Выбери месяц",
                                text = "Укажи месяц, к которому относится скопированный столбик.",
                            )

                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = AppSpacing.sm),
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.60f),
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(56.dp)
                                        .padding(horizontal = AppSpacing.xs),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    IconButton(
                                        onClick = {
                                            updateMonth(selectedMonth.minusMonths(1))
                                        },
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.ChevronLeft,
                                            contentDescription = "Предыдущий месяц",
                                        )
                                    }

                                    Text(
                                        text = monthLabel(selectedMonth),
                                        modifier = Modifier.weight(1f),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        textAlign = TextAlign.Center,
                                    )

                                    IconButton(
                                        onClick = {
                                            updateMonth(selectedMonth.plusMonths(1))
                                        },
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.ChevronRight,
                                            contentDescription = "Следующий месяц",
                                        )
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Column {
                            ImportStep(
                                number = 3,
                                title = "Вставь столбик",
                                text = "Вставь данные из буфера или вручную. Поле можно проверить и поправить перед сохранением.",
                            )

                            OutlinedTextField(
                                value = sourceText,
                                onValueChange = ::updateSource,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = AppSpacing.sm),
                                label = {
                                    Text("Столбик из Google Таблиц")
                                },
                                placeholder = {
                                    Text(
                                        "Иван Иванов\n04:00–12:30\n-\n06:00–15:00\n…",
                                    )
                                },
                                minLines = 8,
                                maxLines = 14,
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = AppSpacing.xs),
                                horizontalArrangement = Arrangement.spacedBy(AppSpacing.xs),
                            ) {
                                FilledTonalButton(
                                    onClick = {
                                        val value = clipboard.getText()?.text.orEmpty()
                                        if (value.isBlank()) {
                                            clipboardMessage = "В буфере нет текста"
                                        } else {
                                            updateSource(value)
                                        }
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = 48.dp),
                                ) {
                                    Icon(
                                        imageVector = Icons.Outlined.ContentPaste,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp),
                                    )
                                    Spacer(modifier = Modifier.width(AppSpacing.xs))
                                    Text("Вставить")
                                }

                                if (sourceText.isNotBlank()) {
                                    TextButton(
                                        onClick = { updateSource("") },
                                        modifier = Modifier.heightIn(min = 48.dp),
                                    ) {
                                        Text("Очистить")
                                    }
                                }
                            }

                            clipboardMessage?.let { message ->
                                Text(
                                    text = message,
                                    modifier = Modifier.padding(top = AppSpacing.xs),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.error,
                                )
                            }
                        }
                    }

                    parsed?.let { result ->
                        item {
                            ImportResultSummary(
                                result = result,
                                unresolvedCount = unresolved.size,
                            )
                        }
                    }

                    if (unresolved.isNotEmpty()) {
                        item {
                            SectionHeader(
                                title = "Нужно сопоставить",
                                subtitle = "Эти значения не совпали с пулом смен. Выбери существующую смену для каждого значения.",
                            )
                        }

                        items(
                            items = unresolved,
                            key = { raw -> raw },
                        ) { raw ->
                            val selectedShift = mappings[raw]?.let(ShiftPool::byId)

                            Box {
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { openMappingFor = raw },
                                    shape = RoundedCornerShape(16.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(AppSpacing.md),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .width(5.dp)
                                                .height(44.dp)
                                                .background(
                                                    selectedShift
                                                        ?.let { shift -> Color(shift.color) }
                                                        ?: MaterialTheme.colorScheme.error,
                                                    CircleShape,
                                                ),
                                        )

                                        Spacer(modifier = Modifier.width(AppSpacing.sm))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = raw,
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.SemiBold,
                                            )

                                            Text(
                                                text = selectedShift?.let { shift ->
                                                    "${shift.rangeLabel} · ${shift.purpose}"
                                                } ?: "Нажми, чтобы выбрать смену",
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

                                        Icon(
                                            imageVector = Icons.Outlined.Schedule,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
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
                                                    Text(
                                                        text = shift.rangeLabel,
                                                        fontWeight = FontWeight.SemiBold,
                                                    )
                                                    Text(
                                                        text = shift.purpose,
                                                        style = MaterialTheme.typography.bodySmall,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                    )
                                                }
                                            },
                                            leadingIcon = {
                                                Box(
                                                    modifier = Modifier
                                                        .size(10.dp)
                                                        .background(
                                                            Color(shift.color),
                                                            CircleShape,
                                                        ),
                                                )
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
            }
        }
    }

    if (confirmClose) {
        AlertDialog(
            onDismissRequest = { confirmClose = false },
            title = { Text("Закрыть импорт?") },
            text = { Text("Вставленные данные и сопоставления не сохранятся.") },
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
                TextButton(
                    onClick = { confirmClose = false },
                ) {
                    Text("Остаться")
                }
            },
        )
    }
}

@Composable
private fun ImportStep(
    number: Int,
    title: String,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.Top,
    ) {
        Surface(
            modifier = Modifier.size(32.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primaryContainer,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = number.toString(),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
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
                text = text,
                modifier = Modifier.padding(top = 2.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ImportResultSummary(
    result: ParsedImport,
    unresolvedCount: Int,
) {
    val valid = result.isCompleteColumn
    val accent = if (valid) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.error
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
    ) {
        Column(
            modifier = Modifier.padding(AppSpacing.md),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = if (valid) {
                        Icons.Outlined.CheckCircle
                    } else {
                        Icons.Outlined.ErrorOutline
                    },
                    contentDescription = null,
                    tint = accent,
                )

                Spacer(modifier = Modifier.width(AppSpacing.xs))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = result.employeeName.ifBlank { "ФИО не найдено" },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = if (valid) {
                            "Столбик месяца распознан"
                        } else {
                            "Нужен столбик месяца целиком"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = accent,
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = AppSpacing.sm),
                color = MaterialTheme.colorScheme.outlineVariant,
            )

            InlineMetrics(
                items = listOf(
                    result.recognizedCount.toString() to "смен",
                    result.statusCount.toString() to "статусов",
                    unresolvedCount.toString() to "сопоставить",
                ),
            )

            if (!valid) {
                Text(
                    text = "Получено ${result.sourceDayCount} строк, а в выбранном месяце ${result.daysInMonth} дней.",
                    modifier = Modifier.padding(top = AppSpacing.sm),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}
