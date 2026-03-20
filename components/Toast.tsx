import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, theme } from '@/lib/theme';

interface ToastProps {
  message: string;
  type?: 'error' | 'info' | 'success';
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, type = 'error', visible, onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 60,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      
      const timer = setTimeout(() => {
        hide();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible, message, type]);

  const hide = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const gradientColors: [string, string, ...string[]] =
    type === 'error'
      ? [theme.colors.dangerSurface, '#7F1D1D']
      : type === 'success'
        ? ['#123524', '#166534']
        : [...theme.gradients.accent];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hide} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    borderRadius: 12,
    zIndex: 9999,
    overflow: 'hidden',
    ...shadows.glow,
  },
  gradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    color: theme.colors.textOnAccent,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: theme.colors.textOnAccent,
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.85,
  },
});
