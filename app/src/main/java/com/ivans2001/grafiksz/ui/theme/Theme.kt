package com.ivans2001.grafiksz.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ivans2001.grafiksz.data.AccentMode
import com.ivans2001.grafiksz.data.ThemeMode

private data class AccentColors(
    val lightPrimary: Color,
    val lightOnPrimary: Color,
    val lightContainer: Color,
    val lightOnContainer: Color,
    val darkPrimary: Color,
    val darkOnPrimary: Color,
    val darkContainer: Color,
    val darkOnContainer: Color,
)

private val Violet = AccentColors(
    lightPrimary = Color(0xFF6750A4),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFFEADDFF),
    lightOnContainer = Color(0xFF21005D),
    darkPrimary = Color(0xFFD0BCFF),
    darkOnPrimary = Color(0xFF381E72),
    darkContainer = Color(0xFF4F378B),
    darkOnContainer = Color(0xFFEADDFF),
)

private val Green = AccentColors(
    lightPrimary = Color(0xFF386A20),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFFB8F397),
    lightOnContainer = Color(0xFF082100),
    darkPrimary = Color(0xFF9CD67D),
    darkOnPrimary = Color(0xFF103800),
    darkContainer = Color(0xFF205107),
    darkOnContainer = Color(0xFFB8F397),
)

private val Teal = AccentColors(
    lightPrimary = Color(0xFF006A60),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFF74F8E5),
    lightOnContainer = Color(0xFF00201D),
    darkPrimary = Color(0xFF53DBC9),
    darkOnPrimary = Color(0xFF003731),
    darkContainer = Color(0xFF005047),
    darkOnContainer = Color(0xFF74F8E5),
)

private val Orange = AccentColors(
    lightPrimary = Color(0xFF8B5000),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFFFFDDB6),
    lightOnContainer = Color(0xFF2D1600),
    darkPrimary = Color(0xFFFFB95F),
    darkOnPrimary = Color(0xFF4A2800),
    darkContainer = Color(0xFF693C00),
    darkOnContainer = Color(0xFFFFDDB6),
)

private val Rose = AccentColors(
    lightPrimary = Color(0xFF9C4146),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFFFFDADA),
    lightOnContainer = Color(0xFF40000A),
    darkPrimary = Color(0xFFFFB3B5),
    darkOnPrimary = Color(0xFF5F1219),
    darkContainer = Color(0xFF7D2A30),
    darkOnContainer = Color(0xFFFFDADA),
)

private val Graphite = AccentColors(
    lightPrimary = Color(0xFF5D5F63),
    lightOnPrimary = Color.White,
    lightContainer = Color(0xFFE2E2E9),
    lightOnContainer = Color(0xFF1A1C20),
    darkPrimary = Color(0xFFC5C6CC),
    darkOnPrimary = Color(0xFF2F3034),
    darkContainer = Color(0xFF45464B),
    darkOnContainer = Color(0xFFE2E2E9),
)

private val AppTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.3f).sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        letterSpacing = (-0.2f).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 23.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 17.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp,
    ),
)

private val AppShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(4.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(8.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
)

@Composable
fun GrafikSzTheme(
    themeMode: ThemeMode,
    accentMode: AccentMode,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val dark = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val scheme = if (
        accentMode == AccentMode.DYNAMIC &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    ) {
        if (dark) {
            dynamicDarkColorScheme(context)
        } else {
            dynamicLightColorScheme(context)
        }
    } else {
        manualScheme(
            accentMode = if (accentMode == AccentMode.DYNAMIC) {
                AccentMode.GRAPHITE
            } else {
                accentMode
            },
            dark = dark,
        )
    }

    MaterialTheme(
        colorScheme = scheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}

fun accentPreviewColor(
    accentMode: AccentMode,
): Color = when (accentMode) {
    AccentMode.DYNAMIC -> Color.Unspecified
    AccentMode.VIOLET -> Violet.lightPrimary
    AccentMode.GREEN -> Green.lightPrimary
    AccentMode.TEAL -> Teal.lightPrimary
    AccentMode.ORANGE -> Orange.lightPrimary
    AccentMode.ROSE -> Rose.lightPrimary
    AccentMode.GRAPHITE -> Graphite.lightPrimary
}

private fun manualScheme(
    accentMode: AccentMode,
    dark: Boolean,
): ColorScheme {
    val accent = when (accentMode) {
        AccentMode.VIOLET -> Violet
        AccentMode.GREEN -> Green
        AccentMode.TEAL -> Teal
        AccentMode.ORANGE -> Orange
        AccentMode.ROSE -> Rose
        AccentMode.GRAPHITE,
        AccentMode.DYNAMIC,
        -> Graphite
    }

    return if (dark) {
        darkColorScheme(
            primary = accent.darkPrimary,
            onPrimary = accent.darkOnPrimary,
            primaryContainer = accent.darkContainer,
            onPrimaryContainer = accent.darkOnContainer,
            secondary = Color(0xFFC4C6D0),
            onSecondary = Color(0xFF2E3038),
            secondaryContainer = Color(0xFF454750),
            onSecondaryContainer = Color(0xFFE1E2EC),
            tertiary = Color(0xFFC0C7D8),
            onTertiary = Color(0xFF2A303E),
            tertiaryContainer = Color(0xFF414756),
            onTertiaryContainer = Color(0xFFDCE3F4),
            background = Color(0xFF111318),
            onBackground = Color(0xFFE5E7ED),
            surface = Color(0xFF17191F),
            onSurface = Color(0xFFE5E7ED),
            surfaceVariant = Color(0xFF252830),
            onSurfaceVariant = Color(0xFFC6C8D1),
            outline = Color(0xFF90939E),
            outlineVariant = Color(0xFF454850),
            error = Color(0xFFFFB4AB),
            onError = Color(0xFF690005),
            errorContainer = Color(0xFF93000A),
            onErrorContainer = Color(0xFFFFDAD6),
        )
    } else {
        lightColorScheme(
            primary = accent.lightPrimary,
            onPrimary = accent.lightOnPrimary,
            primaryContainer = accent.lightContainer,
            onPrimaryContainer = accent.lightOnContainer,
            secondary = Color(0xFF5D606B),
            onSecondary = Color.White,
            secondaryContainer = Color(0xFFE1E2EC),
            onSecondaryContainer = Color(0xFF1A1C24),
            tertiary = Color(0xFF586171),
            onTertiary = Color.White,
            tertiaryContainer = Color(0xFFDCE3F4),
            onTertiaryContainer = Color(0xFF151D2A),
            background = Color(0xFFF7F8FC),
            onBackground = Color(0xFF191B22),
            surface = Color(0xFFFDFDFF),
            onSurface = Color(0xFF191B22),
            surfaceVariant = Color(0xFFE8EAF1),
            onSurfaceVariant = Color(0xFF5D616E),
            outline = Color(0xFF777B87),
            outlineVariant = Color(0xFFC8CAD3),
            error = Color(0xFFBA1A1A),
            onError = Color.White,
            errorContainer = Color(0xFFFFDAD6),
            onErrorContainer = Color(0xFF410002),
        )
    }
}
