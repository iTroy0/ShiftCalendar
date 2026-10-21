import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Insets } from 'react-native';

export interface TapProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  /** Opacity while pressed (default 0.6). */
  activeOpacity?: number;
  /** Slight shrink while pressed for tactile feel. */
  scale?: boolean;
}

const DEFAULT_HIT_SLOP: Insets = { top: 6, bottom: 6, left: 6, right: 6 };

/** Pressable with consistent pressed feedback and a forgiving default hit area. */
export const Tap = React.forwardRef<React.ElementRef<typeof Pressable>, TapProps>(function Tap(
  {
    style,
    activeOpacity = 0.6,
    scale,
    hitSlop = DEFAULT_HIT_SLOP,
    accessibilityRole = 'button',
    accessibilityState,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <Pressable
      ref={ref}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      style={({ pressed }) => [
        typeof style === 'function' ? style(pressed) : style,
        pressed && { opacity: activeOpacity, transform: scale ? [{ scale: 0.97 }] : undefined },
      ]}
      {...rest}
    />
  );
});
