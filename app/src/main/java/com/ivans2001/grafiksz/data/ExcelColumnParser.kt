package com.ivans2001.grafiksz.data

import java.time.LocalDate
import java.time.YearMonth

sealed interface ParsedCell {
    data object Empty : ParsedCell
    data class Shift(val shiftId: String) : ParsedCell
    data class Status(val status: DayStatus) : ParsedCell
    data class Unresolved(val raw: String) : ParsedCell
}

data class ParsedDay(
    val date: LocalDate,
    val source: String,
    val value: ParsedCell,
)

data class ParsedImport(
    val employeeName: String,
    val daysInMonth: Int,
    val sourceDayCount: Int,
    val days: List<ParsedDay>,
) {
    val unresolvedValues: List<String>
        get() = days
            .mapNotNull { (it.value as? ParsedCell.Unresolved)?.raw }
            .distinct()

    val recognizedCount: Int
        get() = days.count { it.value is ParsedCell.Shift }

    val statusCount: Int
        get() = days.count { it.value is ParsedCell.Status }

    val unresolvedCount: Int
        get() = days.count { it.value is ParsedCell.Unresolved }

    val isCompleteColumn: Boolean
        get() = sourceDayCount >= daysInMonth
}

object ExcelColumnParser {
    fun parse(text: String, month: YearMonth): ParsedImport {
        val rawLines = text
            .replace("\r", "")
            .split("\n")
            .map { line -> line.substringBefore('\t').trim() }

        val hasEmployeeName = rawLines
            .firstOrNull()
            ?.takeIf { it.isNotBlank() && !looksLikeScheduleValue(it) }
            != null

        val employeeName = if (hasEmployeeName) {
            rawLines.first().removeSuffix("+").trim()
        } else {
            ""
        }

        val dayLines = if (hasEmployeeName) rawLines.drop(1) else rawLines
        val daysInMonth = month.lengthOfMonth()

        val parsedDays = (1..daysInMonth).map { day ->
            val raw = dayLines.getOrNull(day - 1).orEmpty()
            ParsedDay(
                date = month.atDay(day),
                source = raw,
                value = parseCell(raw),
            )
        }

        return ParsedImport(
            employeeName = employeeName,
            daysInMonth = daysInMonth,
            sourceDayCount = dayLines.size.coerceAtMost(daysInMonth),
            days = parsedDays,
        )
    }

    private fun parseCell(raw: String): ParsedCell {
        val value = raw.trim()
        if (value.isEmpty()) {
            return ParsedCell.Empty
        }

        when (value.lowercase()) {
            "-" -> return ParsedCell.Status(DayStatus.DAY_OFF)
            "отпуск" -> return ParsedCell.Status(DayStatus.VACATION)
            "больничный" -> return ParsedCell.Status(DayStatus.SICK)
            "сессия" -> return ParsedCell.Status(DayStatus.STUDY)
            "к" -> return ParsedCell.Status(DayStatus.K_MARK)
        }

        ShiftPool.matchRawTime(value)?.let { shift ->
            return ParsedCell.Shift(shift.id)
        }

        return ParsedCell.Unresolved(value)
    }

    private fun looksLikeScheduleValue(value: String): Boolean {
        if (value.isBlank()) {
            return true
        }

        if (
            value == "-"
            || value.equals("Отпуск", ignoreCase = true)
            || value.equals("Больничный", ignoreCase = true)
            || value.equals("Сессия", ignoreCase = true)
            || value.equals("К", ignoreCase = true)
        ) {
            return true
        }

        return ShiftPool.normalizeTimeRange(value) != null
    }
}
