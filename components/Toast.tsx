import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tap } from './ui/Tap';
import { haptic } from '../utils/haptics';

export interface ToastMessage {
  id: number;
  message: string;
  undo?: () => void;
  tone?: 'success' | 'info' | 'warning';
}

interface Props {
  toast: ToastMessage | null;
  onHide: () => void;
}

const TONES = {
  success: { bg: '#0F766E', icon: 'check-circle' as const },
  info: { bg: '#3730A3', icon: 'information' as const },
  warning: { bg: '#B45309', icon: 'alert-circle' as const },
};

/** Top snackbar. A new toast (new id) restarts the timer even while one is showing. */
export function Toast({ toast, onHide }: Props) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onHideRef.current();
      });
    }, toast.undo ? 5000 : 2600);
    return () => clearTimeout(timer);
  }, [toast, anim]);

  if (!toast) return null;
  const tone = TONES[toast.tone ?? 'success'];

  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: tone.bg,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <MaterialCommunityIcons name={tone.icon} size={20} color="#FFF" />
      <Text style={styles.text} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.undo && (
        <Tap
          style={styles.undoBtn}
          accessibilityLabel="Undo"
          onPress={() => {
            haptic.light();
            toast.undo?.();
            onHideRef.current();
          }}
        >
          <MaterialCommunityIcons name="undo-variant" size={16} color="#FFF" />
          <Text style={styles.undoText}>Undo</Text>
        </Tap>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 16,
    gap: 10,
    zIndex: 999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  text: { color: '#FFF', fontSize: 14, fontWeight: '700', flex: 1 },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  undoText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
