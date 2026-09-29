package com.ivans2001.grafiksz.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
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
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp,
            ) {
                AppTab.entries.forEach { tab ->
                    val selected = activeTab == tab
                    val icon = when (tab) {
                        AppTab.SCHEDULE -> if (selected) Icons.Filled.CalendarMonth else Icons.Outlined.CalendarMonth
                        AppTab.STATS -> if (selected) Icons.Filled.BarChart else Icons.Outlined.BarChart
                        AppTab.SETTINGS -> if (selected) Icons.Filled.Settings else Icons.Outlined.Settings
                    }

                    NavigationBarItem(
                        selected = selected,
                        onClick = { tabName = tab.name },
                        icon = {
                            Icon(
                                imageVector = icon,
                                contentDescription = tab.label,
                            )
                        },
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
