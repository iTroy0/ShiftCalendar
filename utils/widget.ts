import { Platform } from 'react-native';
import { buildWidgetModel, WidgetInput } from '../widgets/widgetModel';

/** Redraws any home-screen widgets from in-memory data (Android only; a no-op elsewhere). */
export async function refreshWidget(input: WidgetInput, themeMode: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { renderShiftWidget } = require('../widgets/ShiftWeekWidget');
    const model = buildWidgetModel(input);
    await requestWidgetUpdate({
      widgetName: 'ShiftWeek',
      renderWidget: () => renderShiftWidget(model, themeMode),
    });
  } catch (e) {
    // The widget module is missing in Expo Go; nothing to update there.
    console.warn('Widget refresh skipped', e);
  }
}
