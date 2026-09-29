@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.ivans2001.grafiksz.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.EventBusy
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ivans2001.grafiksz.data.DayRecord
import com.ivans2001.grafiksz.data.DayStatus
import java.time.LocalDate

@Composable
fun QuickDayActionsSheet(
    date: LocalDate,
    current: DayRecord?,
    previousDate: LocalDate,
    previous: DayRecord?,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onRepeatPrevious: (() -> Unit)?,
    onDayOff: () -> Unit,
    onClear: (() -> Unit)?,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = AppSpacing.md)
                .padding(bottom = AppSpacing.lg),
        ) {
            Text(
                text = fullDateLabel(date),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = recordPrimary(current),
                modifier = Modifier.padding(top = 2.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(AppSpacing.md))

            QuickActionRow(
                icon = Icons.Outlined.Edit,
                title = "Изменить подробно",
                subtitle = "Смена, статус, переработка и заметка",
                onClick = onEdit,
            )

            if (previous != null && onRepeatPrevious != null) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 52.dp),
                    color = MaterialTheme.colorScheme.outlineVariant,
                )

                QuickActionRow(
                    icon = Icons.Outlined.ContentCopy,
                    title = "Повторить предыдущий день",
                    subtitle = "${previousDate.dayOfMonth} · ${recordPrimary(previous)}",
                    accent = recordAccent(previous),
                    onClick = onRepeatPrevious,
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(start = 52.dp),
                color = MaterialTheme.colorScheme.outlineVariant,
            )

            QuickActionRow(
                icon = Icons.Outlined.EventBusy,
                title = "Сделать выходным",
                subtitle = "Быстро поставить статус «Выходной»",
                accent = statusAccent(DayStatus.DAY_OFF),
                onClick = onDayOff,
            )

            if (current != null && !current.isEmpty && onClear != null) {
                HorizontalDivider(
                    modifier = Modifier.padding(start = 52.dp),
                    color = MaterialTheme.colorScheme.outlineVariant,
                )

                QuickActionRow(
                    icon = Icons.Outlined.DeleteOutline,
                    title = "Очистить день",
                    subtitle = "Удалить смену, статус и заметку",
                    destructive = true,
                    onClick = onClear,
                )
            }
        }
    }
}

@Composable
private fun QuickActionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    accent: Color? = null,
    destructive: Boolean = false,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 66.dp),
        color = Color.Transparent,
    ) {
        Row(
            modifier = Modifier.padding(
                horizontal = AppSpacing.xs,
                vertical = 10.dp,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = when {
                    destructive -> MaterialTheme.colorScheme.errorContainer
                    accent != null -> accent.copy(alpha = 0.16f)
                    else -> MaterialTheme.colorScheme.surfaceVariant
                },
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = when {
                            destructive -> MaterialTheme.colorScheme.error
                            accent != null -> accent
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                    )
                }
            }

            Spacer(modifier = Modifier.width(AppSpacing.sm))

            Column(
                modifier = Modifier.weight(1f),
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (destructive) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
