package com.ivans2001.grafiksz

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.ivans2001.grafiksz.data.ScheduleStore
import com.ivans2001.grafiksz.ui.GrafikSzApp
import com.ivans2001.grafiksz.ui.theme.GrafikSzTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val store = ScheduleStore(applicationContext)

        setContent {
            GrafikSzTheme(
                themeMode = store.themeMode,
                accentMode = store.accentMode,
            ) {
                GrafikSzApp(store = store)
            }
        }
    }
}
