import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { theme, shadows } from '@/lib/theme';
import { BuildingSummary } from '@/lib/api';

const { width, height } = Dimensions.get('window');

interface VoyagerOverlayProps {
  building: BuildingSummary;
  onClose: () => void;
  onNext?: () => void;
  isLast?: boolean;
}

export default function VoyagerOverlay({ building, onClose, onNext, isLast }: VoyagerOverlayProps) {
  const [insight, setInsight] = useState<string>('');
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Reveal animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Floating astronaut animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Simulated "Technical Scan"
    const insights = [
      `${building.name} detected. Analyzing infrastructure...`,
      `Scanning ${building.departments?.join(', ') || 'specialized labs'}...`,
      `Technical depth confirmed: High. Optimal for your career trajectory.`,
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < insights.length) {
        setInsight(insights[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [building]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      
      {/* Astronaut */}
      <Animated.View 
        style={[
          styles.astronautContainer, 
          { transform: [{ translateY: floatAnim }] }
        ]}
      >
        <Image
          source={require('@/assets/images/voyager_astronaut.png')}
          style={styles.astronaut}
          resizeMode="contain"
        />
        <View style={styles.dialogPointer} />
        <View style={styles.dialogBox}>
          <Text style={styles.dialogText}>{insight || 'Initializing deep scan...'}</Text>
        </View>
      </Animated.View>

      {/* Control Panel */}
      <Animated.View style={[styles.footer, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.buildingInfo}>
          <Text style={styles.buildingLabel}>CURRENT SECTOR</Text>
          <Text style={styles.buildingName}>{building.name}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          {onNext && (
            <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
              <Text style={styles.nextBtnText}>{isLast ? 'FINISH JOURNEY' : 'NEXT SECTOR'}</Text>
              <MaterialIcons name={isLast ? "check" : "arrow-forward"} size={20} color={theme.colors.backgroundPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  astronautContainer: {
    position: 'absolute',
    top: height * 0.2,
    right: 20,
    alignItems: 'center',
    width: 280,
  },
  astronaut: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  dialogBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    ...shadows.glow,
  },
  dialogPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.95)',
    transform: [{ rotate: '180deg' }],
    marginBottom: -2,
    zIndex: 1,
  },
  dialogText: {
    color: '#050505',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingLabel: {
    color: theme.colors.accentTertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  buildingName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentTertiary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    ...shadows.glow,
  },
  nextBtnText: {
    color: theme.colors.backgroundPrimary,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
