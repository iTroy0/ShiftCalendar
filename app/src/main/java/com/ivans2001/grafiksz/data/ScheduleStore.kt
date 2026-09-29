package com.ivans2001.grafiksz.data

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateMap
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.YearMonth

class ScheduleStore(context: Context) {
    private val preferences = context.getSharedPreferences(
        "grafik_sz",
        Context.MODE_PRIVATE,
    )

    private val recordsState = mutableStateMapOf<LocalDate, DayRecord>()

    val records: SnapshotStateMap<LocalDate, DayRecord>
        get() = recordsState

    var employeeName by mutableStateOf(
        preferences.getString(KEY_EMPLOYEE_NAME, "").orEmpty(),
    )
        private set

    var themeMode by mutableStateOf(
        runCatching {
            ThemeMode.valueOf(
                preferences.getString(KEY_THEME, ThemeMode.SYSTEM.name)
                    ?: ThemeMode.SYSTEM.name,
            )
        }.getOrDefault(ThemeMode.SYSTEM),
    )
        private set

    init {
        loadRecords()
    }

    fun record(date: LocalDate): DayRecord? = recordsState[date]

    fun saveDay(date: LocalDate, record: DayRecord) {
        if (record.isEmpty) {
            recordsState.remove(date)
        } else {
            recordsState[date] = record
        }
        persistRecords()
    }

    fun clearDay(date: LocalDate) {
        recordsState.remove(date)
        persistRecords()
    }

    fun replaceMonth(
        month: YearMonth,
        imported: Map<LocalDate, DayRecord>,
        importedEmployeeName: String,
    ) {
        recordsState.keys
            .filter { YearMonth.from(it) == month }
            .toList()
            .forEach(recordsState::remove)

        imported.forEach { (date, record) ->
            if (!record.isEmpty) {
                recordsState[date] = record
            }
        }

        if (importedEmployeeName.isNotBlank()) {
            employeeName = importedEmployeeName
            preferences.edit()
                .putString(KEY_EMPLOYEE_NAME, importedEmployeeName)
                .apply()
        }

        persistRecords()
    }

    fun setThemeMode(value: ThemeMode) {
        themeMode = value
        preferences.edit()
            .putString(KEY_THEME, value.name)
            .apply()
    }

    fun clearAll() {
        recordsState.clear()
        employeeName = ""
        preferences.edit().clear().apply()
        themeMode = ThemeMode.SYSTEM
    }

    private fun loadRecords() {
        val raw = preferences.getString(KEY_RECORDS, null) ?: return
        val array = runCatching { JSONArray(raw) }.getOrNull() ?: return

        for (index in 0 until array.length()) {
            val item = array.optJSONObject(index) ?: continue
            val date = runCatching {
                LocalDate.parse(item.getString("date"))
            }.getOrNull() ?: continue

            val shiftId = item.optString("shiftId")
                .takeIf { it.isNotBlank() }

            val status = item.optString("status")
                .takeIf { it.isNotBlank() }
                ?.let { runCatching { DayStatus.valueOf(it) }.getOrNull() }

            val record = DayRecord(
                shiftId = shiftId,
                status = status,
                overtimeMinutes = item.optInt("overtimeMinutes", 0),
                note = item.optString("note"),
            )

            if (!record.isEmpty) {
                recordsState[date] = record
            }
        }
    }

    private fun persistRecords() {
        val array = JSONArray()

        recordsState
            .toSortedMap()
            .forEach { (date, record) ->
                array.put(
                    JSONObject()
                        .put("date", date.toString())
                        .put("shiftId", record.shiftId ?: "")
                        .put("status", record.status?.name ?: "")
                        .put("overtimeMinutes", record.overtimeMinutes)
                        .put("note", record.note),
                )
            }

        preferences.edit()
            .putString(KEY_RECORDS, array.toString())
            .apply()
    }

    private companion object {
        const val KEY_RECORDS = "records"
        const val KEY_EMPLOYEE_NAME = "employee_name"
        const val KEY_THEME = "theme"
    }
}
