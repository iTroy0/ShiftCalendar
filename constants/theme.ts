import { Platform, TextStyle, ViewStyle } from 'react-native';

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, sheet: 28, pill: 999 } as const;

export const Type = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 } as TextStyle,
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 } as TextStyle,
  heading: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 } as TextStyle,
  body: { fontSize: 15, fontWeight: '500' } as TextStyle,
  label: { fontSize: 13, fontWeight: '600' } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500' } as TextStyle,
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' } as TextStyle,
  number: { fontVariant: ['tabular-nums'] } as TextStyle,
};

/** Soft elevation that reads well on both themes. */
export function elevation(level: 1 | 2 | 3, shadowColor = '#000'): ViewStyle {
  const radius = [0, 6, 12, 20][level];
  const opacity = [0, 0.08, 0.14, 0.22][level];
  return Platform.select<ViewStyle>({
    ios: { shadowColor, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: level * 2 } },
    android: { elevation: level * 3, shadowColor },
    default: { shadowColor, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: level * 2 } },
  })!;
}
