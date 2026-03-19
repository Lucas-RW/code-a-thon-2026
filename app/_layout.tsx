import * as React from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GraphProvider } from '@/context/GraphContext';
import { theme } from '@/lib/theme';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, userProfile, isLoading, isProfileComplete } = useAuth();

  React.useEffect(() => {
    if (isLoading) return;

    if (!accessToken) {
      router.replace('/auth/login' as any);
    } else if (userProfile && !isProfileComplete) {
      router.replace('/profile-builder/step1-basics' as any);
    }
  }, [accessToken, isLoading, userProfile, isProfileComplete]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.backgroundPrimary }}>
        <ActivityIndicator size="large" color={theme.colors.accentTertiary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <GraphProvider>
            <NavigationGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="profile-builder" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </NavigationGuard>
          </GraphProvider>
        </ToastProvider>
        <StatusBar style="light" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
