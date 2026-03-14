import * as React from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ActivityIndicator, View } from 'react-native';

import { GraphProvider } from '@/context/GraphContext';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
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
  );
}
