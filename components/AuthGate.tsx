import * as React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { useOnboarding } from '@/context/OnboardingContext';

/**
 * AuthGate — sits above every screen and enforces the three-state navigation:
 *   1. Loading → spinner
 *   2. Not signed in → /auth/sign-in
 *   3. Signed in but not onboarded → /onboarding
 *   4. Fully onboarded → render children (the main tabs)
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { hasCompletedOnboarding } = useOnboarding();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/auth/sign-in" />;
  }

  // Double-check Clerk metadata as source of truth after load.
  const onboardedViaClerk = !!(user?.unsafeMetadata?.onboardingComplete);

  if (!hasCompletedOnboarding && !onboardedViaClerk) {
    return <Redirect href="/onboarding" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
});
