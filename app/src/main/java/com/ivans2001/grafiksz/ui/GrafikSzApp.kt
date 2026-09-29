package com.ivans2001.grafiksz.ui

import androidx.compose.animation.Crossfade
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
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.ScheduleStore

private enum class AppDestination(
    val label: String,
    val selectedIcon: ImageVector,
    val icon: ImageVector,
) {
    SCHEDULE(
        label = "График",
        selectedIcon = Icons.Filled.CalendarMonth,
        icon = Icons.Outlined.CalendarMonth,
    ),
    STATS(
        label = "Итоги",
        selectedIcon = Icons.Filled.BarChart,
        icon = Icons.Outlined.BarChart,
    ),
    SETTINGS(
        label = "Настройки",
        selectedIcon = Icons.Filled.Settings,
        icon = Icons.Outlined.Settings,
    ),
}

@Composable
fun GrafikSzApp(
    store: ScheduleStore,
) {
    var destinationName by rememberSaveable {
        mutableStateOf(AppDestination.SCHEDULE.name)
    }
    val destination = AppDestination.valueOf(destinationName)
    val stateHolder = rememberSaveableStateHolder()

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp,
            ) {
                AppDestination.entries.forEach { item ->
                    val selected = item == destination

                    NavigationBarItem(
                        selected = selected,
                        onClick = { destinationName = item.name },
                        icon = {
                            Icon(
                                imageVector = if (selected) {
                                    item.selectedIcon
                                } else {
                                    item.icon
                                },
                                contentDescription = item.label,
                            )
                        },
                        label = {
                            Text(item.label)
                        },
                    )
                }
            }
        },
    ) { innerPadding ->
        Crossfade(
            targetState = destination,
            label = "rootDestination",
        ) { target ->
            stateHolder.SaveableStateProvider(target.name) {
                when (target) {
                    AppDestination.SCHEDULE -> ScheduleScreen(
                        store = store,
                        contentPadding = innerPadding,
                    )

                    AppDestination.STATS -> StatsScreen(
                        store = store,
                        contentPadding = innerPadding,
                    )

                    AppDestination.SETTINGS -> SettingsScreen(
                        store = store,
                        contentPadding = innerPadding,
                    )
                }
            }
        }
    }
}
