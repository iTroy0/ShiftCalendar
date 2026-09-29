package com.ivans2001.grafiksz.ui.theme

/**
 * Цветовая семантика взята из легенды Excel СЗ и адаптирована для интерфейса.
 *
 * Исходные Excel:
 * morning          #6AA84F
 * evening          #FF9900
 * mid morning FN   #FF00FF
 * mid morning PK   #00FFFF
 * mid evening FN   #BF9000
 * night            #CC4125
 * working weekend  #FF0000
 * overtime         #4A86E8
 * regular          white / no fill
 *
 * В UI сохраняем тот же hue/смысл, но уменьшаем неоновость и выравниваем
 * читаемость на светлых/тёмных Material 3 поверхностях.
 */
object SchedulePalette {
    const val Morning = 0xFF5C8B45L
    const val Evening = 0xFFC77800L
    const val MidMorningFn = 0xFFAD45AEL
    const val MidMorningPushkin = 0xFF078B96L
    const val MidEveningFn = 0xFF896800L
    const val Night = 0xFFAD452FL
    const val Regular = 0xFF777D8BL
    const val WorkingWeekend = 0xFFC73B3BL
    const val Overtime = 0xFF4A73C7L
}
