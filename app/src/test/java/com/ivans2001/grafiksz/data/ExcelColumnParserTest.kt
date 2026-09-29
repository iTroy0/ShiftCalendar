package com.ivans2001.grafiksz.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.YearMonth

class ExcelColumnParserTest {
    @Test
    fun mapsKnownTimesToFixedPool() {
        val text = listOf(
            "Наталия",
            "4:00 до 12:30",
            "6:00 до 15:00",
            "7:00 до 16:00",
            "15:00 до 00:00",
            "-",
        ).joinToString("\n")

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertEquals("Наталия", result.employeeName)
        assertEquals(
            "morning_mail",
            (result.days[0].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            "mid_morning_fn",
            (result.days[1].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            "mid_morning_pushkin",
            (result.days[2].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            "night_mail",
            (result.days[3].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            DayStatus.DAY_OFF,
            (result.days[4].value as ParsedCell.Status).status,
        )
    }

    @Test
    fun unknownTimeRequiresPoolAssignmentAndIsNotSavedAsNewShift() {
        val text = "Иван\n10:00 до 12:00\n"

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertEquals(listOf("10:00 до 12:00"), result.unresolvedValues)
        assertTrue(ShiftPool.all.none { it.rangeLabel == "10:00–12:00" })
    }

    @Test
    fun googleSheetsDashVariantsAreRecognized() {
        val text = listOf(
            "Иван",
            "04:00–12:30",
            "12:30—21:00",
            "06:00 - 15:00",
        ).joinToString("\n")

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertEquals(
            "morning_mail",
            (result.days[0].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            "evening_mail",
            (result.days[1].value as ParsedCell.Shift).shiftId,
        )
        assertEquals(
            "mid_morning_fn",
            (result.days[2].value as ParsedCell.Shift).shiftId,
        )
    }

    @Test
    fun invalidTimeIsUnresolvedInsteadOfCrashingImport() {
        val text = "Иван\n99:99 до 12:30\n"

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertEquals(listOf("99:99 до 12:30"), result.unresolvedValues)
    }

    @Test
    fun timeRangeWithExtraGarbageIsNotMatchedPartially() {
        val text = "Иван\n104:00 до 12:30\n"

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertEquals(listOf("104:00 до 12:30"), result.unresolvedValues)
    }

    @Test
    fun blankCellIsNotDayOff() {
        val text = "Иван\n\n-\n"

        val result = ExcelColumnParser.parse(text, YearMonth.of(2026, 2))

        assertTrue(result.days[0].value is ParsedCell.Empty)
        assertEquals(
            DayStatus.DAY_OFF,
            (result.days[1].value as ParsedCell.Status).status,
        )
    }
}
