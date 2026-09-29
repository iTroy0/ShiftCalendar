package com.ivans2001.grafiksz.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.ivans2001.grafiksz.data.ThemeMode

private val LightColors = lightColorScheme(
    primary = Color(0xFF1769AA),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD7E9FF),
    onPrimaryContainer = Color(0xFF0B3557),
    secondary = Color(0xFF3A5D7A),
    onSecondary = Color.White,
    background = Color(0xFFF7F8FC),
    onBackground = Color(0xFF1A1D2B),
    surface = Color.White,
    onSurface = Color(0xFF1A1D2B),
    surfaceVariant = Color(0xFFE9ECF5),
    onSurfaceVariant = Color(0xFF5B6070),
    outline = Color(0xFFBBC0CE),
    error = Color(0xFFB3261E),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF5AA7FF),
    onPrimary = Color(0xFF052B4B),
    primaryContainer = Color(0xFF164F7F),
    onPrimaryContainer = Color(0xFFD5E9FF),
    secondary = Color(0xFFB7C8D8),
    onSecondary = Color(0xFF213443),
    background = Color(0xFF171A2A),
    onBackground = Color(0xFFE7E9F3),
    surface = Color(0xFF20243A),
    onSurface = Color(0xFFE7E9F3),
    surfaceVariant = Color(0xFF2B3048),
    onSurfaceVariant = Color(0xFFC3C7D4),
    outline = Color(0xFF73798B),
    error = Color(0xFFFFB4AB),
)

@Composable
fun GrafikSzTheme(
    themeMode: ThemeMode,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = Typography(),
        content = content,
    )
}
