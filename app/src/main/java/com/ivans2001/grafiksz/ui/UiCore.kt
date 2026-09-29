package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Today
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import com.ivans2001.grafiksz.ui.theme.SchedulePalette
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt

internal val UiLocale = Locale("ru")
internal val MonthFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", UiLocale)

object AppSpacing {
    val xxs = 4.dp
    val xs = 8.dp
    val sm = 12.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}

@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
        )
        if (!subtitle.isNullOrBlank()) {
            Text(
                text = subtitle,
                modifier = Modifier.padding(top = 2.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun PeriodNavigator(
    label: String,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onToday: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onPrevious) {
            Icon(
                imageVector = Icons.Outlined.ChevronLeft,
                contentDescription = "Предыдущий период",
            )
        }

        Text(
            text = label,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 1,
        )

        if (onToday != null) {
            TextButton(
                onClick = onToday,
                modifier = Modifier.height(48.dp),
            ) {
                Icon(
                    imageVector = Icons.Outlined.Today,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Сегодня")
            }
        } else {
            Spacer(modifier = Modifier.width(48.dp))
        }

        IconButton(onClick = onNext) {
            Icon(
                imageVector = Icons.Outlined.ChevronRight,
                contentDescription = "Следующий период",
            )
        }
    }
}

@Composable
fun InlineMetrics(
    items: List<Pair<String, String>>,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        items.forEachIndexed { index, item ->
            if (index > 0) {
                Box(
                    modifier = Modifier
                        .padding(horizontal = 10.dp)
                        .size(3.dp)
                        .background(
                            MaterialTheme.colorScheme.outline,
                            CircleShape,
                        ),
                )
            }

            Text(
                text = "${item.first} ${item.second}",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun recordAccent(record: DayRecord?): Color {
    val shift = ShiftPool.byId(record?.shiftId)
    return shift?.let { Color(it.color) }
        ?: statusAccent(record?.status)
        ?: MaterialTheme.colorScheme.outlineVariant
}

fun statusAccent(status: DayStatus?): Color? = when (status) {
    DayStatus.DAY_OFF -> Color(0xFF747B8A)
    DayStatus.VACATION -> Color(0xFF27815B)
    DayStatus.SICK -> Color(0xFFC9463F)
    DayStatus.STUDY -> Color(0xFF7456B7)
    DayStatus.K_MARK -> Color(0xFF5268B8)
    null -> null
}

fun recordPrimary(record: DayRecord?): String {
    val shift = ShiftPool.byId(record?.shiftId)
    return when {
        shift != null -> shift.rangeLabel
        record?.status != null -> record.status.title
        else -> "Не заполнено"
    }
}

fun recordSecondary(record: DayRecord?): String {
    val shift = ShiftPool.byId(record?.shiftId)
    return when {
        shift != null -> shift.purpose
        record?.note?.isNotBlank() == true -> record.note
        else -> ""
    }
}

fun compactRange(value: String): String = value
    .replace(":00", "")
    .replace("00:00", "0")

fun formatMinutes(minutes: Int): String {
    val hours = minutes / 60
    val rest = minutes % 60
    return when {
        hours > 0 && rest > 0 -> "${hours}ч ${rest}м"
        hours > 0 -> "${hours}ч"
        else -> "${rest}м"
    }
}

fun formatHours(value: Double): String {
    val rounded = (value * 10).roundToInt() / 10.0
    return if (rounded % 1.0 == 0.0) {
        rounded.toInt().toString()
    } else {
        rounded.toString()
    }
}

fun fullDateLabel(date: LocalDate): String {
    val weekday = date.dayOfWeek
        .getDisplayName(TextStyle.FULL, UiLocale)
        .replaceFirstChar { it.uppercaseChar() }
    val month = date.month.getDisplayName(TextStyle.FULL, UiLocale)
    return "$weekday, ${date.dayOfMonth} $month"
}

fun monthLabel(month: YearMonth): String =
    month.format(MonthFormatter).replaceFirstChar { it.uppercaseChar() }

val OvertimeColor = Color(SchedulePalette.Overtime)
