import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface EyeIconProps {
  /** Called when the icon is tapped. */
  onPress: () => void;
  /** Pixel X position (absolute). */
  x: number;
  /** Pixel Y position (absolute). */
  y: number;
  /** Optional accent colour for the icon (defaults to white). */
  themeColor?: string;
}

const ICON_SIZE = 44;

/**
 * A floating eye-icon marker used in the AR overlay.
 * Features a gentle vertical bobbing animation and press-scale feedback.
 */
export default function EyeIcon({ onPress, x, y, themeColor = '#FFFFFF' }: EyeIconProps) {
  // ── Bobbing animation ──────────────────────────────────────────
  const popAnim = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    Animated.spring(popAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [popAnim]);

  // ── Press scale animation ──────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    // Subtle mobile feel
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // ── Position style ─────────────────────────────────────────────
  const positionStyle: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    left: x - ICON_SIZE / 2,
    top: y - ICON_SIZE / 2,
    transform: [{ scale: Animated.multiply(popAnim, scaleAnim) }],
  };

  return (
    <Animated.View style={positionStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
      >
        <Ionicons name="search" size={21} color={themeColor} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    elevation: 5,
  },
});
