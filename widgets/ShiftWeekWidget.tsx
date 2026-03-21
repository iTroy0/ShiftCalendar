import React from 'react';
import type { ColorProp } from 'react-native-android-widget';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface DayData {
  dayLetter: string;
  dayNum: string;
  shiftCode: string;
  shiftColor: string;
  isToday: boolean;
}

interface WidgetTheme {
  background: ColorProp;
  headerText: ColorProp;
  dayLetterDefault: ColorProp;
  dayNumDefault: ColorProp;
  emptyBadge: ColorProp;
  emptyBadgeText: ColorProp;
  accent: ColorProp;
}

const DARK_THEME: WidgetTheme = {
  background: '#1A1A1A',
  headerText: '#A0A0A0',
  dayLetterDefault: '#666666',
  dayNumDefault: '#FFFFFF',
  emptyBadge: '#2A2A2A',
  emptyBadgeText: '#444444',
  accent: '#818CF8',
};

const LIGHT_THEME: WidgetTheme = {
  background: '#F2F3F5',
  headerText: '#6B7280',
  dayLetterDefault: '#9CA3AF',
  dayNumDefault: '#1A1A1A',
  emptyBadge: '#E2E4E8',
  emptyBadgeText: '#9CA3AF',
  accent: '#6366F1',
};

interface Props {
  days: DayData[];
  isDark?: boolean;
}

export function ShiftWeekWidget({ days, isDark = true }: Props) {
  const t = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        padding: 16,
        borderRadius: 20,
        backgroundColor: t.background,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 10,
        }}
      >
        <TextWidget
          text="Shift Calendar"
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: t.headerText,
          }}
        />
      </FlexWidget>

      {/* Days row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          flex: 1,
        }}
      >
        {days.map((day, i) => (
          <FlexWidget
            key={String(i)}
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            {/* Day letter */}
            <TextWidget
              text={day.dayLetter}
              style={{
                fontSize: 11,
                color: (day.isToday ? t.accent : t.dayLetterDefault) as ColorProp,
                fontWeight: day.isToday ? 'bold' : 'normal',
              }}
            />

            {/* Day number */}
            <TextWidget
              text={day.dayNum}
              style={{
                fontSize: 13,
                color: (day.isToday ? t.accent : t.dayNumDefault) as ColorProp,
                fontWeight: day.isToday ? 'bold' : 'normal',
                marginBottom: 6,
              }}
            />

            {/* Shift badge */}
            <FlexWidget
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: (day.shiftCode ? day.shiftColor : t.emptyBadge) as ColorProp,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextWidget
                text={day.shiftCode || '\u2014'}
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: (day.shiftCode ? '#FFFFFF' : t.emptyBadgeText) as ColorProp,
                }}
              />
            </FlexWidget>
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
