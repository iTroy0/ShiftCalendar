package com.ivans2001.grafiksz.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.ivans2001.grafiksz.R
import java.time.LocalDate

abstract class BaseScheduleWidgetProvider : AppWidgetProvider() {
    abstract fun render(
        context: Context,
        appWidgetId: Int,
    ): RemoteViews

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        appWidgetIds.forEach { id ->
            appWidgetManager.updateAppWidget(id, render(context, id))
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        appWidgetManager.updateAppWidget(appWidgetId, render(context, appWidgetId))
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
            ScheduleWidgetUpdater.updateAll(context)
        }
    }
}

class TodayWidgetProvider : BaseScheduleWidgetProvider() {
    override fun render(
        context: Context,
        appWidgetId: Int,
    ): RemoteViews {
        val records = ScheduleWidgetData.read(context)
        val today = LocalDate.now()
        val item = ScheduleWidgetData.display(records[today])
        val next = ScheduleWidgetData.nextShift(today.plusDays(1), records)

        return RemoteViews(context.packageName, R.layout.widget_today).apply {
            setTextViewText(
                R.id.widget_today_date,
                "Сегодня · ${today.format(ScheduleWidgetData.shortDate)}",
            )
            setTextViewText(R.id.widget_today_value, item.primary)
            setTextViewText(
                R.id.widget_today_detail,
                item.secondary.ifBlank {
                    if (next != null) {
                        val nextItem = ScheduleWidgetData.display(records[next])
                        "Следующая ${next.format(ScheduleWidgetData.shortDate)} · ${nextItem.primary}"
                    } else {
                        "Следующих смен пока нет"
                    }
                },
            )
            setInt(R.id.widget_today_accent, "setBackgroundColor", item.accent)
            setOnClickPendingIntent(
                R.id.widget_today_root,
                ScheduleWidgetData.openAppIntent(context),
            )
        }
    }
}

class UpcomingWidgetProvider : BaseScheduleWidgetProvider() {
    override fun render(
        context: Context,
        appWidgetId: Int,
    ): RemoteViews {
        val records = ScheduleWidgetData.read(context)
        val employee = ScheduleWidgetData.employeeName(context)
        val today = LocalDate.now()
        val tomorrow = today.plusDays(1)

        val todayItem = ScheduleWidgetData.display(records[today])
        val tomorrowItem = ScheduleWidgetData.display(records[tomorrow])
        val next = ScheduleWidgetData.nextShift(today.plusDays(2), records)
        val nextItem = next?.let { ScheduleWidgetData.display(records[it]) }

        return RemoteViews(context.packageName, R.layout.widget_upcoming).apply {
            setTextViewText(
                R.id.widget_upcoming_title,
                employee.ifBlank { "График СЗ" },
            )

            setTextViewText(
                R.id.widget_upcoming_today_label,
                "Сегодня · ${today.format(ScheduleWidgetData.shortDate)}",
            )
            setTextViewText(R.id.widget_upcoming_today_value, todayItem.primary)
            setTextViewText(R.id.widget_upcoming_today_detail, todayItem.secondary)
            setInt(R.id.widget_upcoming_today_accent, "setBackgroundColor", todayItem.accent)

            setTextViewText(
                R.id.widget_upcoming_tomorrow_label,
                "Завтра · ${tomorrow.format(ScheduleWidgetData.shortDate)}",
            )
            setTextViewText(R.id.widget_upcoming_tomorrow_value, tomorrowItem.primary)
            setTextViewText(R.id.widget_upcoming_tomorrow_detail, tomorrowItem.secondary)
            setInt(R.id.widget_upcoming_tomorrow_accent, "setBackgroundColor", tomorrowItem.accent)

            if (next != null && nextItem != null) {
                setTextViewText(
                    R.id.widget_upcoming_next_label,
                    "Следующая · ${next.format(ScheduleWidgetData.shortDate)}",
                )
                setTextViewText(R.id.widget_upcoming_next_value, nextItem.primary)
                setInt(R.id.widget_upcoming_next_accent, "setBackgroundColor", nextItem.accent)
            } else {
                setTextViewText(R.id.widget_upcoming_next_label, "Следующая")
                setTextViewText(R.id.widget_upcoming_next_value, "Нет в графике")
                setInt(R.id.widget_upcoming_next_accent, "setBackgroundColor", 0xFF73798B.toInt())
            }

            setOnClickPendingIntent(
                R.id.widget_upcoming_root,
                ScheduleWidgetData.openAppIntent(context),
            )
        }
    }
}

class WeekWidgetProvider : BaseScheduleWidgetProvider() {
    override fun render(
        context: Context,
        appWidgetId: Int,
    ): RemoteViews {
        val records = ScheduleWidgetData.read(context)
        val employee = ScheduleWidgetData.employeeName(context)
        val today = LocalDate.now()
        val monday = today.minusDays((today.dayOfWeek.value - 1).toLong())
        val todayItem = ScheduleWidgetData.display(records[today])

        val labelIds = intArrayOf(
            R.id.widget_week_day_1_label,
            R.id.widget_week_day_2_label,
            R.id.widget_week_day_3_label,
            R.id.widget_week_day_4_label,
            R.id.widget_week_day_5_label,
            R.id.widget_week_day_6_label,
            R.id.widget_week_day_7_label,
        )
        val valueIds = intArrayOf(
            R.id.widget_week_day_1_value,
            R.id.widget_week_day_2_value,
            R.id.widget_week_day_3_value,
            R.id.widget_week_day_4_value,
            R.id.widget_week_day_5_value,
            R.id.widget_week_day_6_value,
            R.id.widget_week_day_7_value,
        )
        val accentIds = intArrayOf(
            R.id.widget_week_day_1_accent,
            R.id.widget_week_day_2_accent,
            R.id.widget_week_day_3_accent,
            R.id.widget_week_day_4_accent,
            R.id.widget_week_day_5_accent,
            R.id.widget_week_day_6_accent,
            R.id.widget_week_day_7_accent,
        )

        return RemoteViews(context.packageName, R.layout.widget_week).apply {
            setTextViewText(
                R.id.widget_week_title,
                employee.ifBlank { "Неделя" },
            )
            setTextViewText(R.id.widget_week_today_value, todayItem.primary)
            setTextViewText(
                R.id.widget_week_today_detail,
                todayItem.secondary.ifBlank {
                    "Сегодня · ${today.format(ScheduleWidgetData.shortDate)}"
                },
            )
            setInt(R.id.widget_week_today_accent, "setBackgroundColor", todayItem.accent)

            (0..6).forEach { offset ->
                val date = monday.plusDays(offset.toLong())
                val item = ScheduleWidgetData.display(records[date])
                val isToday = date == today

                setTextViewText(
                    labelIds[offset],
                    if (isToday) {
                        "Сегодня"
                    } else {
                        "${ScheduleWidgetData.dayLabel(date)} ${date.dayOfMonth}"
                    },
                )
                setTextViewText(
                    valueIds[offset],
                    ScheduleWidgetData.compact(item.primary),
                )
                setInt(accentIds[offset], "setBackgroundColor", item.accent)
                setTextColor(
                    labelIds[offset],
                    context.getColor(
                        if (isToday) {
                            R.color.widget_primary
                        } else {
                            R.color.widget_on_surface_variant
                        },
                    ),
                )
            }

            setOnClickPendingIntent(
                R.id.widget_week_root,
                ScheduleWidgetData.openAppIntent(context),
            )
        }
    }
}
