import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, theme } from '@/lib/theme';

interface MagicButtonProps {
  size?: number;
}

export default function MagicButton({ size = 64 }: MagicButtonProps) {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/ar-demo');
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <LinearGradient
          colors={[...theme.gradients.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.innerCircle, { borderRadius: size / 2 }]}
        >
          <MaterialIcons name="camera" size={size * 0.5} color={theme.colors.textOnAccent} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Lift it up slightly from the tab bar
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  button: {
    backgroundColor: theme.colors.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  innerCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
