package com.ivans2001.grafiksz.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.ivans2001.grafiksz.MainActivity
import com.ivans2001.grafiksz.R
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import org.json.JSONArray
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

class ScheduleWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        appWidgetIds.forEach { id ->
            updateWidget(context, appWidgetManager, id)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        updateAll(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (
            intent.action == Intent.ACTION_DATE_CHANGED
            || intent.action == Intent.ACTION_TIME_CHANGED
            || intent.action == Intent.ACTION_TIMEZONE_CHANGED
            || intent.action == Intent.ACTION_BOOT_COMPLETED
            || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            updateAll(context)
        }
    }

    companion object {
        private val locale = Locale("ru")
        private val shortDate = DateTimeFormatter.ofPattern("d MMM", locale)

        fun updateAll(context: Context) {
            val appContext = context.applicationContext
            val manager = AppWidgetManager.getInstance(appContext)
            val component = ComponentName(appContext, ScheduleWidgetProvider::class.java)
            manager.getAppWidgetIds(component).forEach { id ->
                updateWidget(appContext, manager, id)
            }
        }

        private fun updateWidget(
            context: Context,
            manager: AppWidgetManager,
            appWidgetId: Int,
        ) {
            val prefs = context.getSharedPreferences("grafik_sz", Context.MODE_PRIVATE)
            val employeeName = prefs.getString("employee_name", "").orEmpty()
            val records = loadRecords(prefs.getString("records", null))
            val options = manager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

            val layout = when {
                minWidth < 180 -> WidgetLayout.SMALL
                minHeight < 190 -> WidgetLayout.MEDIUM
                else -> WidgetLayout.LARGE
            }

            val views = when (layout) {
                WidgetLayout.SMALL -> buildSmall(context, records)
                WidgetLayout.MEDIUM -> buildMedium(context, employeeName, records)
                WidgetLayout.LARGE -> buildLarge(context, employeeName, records)
            }

            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

            views.setOnClickPendingIntent(
                when (layout) {
                    WidgetLayout.SMALL -> R.id.widget_small_root
                    WidgetLayout.MEDIUM -> R.id.widget_medium_root
                    WidgetLayout.LARGE -> R.id.widget_large_root
                },
                pendingIntent,
            )

            manager.updateAppWidget(appWidgetId, views)
        }

        private fun buildSmall(
            context: Context,
            records: Map<LocalDate, WidgetRecord>,
        ): RemoteViews {
            val today = LocalDate.now()
            val display = display(records[today])

            return RemoteViews(context.packageName, R.layout.widget_schedule_small).apply {
                setTextViewText(R.id.widget_small_date, "Сегодня · \${today.format(shortDate)}")
                setTextViewText(R.id.widget_small_value, display.primary)
                setTextViewText(R.id.widget_small_detail, display.secondary.ifBlank { "График СЗ" })
            }
        }

        private fun buildMedium(
            context: Context,
            employeeName: String,
            records: Map<LocalDate, WidgetRecord>,
        ): RemoteViews {
            val today = LocalDate.now()
            val tomorrow = today.plusDays(1)
            val todayDisplay = display(records[today])
            val tomorrowDisplay = display(records[tomorrow])
            val next = findNextShift(today.plusDays(2), records)

            return RemoteViews(context.packageName, R.layout.widget_schedule_medium).apply {
                setTextViewText(R.id.widget_medium_employee, employeeName.ifBlank { "Личный график" })
                setTextViewText(R.id.widget_medium_today_label, "Сегодня · \${today.format(shortDate)}")
                setTextViewText(R.id.widget_medium_today_value, todayDisplay.primary)
                setTextViewText(R.id.widget_medium_today_detail, todayDisplay.secondary)
                setTextViewText(R.id.widget_medium_tomorrow_label, "Завтра · \${tomorrow.format(shortDate)}")
                setTextViewText(R.id.widget_medium_tomorrow_value, tomorrowDisplay.primary)
                setTextViewText(
                    R.id.widget_medium_next,
                    if (next != null) {
                        val nextDisplay = display(records[next])
                        "Следующая · \${next.format(shortDate)} · \${nextDisplay.primary}"
                    } else {
                        "Следующих смен пока нет"
                    },
                )
            }
        }

        private fun buildLarge(
            context: Context,
            employeeName: String,
            records: Map<LocalDate, WidgetRecord>,
        ): RemoteViews {
            val today = LocalDate.now()
            val todayDisplay = display(records[today])
            val views = RemoteViews(context.packageName, R.layout.widget_schedule_large)

            views.setTextViewText(
                R.id.widget_large_employee,
                employeeName.ifBlank { "Личный график" },
            )
            views.setTextViewText(R.id.widget_large_today_value, todayDisplay.primary)
            views.setTextViewText(
                R.id.widget_large_today_detail,
                todayDisplay.secondary.ifBlank { "Сегодня · \${today.format(shortDate)}" },
            )

            val labelIds = intArrayOf(
                R.id.widget_day_1_label,
                R.id.widget_day_2_label,
                R.id.widget_day_3_label,
                R.id.widget_day_4_label,
                R.id.widget_day_5_label,
                R.id.widget_day_6_label,
                R.id.widget_day_7_label,
            )
            val valueIds = intArrayOf(
                R.id.widget_day_1_value,
                R.id.widget_day_2_value,
                R.id.widget_day_3_value,
                R.id.widget_day_4_value,
                R.id.widget_day_5_value,
                R.id.widget_day_6_value,
                R.id.widget_day_7_value,
            )

            (0..6).forEach { offset ->
                val date = today.plusDays(offset.toLong())
                val item = display(records[date])
                val dayName = date.dayOfWeek
                    .getDisplayName(TextStyle.SHORT, locale)
                    .replace(".", "")
                    .replaceFirstChar { it.uppercaseChar() }

                views.setTextViewText(
                    labelIds[offset],
                    if (offset == 0) "Сегодня" else "\$dayName \${date.dayOfMonth}",
                )
                views.setTextViewText(valueIds[offset], compactWidgetValue(item.primary))
                views.setTextColor(
                    labelIds[offset],
                    if (offset == 0) 0xFF8FBFFF.toInt() else 0xFFBFC8E6.toInt(),
                )
            }

            return views
        }

        private fun findNextShift(
            start: LocalDate,
            records: Map<LocalDate, WidgetRecord>,
        ): LocalDate? = generateSequence(start) { it.plusDays(1) }
            .take(60)
            .firstOrNull { date -> records[date]?.shiftId != null }

        private fun display(record: WidgetRecord?): WidgetDisplay {
            if (record == null) {
                return WidgetDisplay("Не заполнено", "")
            }

            record.shiftId?.let { shiftId ->
                ShiftPool.byId(shiftId)?.let { shift ->
                    return WidgetDisplay(
                        primary = shift.rangeLabel,
                        secondary = shift.purpose,
                    )
                }
            }

            record.status?.let { status ->
                return WidgetDisplay(
                    primary = status.title,
                    secondary = "",
                )
            }

            return WidgetDisplay("Не заполнено", "")
        }

        private fun compactWidgetValue(value: String): String = value
            .replace(":00", "")
            .replace("00:00", "0")

        private fun loadRecords(raw: String?): Map<LocalDate, WidgetRecord> {
            if (raw.isNullOrBlank()) {
                return emptyMap()
            }

            val array = runCatching { JSONArray(raw) }.getOrNull() ?: return emptyMap()
            val result = mutableMapOf<LocalDate, WidgetRecord>()

            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                val date = runCatching {
                    LocalDate.parse(item.optString("date"))
                }.getOrNull() ?: continue

                val shiftId = item.optString("shiftId")
                    .takeIf { it.isNotBlank() }

                val status = item.optString("status")
                    .takeIf { it.isNotBlank() }
                    ?.let { name ->
                        runCatching { DayStatus.valueOf(name) }.getOrNull()
                    }

                result[date] = WidgetRecord(
                    shiftId = shiftId,
                    status = status,
                )
            }

            return result
        }
    }
}

private enum class WidgetLayout {
    SMALL,
    MEDIUM,
    LARGE,
}

private data class WidgetRecord(
    val shiftId: String?,
    val status: DayStatus?,
)

private data class WidgetDisplay(
    val primary: String,
    val secondary: String,
)
