package com.ivans2001.grafiksz.data

import com.ivans2001.grafiksz.ui.theme.SchedulePalette
import java.time.LocalTime

object ShiftPool {
    val all: List<ShiftPreset> = listOf(
        ShiftPreset(
            id = "morning_mail",
            title = "Утренняя смена",
            start = LocalTime.of(4, 0),
            end = LocalTime.of(12, 30),
            purpose = "Почта и Verbox",
            color = SchedulePalette.Morning,
        ),
        ShiftPreset(
            id = "evening_mail",
            title = "Вечерняя смена",
            start = LocalTime.of(12, 30),
            end = LocalTime.of(21, 0),
            purpose = "Почта и Verbox",
            color = SchedulePalette.Evening,
        ),
        ShiftPreset(
            id = "mid_morning_fn",
            title = "Средняя утренняя смена",
            start = LocalTime.of(6, 0),
            end = LocalTime.of(15, 0),
            purpose = "Замена ФН",
            color = SchedulePalette.MidMorningFn,
        ),
        ShiftPreset(
            id = "mid_morning_pushkin",
            title = "Средняя утренняя смена",
            start = LocalTime.of(7, 0),
            end = LocalTime.of(16, 0),
            purpose = "Отменённые мероприятия с Пушкинской картой",
            color = SchedulePalette.MidMorningPushkin,
        ),
        ShiftPreset(
            id = "mid_evening_fn",
            title = "Средняя вечерняя смена",
            start = LocalTime.of(11, 0),
            end = LocalTime.of(20, 0),
            purpose = "Замена ФН",
            color = SchedulePalette.MidEveningFn,
        ),
        ShiftPreset(
            id = "night_mail",
            title = "Ночная смена",
            start = LocalTime.of(15, 0),
            end = LocalTime.MIDNIGHT,
            purpose = "Почта и Verbox с 21:00 до 00:00",
            color = SchedulePalette.Night,
        ),
        ShiftPreset(
            id = "regular_08",
            title = "Обычная смена",
            start = LocalTime.of(8, 0),
            end = LocalTime.of(17, 0),
            purpose = "Рабочая смена",
            color = SchedulePalette.Regular,
        ),
        ShiftPreset(
            id = "regular_09",
            title = "Обычная смена",
            start = LocalTime.of(9, 0),
            end = LocalTime.of(18, 0),
            purpose = "Рабочая смена",
            color = SchedulePalette.Regular,
        ),
        ShiftPreset(
            id = "working_weekend_long",
            title = "Рабочий выходной",
            start = LocalTime.of(4, 0),
            end = LocalTime.of(21, 0),
            purpose = "Рабочий выходной",
            color = SchedulePalette.WorkingWeekend,
        ),
        ShiftPreset(
            id = "working_weekend_evening",
            title = "Рабочий выходной",
            start = LocalTime.of(12, 30),
            end = LocalTime.MIDNIGHT,
            purpose = "Рабочий выходной",
            color = SchedulePalette.WorkingWeekend,
        ),
    )

    private val byId: Map<String, ShiftPreset> = all.associateBy { it.id }

    fun byId(id: String?): ShiftPreset? = id?.let(byId::get)

    fun matchRawTime(raw: String): ShiftPreset? {
        val range = normalizeTimeRange(raw) ?: return null
        return all.firstOrNull { shift ->
            shift.start == range.first && shift.end == range.second
        }
    }

    fun normalizeTimeRange(raw: String): Pair<LocalTime, LocalTime>? {
        val match = Regex(
            """(\d{1,2})[.:](\d{2})\s*(?:до|-)\s*(\d{1,2})[.:](\d{2})""",
            RegexOption.IGNORE_CASE,
        ).find(raw.trim()) ?: return null

        val start = LocalTime.of(
            match.groupValues[1].toInt(),
            match.groupValues[2].toInt(),
        )
        val end = LocalTime.of(
            match.groupValues[3].toInt(),
            match.groupValues[4].toInt(),
        )
        return start to end
    }
}
