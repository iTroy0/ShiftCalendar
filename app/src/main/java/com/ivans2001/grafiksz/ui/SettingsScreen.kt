package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.data.ThemeMode

@Composable
fun SettingsScreen(
    store: ScheduleStore,
    contentPadding: PaddingValues,
) {
    var confirmReset by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(contentPadding)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Text(
            "Настройки",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
        )
        Text(
            "График хранится локально на устройстве.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(modifier = Modifier.height(20.dp))

        SectionTitle("Оформление")
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("Тема", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeOption(
                        label = "Система",
                        selected = store.themeMode == ThemeMode.SYSTEM,
                        onClick = { store.updateThemeMode(ThemeMode.SYSTEM) },
                        modifier = Modifier.weight(1f),
                    )
                    ThemeOption(
                        label = "Светлая",
                        selected = store.themeMode == ThemeMode.LIGHT,
                        onClick = { store.updateThemeMode(ThemeMode.LIGHT) },
                        modifier = Modifier.weight(1f),
                    )
                    ThemeOption(
                        label = "Тёмная",
                        selected = store.themeMode == ThemeMode.DARK,
                        onClick = { store.updateThemeMode(ThemeMode.DARK) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        SectionTitle("Пул смен")
        Text(
            "Фиксированный системный пул. Excel назначает только эти смены и ничего нового не создаёт.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(8.dp))

        ShiftPool.all.forEach { shift ->
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 7.dp),
                shape = RoundedCornerShape(14.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f),
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
                    Spacer(modifier = Modifier.size(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            shift.rangeLabel,
                            fontWeight = FontWeight.Black,
                        )
                        Text(
                            shift.title + " · " + shift.purpose,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        SectionTitle("Данные")
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    store.employeeName.ifBlank { "Личный график" },
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "Записей в календаре: " + store.records.size,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = { confirmReset = true },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Очистить все данные")
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text("График СЗ", fontWeight = FontWeight.Black)
                Text(
                    "Нативное приложение: Kotlin + Jetpack Compose. Без аккаунта и сервера.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))
    }

    if (confirmReset) {
        AlertDialog(
            onDismissRequest = { confirmReset = false },
            title = { Text("Очистить график?") },
            text = {
                Text("Будут удалены все импортированные и добавленные вручную дни.")
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
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(bottom = 8.dp),
    )
}

@Composable
private fun ThemeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        modifier = modifier,
    )
}
