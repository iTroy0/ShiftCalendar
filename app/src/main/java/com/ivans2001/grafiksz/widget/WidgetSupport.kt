package com.ivans2001.grafiksz.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Build
import com.ivans2001.grafiksz.MainActivity
import com.ivans2001.grafiksz.data.AccentMode
import com.ivans2001.grafiksz.data.DayStatus
import com.ivans2001.grafiksz.data.ShiftPool
import org.json.JSONArray
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

enum class ScheduleWidgetType {
    TODAY,
    UPCOMING,
    WEEK,
}

data class WidgetRecord(
    val shiftId: String?,
    val status: DayStatus?,
)

data class WidgetDisplay(
    val primary: String,
    val secondary: String,
    val accent: Int,
)

object ScheduleWidgetData {
    private val locale = Locale("ru")

    val shortDate: DateTimeFormatter =
        DateTimeFormatter.ofPattern("d MMM", locale)

    fun read(context: Context): Map<LocalDate, WidgetRecord> {
        val prefs = context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE,
        )
        val raw = prefs.getString(KEY_RECORDS, null)

        if (raw.isNullOrBlank()) {
            return emptyMap()
        }

        val array = runCatching { JSONArray(raw) }
            .getOrNull()
            ?: return emptyMap()

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
                    runCatching { DayStatus.valueOf(name) }
                        .getOrNull()
                }

            result[date] = WidgetRecord(
                shiftId = shiftId,
                status = status,
            )
        }

        return result
    }

    fun employeeName(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_EMPLOYEE, "")
            .orEmpty()

    fun themeAccent(context: Context): Int {
        val prefs = context.getSharedPreferences(
            PREFS,
            Context.MODE_PRIVATE,
        )

        val mode = runCatching {
            AccentMode.valueOf(
                prefs.getString(
                    KEY_ACCENT,
                    AccentMode.DYNAMIC.name,
                ) ?: AccentMode.DYNAMIC.name,
            )
        }.getOrDefault(AccentMode.DYNAMIC)

        if (
            mode == AccentMode.DYNAMIC &&
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
        ) {
            return context.getColor(
                android.R.color.system_accent1_500,
            )
        }

        val dark = (
            context.resources.configuration.uiMode and
                Configuration.UI_MODE_NIGHT_MASK
            ) == Configuration.UI_MODE_NIGHT_YES

        return when (mode) {
            AccentMode.DYNAMIC,
            AccentMode.GRAPHITE,
            -> if (dark) 0xFFC5C6CC.toInt() else 0xFF5D5F63.toInt()

            AccentMode.VIOLET ->
                if (dark) 0xFFD0BCFF.toInt() else 0xFF6750A4.toInt()

            AccentMode.GREEN ->
                if (dark) 0xFF9CD67D.toInt() else 0xFF386A20.toInt()

            AccentMode.TEAL ->
                if (dark) 0xFF53DBC9.toInt() else 0xFF006A60.toInt()

            AccentMode.ORANGE ->
                if (dark) 0xFFFFB95F.toInt() else 0xFF8B5000.toInt()

            AccentMode.ROSE ->
                if (dark) 0xFFFFB3B5.toInt() else 0xFF9C4146.toInt()
        }
    }

    fun display(record: WidgetRecord?): WidgetDisplay {
        if (record == null) {
            return WidgetDisplay(
                primary = "Не заполнено",
                secondary = "",
                accent = 0xFF73798B.toInt(),
            )
        }

        record.shiftId?.let { shiftId ->
            ShiftPool.byId(shiftId)?.let { shift ->
                return WidgetDisplay(
                    primary = shift.rangeLabel,
                    secondary = shift.purpose,
                    accent = shift.color.toInt(),
                )
            }
        }

        record.status?.let { status ->
            return WidgetDisplay(
                primary = status.title,
                secondary = "",
                accent = statusAccent(status),
            )
        }

        return WidgetDisplay(
            primary = "Не заполнено",
            secondary = "",
            accent = 0xFF73798B.toInt(),
        )
    }

    fun compact(value: String): String =
        value
            .replace(":00", "")
            .replace("00:00", "0")

    fun dayLabel(date: LocalDate): String =
        date.dayOfWeek
            .getDisplayName(TextStyle.SHORT, locale)
            .replace(".", "")
            .replaceFirstChar { it.uppercaseChar() }

    fun nextShift(
        start: LocalDate,
        records: Map<LocalDate, WidgetRecord>,
        limitDays: Int = 60,
    ): LocalDate? =
        generateSequence(start) { it.plusDays(1) }
            .take(limitDays)
            .firstOrNull { date ->
                records[date]?.shiftId != null
            }

    fun openAppIntent(context: Context): PendingIntent {
        val intent = Intent(
            context,
            MainActivity::class.java,
        )

        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun statusAccent(status: DayStatus): Int =
        when (status) {
            DayStatus.DAY_OFF -> 0xFF747B8A.toInt()
            DayStatus.VACATION -> 0xFF27815B.toInt()
            DayStatus.SICK -> 0xFFC9463F.toInt()
            DayStatus.STUDY -> 0xFF7456B7.toInt()
            DayStatus.K_MARK -> 0xFF5268B8.toInt()
        }

    private const val PREFS = "grafik_sz"
    private const val KEY_RECORDS = "records"
    private const val KEY_EMPLOYEE = "employee_name"
    private const val KEY_ACCENT = "accent"
}

object ScheduleWidgetUpdater {
    private val providers = listOf(
        TodayWidgetProvider::class.java,
        UpcomingWidgetProvider::class.java,
        WeekWidgetProvider::class.java,
    )

    fun updateAll(context: Context) {
        val appContext = context.applicationContext
        val manager = AppWidgetManager.getInstance(appContext)

        providers.forEach { provider ->
            val component = ComponentName(
                appContext,
                provider,
            )
            val ids = manager.getAppWidgetIds(component)

            if (ids.isEmpty()) {
                return@forEach
            }

            val intent = Intent(
                AppWidgetManager.ACTION_APPWIDGET_UPDATE,
            ).apply {
                this.component = component
                putExtra(
                    AppWidgetManager.EXTRA_APPWIDGET_IDS,
                    ids,
                )
            }

            appContext.sendBroadcast(intent)
        }
    }
}

object ScheduleWidgetPinning {
    fun isSupported(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false
        }

        return AppWidgetManager
            .getInstance(context)
            .isRequestPinAppWidgetSupported
    }

    fun request(
        context: Context,
        type: ScheduleWidgetType,
    ): Boolean {
        if (!isSupported(context)) {
            return false
        }

        val provider = when (type) {
            ScheduleWidgetType.TODAY ->
                TodayWidgetProvider::class.java

            ScheduleWidgetType.UPCOMING ->
                UpcomingWidgetProvider::class.java

            ScheduleWidgetType.WEEK ->
                WeekWidgetProvider::class.java
        }

        return AppWidgetManager
            .getInstance(context)
            .requestPinAppWidget(
                ComponentName(context, provider),
                null,
                null,
            )
    }
}
