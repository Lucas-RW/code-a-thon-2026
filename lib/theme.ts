import { Platform, ViewStyle } from 'react-native';

export const theme = {
  colors: {
    backgroundPrimary: '#0B0B0F',
    backgroundSecondary: '#111827',
    backgroundTertiary: '#0F172A',
    surface: '#171A2B',
    surfaceAlt: '#1F1B3A',
    surfaceMuted: '#14182A',
    border: '#2D335A',
    borderStrong: '#4C5BD4',
    textPrimary: '#F8FAFC',
    textSecondary: '#B7C0D8',
    textMuted: '#7C88A5',
    textOnAccent: '#FFFFFF',
    accent: '#7C3AED',
    accentSecondary: '#4F46E5',
    accentTertiary: '#2563EB',
    success: '#22C55E',
    error: '#F87171',
    info: '#60A5FA',
    dangerSurface: '#341625',
    accentWash: 'rgba(124, 58, 237, 0.18)',
    accentLine: 'rgba(124, 58, 237, 0.45)',
    blueWash: 'rgba(37, 99, 235, 0.18)',
    whiteSoft: 'rgba(255,255,255,0.08)',
  },
  gradients: {
    accent: ['#7C3AED', '#4F46E5', '#2563EB'] as const,
    hero: ['#14162A', '#111827', '#0B0B0F'] as const,
    panelGlow: ['rgba(124,58,237,0.24)', 'rgba(79,70,229,0.14)', 'rgba(37,99,235,0.06)'] as const,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
};

export const shadows = {
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#6D5EF7',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#04050A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
};
