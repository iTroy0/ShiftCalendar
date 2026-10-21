import React from 'react';
import type { ColorProp, WidgetRepresentation } from 'react-native-android-widget';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetModel } from './widgetModel';

interface WidgetTheme {
  background: ColorProp;
  title: ColorProp;
  text: ColorProp;
  muted: ColorProp;
  emptyBadge: ColorProp;
  emptyBadgeText: ColorProp;
  accent: ColorProp;
  todayBg: ColorProp;
}

const DARK_THEME: WidgetTheme = {
  background: '#17171D',
  title: '#F4F4F6',
  text: '#D4D4DA',
  muted: '#7A7A86',
  emptyBadge: '#24242D',
  emptyBadgeText: '#55555F',
  accent: '#8E91FA',
  todayBg: '#26264A',
};

const LIGHT_THEME: WidgetTheme = {
  background: '#FFFEFC',
  title: '#262320',
  text: '#4A4540',
  muted: '#9C968E',
  emptyBadge: '#EFECE7',
  emptyBadgeText: '#BDB7AE',
  accent: '#4F46E5',
  todayBg: '#E8E8FD',
};

const c = (value: string) => value as ColorProp;

export function ShiftWeekWidget({ model, isDark = true }: { model: WidgetModel; isDark?: boolean }) {
  const t = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 22,
        backgroundColor: t.background,
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent', marginBottom: 8 }}>
        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
          <TextWidget text={model.headline} maxLines={1} truncate="END" style={{ fontSize: 14, fontWeight: 'bold', color: t.title }} />
          {model.detail ? (
            <TextWidget text={model.detail} maxLines={1} truncate="END" style={{ fontSize: 11, color: t.muted, marginTop: 1 }} />
          ) : null}
        </FlexWidget>
        <TextWidget text={model.title} maxLines={1} truncate="END" style={{ fontSize: 11, fontWeight: 'bold', color: t.accent, marginLeft: 8 }} />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', flex: 1 }}>
        {model.days.map((day) => (
          <FlexWidget
            key={day.key}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              marginHorizontal: 2,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: day.isToday ? t.todayBg : c('#00000000'),
            }}
          >
            <TextWidget
              text={day.letter}
              style={{ fontSize: 10, fontWeight: day.isToday ? 'bold' : 'normal', color: day.isToday ? t.accent : t.muted }}
            />
            <TextWidget
              text={day.dayNum}
              style={{ fontSize: 13, fontWeight: 'bold', color: day.isToday ? t.accent : t.text, marginBottom: 4 }}
            />
            <FlexWidget
              style={{
                width: 30,
                height: 26,
                borderRadius: 8,
                backgroundColor: day.code ? c(day.color) : t.emptyBadge,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextWidget
                text={day.code || '·'}
                style={{ fontSize: day.code.length > 2 ? 9 : 11, fontWeight: 'bold', color: day.code ? c(day.textColor) : t.emptyBadgeText }}
              />
            </FlexWidget>
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}

/** Renders a single tree for an explicit theme, or both variants so Android follows the system theme. */
export function renderShiftWidget(model: WidgetModel, themeMode: string): WidgetRepresentation {
  if (themeMode === 'light') return <ShiftWeekWidget model={model} isDark={false} />;
  if (themeMode === 'dark') return <ShiftWeekWidget model={model} isDark />;
  return {
    light: <ShiftWeekWidget model={model} isDark={false} />,
    dark: <ShiftWeekWidget model={model} isDark />,
  };
}
