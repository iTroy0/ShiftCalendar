package com.ivans2001.grafiksz.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.ivans2001.grafiksz.MainActivity
import com.ivans2001.grafiksz.R
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import org.json.JSONArray
import java.time.LocalDate
import java.time.format.DateTimeFormatter
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

    companion object {
        private val ruLocale = Locale("ru")
        private val shortDate = DateTimeFormatter.ofPattern("d MMM", ruLocale)

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
            val today = LocalDate.now()
            val tomorrow = today.plusDays(1)
            val nextShiftDate = generateSequence(today.plusDays(2)) { it.plusDays(1) }
                .take(45)
                .firstOrNull { date -> records[date]?.shiftId != null }

            val views = RemoteViews(context.packageName, R.layout.widget_schedule)
            views.setTextViewText(R.id.widget_title, "График СЗ")
            views.setTextViewText(
                R.id.widget_employee,
                employeeName.ifBlank { "Личный график" },
            )
            views.setTextViewText(R.id.widget_today_label, "Сегодня · ${today.format(shortDate)}")
            views.setTextViewText(
                R.id.widget_today_value,
                describe(records[today]),
            )
            views.setTextViewText(R.id.widget_tomorrow_label, "Завтра · ${tomorrow.format(shortDate)}")
            views.setTextViewText(
                R.id.widget_tomorrow_value,
                describe(records[tomorrow]),
            )
            views.setTextViewText(
                R.id.widget_next_value,
                if (nextShiftDate != null) {
                    "Следующая · ${nextShiftDate.format(shortDate)} · ${describe(records[nextShiftDate])}"
                } else {
                    "Следующих смен пока нет"
                },
            )

            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            manager.updateAppWidget(appWidgetId, views)
        }

        private fun describe(record: WidgetRecord?): String {
            if (record == null) {
                return "Не заполнено"
            }

            record.shiftId?.let { shiftId ->
                ShiftPool.byId(shiftId)?.let { shift ->
                    return "${shift.rangeLabel} · ${shift.title}"
                }
            }

            record.status?.let { status ->
                return status.title
            }

            return "Не заполнено"
        }

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

private data class WidgetRecord(
    val shiftId: String?,
    val status: DayStatus?,
)
