package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.ScheduleStore

private enum class AppTab(val label: String) {
    SCHEDULE("График"),
    STATS("Итоги"),
    SETTINGS("Настройки"),
}

@Composable
fun GrafikSzApp(store: ScheduleStore) {
    var tabName by rememberSaveable { mutableStateOf(AppTab.SCHEDULE.name) }
    val activeTab = AppTab.valueOf(tabName)

    Scaffold(
        bottomBar = {
            NavigationBar {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = activeTab == tab,
                        onClick = { tabName = tab.name },
                        icon = { TabIcon(tab) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        when (activeTab) {
            AppTab.SCHEDULE -> ScheduleScreen(store, padding)
            AppTab.STATS -> StatsScreen(store, padding)
            AppTab.SETTINGS -> SettingsScreen(store, padding)
        }
    }
}

@Composable
private fun TabIcon(tab: AppTab) {
    val color = MaterialTheme.colorScheme.onSurfaceVariant
    Canvas(modifier = Modifier.size(24.dp)) {
        val stroke = 2.2.dp.toPx()
        when (tab) {
            AppTab.SCHEDULE -> {
                drawRoundRect(
                    color = color,
                    topLeft = Offset(3.dp.toPx(), 4.dp.toPx()),
                    size = androidx.compose.ui.geometry.Size(18.dp.toPx(), 17.dp.toPx()),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(3.dp.toPx()),
                    style = androidx.compose.ui.graphics.drawscope.Stroke(stroke),
                )
                drawLine(color, Offset(3.dp.toPx(), 9.dp.toPx()), Offset(21.dp.toPx(), 9.dp.toPx()), stroke)
            }
            AppTab.STATS -> {
                drawLine(color, Offset(5.dp.toPx(), 20.dp.toPx()), Offset(5.dp.toPx(), 13.dp.toPx()), stroke, StrokeCap.Round)
                drawLine(color, Offset(12.dp.toPx(), 20.dp.toPx()), Offset(12.dp.toPx(), 7.dp.toPx()), stroke, StrokeCap.Round)
                drawLine(color, Offset(19.dp.toPx(), 20.dp.toPx()), Offset(19.dp.toPx(), 4.dp.toPx()), stroke, StrokeCap.Round)
            }
            AppTab.SETTINGS -> {
                drawLine(color, Offset(4.dp.toPx(), 7.dp.toPx()), Offset(20.dp.toPx(), 7.dp.toPx()), stroke, StrokeCap.Round)
                drawCircle(color, 2.5.dp.toPx(), Offset(9.dp.toPx(), 7.dp.toPx()))
                drawLine(color, Offset(4.dp.toPx(), 16.dp.toPx()), Offset(20.dp.toPx(), 16.dp.toPx()), stroke, StrokeCap.Round)
                drawCircle(color, 2.5.dp.toPx(), Offset(15.dp.toPx(), 16.dp.toPx()))
            }
        }
    }
}
