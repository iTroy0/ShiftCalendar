import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface PagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  renderPage: (index: number) => React.ReactNode;
  width: number;
  height?: number;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Told when a swipe starts and ends, so taps that end a swipe can be ignored. */
  onPanStateChange?: (active: boolean) => void;
}

const TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };

function Page({
  pageIndex,
  position,
  width,
  children,
}: {
  pageIndex: number;
  position: SharedValue<number>;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const offset = pageIndex - position.value;
    return {
      transform: [{ translateX: offset * width }],
      opacity: 1 - Math.min(Math.abs(offset), 1) * 0.35,
    };
  });
  // Each page is laid out over the visible area and moved with a transform, so it always
  // receives touches when on screen (Android ignores touches outside a parent's bounds).
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="box-none">
      {children}
    </Animated.View>
  );
}

/**
 * Horizontal, infinitely pageable view. Only the current page and its neighbours are rendered;
 * pages are keyed by index so swiping never re-mounts the page that ends up on screen.
 */
export function Pager({ index, onIndexChange, renderPage, width, height, enabled = true, style, onPanStateChange }: PagerProps) {
  const position = useSharedValue(index);
  const committed = useSharedValue(index);
  const start = useSharedValue(index);
  const activated = useSharedValue(false);
  const [center, setCenter] = useState(index);
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const onPanRef = useRef(onPanStateChange);
  onPanRef.current = onPanStateChange;
  const panChanged = useCallback((active: boolean) => onPanRef.current?.(active), []);

  // Follow index changes made outside the gesture (arrow buttons, "Today", month picker).
  useEffect(() => {
    if (committed.value !== index) {
      const distance = Math.abs(index - committed.value);
      committed.value = index;
      if (distance === 1) position.value = withTiming(index, TIMING);
      else position.value = index;
    }
    setCenter(index);
  }, [index, committed, position]);

  const notify = useCallback((next: number) => {
    setCenter(next);
    onIndexChangeRef.current(next);
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-14, 14])
        .failOffsetY([-16, 16])
        .onBegin(() => {
          cancelAnimation(position);
          start.value = position.value;
        })
        .onStart(() => {
          activated.value = true;
          runOnJS(panChanged)(true);
        })
        .onUpdate((e) => {
          const next = start.value - e.translationX / width;
          position.value = Math.min(Math.max(next, committed.value - 1), committed.value + 1);
        })
        .onEnd((e) => {
          const projected = position.value - (e.velocityX / width) * 0.18;
          const target = Math.min(Math.max(Math.round(projected), committed.value - 1), committed.value + 1);
          position.value = withTiming(target, TIMING);
          if (target !== committed.value) {
            committed.value = target;
            runOnJS(notify)(target);
          }
        })
        .onFinalize((_e, success) => {
          if (!success && position.value !== committed.value) {
            position.value = withTiming(committed.value, TIMING);
          }
          // onFinalize also runs for plain taps; only a swipe that actually started reports back.
          if (activated.value) {
            activated.value = false;
            runOnJS(panChanged)(false);
          }
        }),
    [enabled, width, position, committed, start, activated, notify, panChanged]
  );

  const pages = [center - 1, center, center + 1];

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.container, height !== undefined ? { height } : styles.fill, style]} collapsable={false}>
        {pages.map((p) => (
          <Page key={p} pageIndex={p} position={position} width={width}>
            {renderPage(p)}
          </Page>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%' },
  fill: { flex: 1 },
});
