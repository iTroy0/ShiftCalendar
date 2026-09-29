package com.ivans2001.grafiksz.data

import java.time.LocalDate
import java.time.LocalTime

enum class ThemeMode {
    SYSTEM,
    LIGHT,
    DARK,
}

enum class DayStatus(val title: String, val shortCode: String) {
    DAY_OFF("Выходной", "ВЫХ"),
    VACATION("Отпуск", "ОТП"),
    SICK("Больничный", "БОЛ"),
    STUDY("Сессия", "СЕС"),
    K_MARK("Отметка «К»", "К"),
}

data class ShiftPreset(
    val id: String,
    val title: String,
    val start: LocalTime,
    val end: LocalTime,
    val purpose: String,
    val color: Long,
) {
    val rangeLabel: String
        get() = String.format(
            "%02d:%02d–%02d:%02d",
            start.hour,
            start.minute,
            end.hour,
            end.minute,
        )

    val durationMinutes: Int
        get() {
            val startMinutes = (start.hour * 60) + start.minute
            var endMinutes = (end.hour * 60) + end.minute
            if (endMinutes <= startMinutes) {
                endMinutes += 24 * 60
            }
            return endMinutes - startMinutes
        }
}

data class DayRecord(
    val shiftId: String? = null,
    val status: DayStatus? = null,
    val overtimeMinutes: Int = 0,
    val note: String = "",
) {
    val isEmpty: Boolean
        get() = shiftId == null && status == null && overtimeMinutes == 0 && note.isBlank()
}

data class DatedRecord(
    val date: LocalDate,
    val record: DayRecord,
)

enum class ScheduleViewMode {
    MONTH,
    WEEK,
    LIST,
}

enum class StatsPeriod {
    MONTH,
    YEAR,
}
