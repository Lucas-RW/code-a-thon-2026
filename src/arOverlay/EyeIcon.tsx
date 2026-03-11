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
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bobAnim]);

  const translateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 3],
  });

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
    transform: [{ translateY }, { scale: scaleAnim }],
  };

  return (
    <Animated.View style={positionStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
      >
        <Ionicons name="eye-outline" size={22} color={themeColor} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    // Drop shadow (iOS + Android elevation)
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
    elevation: 5,
  },
});
