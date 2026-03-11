import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, type = 'error', visible, onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 60,
        useNativeDriver: true,
      }).start();
      
      const timer = setTimeout(() => {
        hide();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
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

  return (
    <Animated.View style={[
      styles.container, 
      { transform: [{ translateY }] }, 
      type === 'error' ? styles.error : styles.info
    ]}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hide} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  message: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    opacity: 0.8,
  },
});
