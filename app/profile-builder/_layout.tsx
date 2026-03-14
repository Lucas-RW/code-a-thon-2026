import { Stack } from 'expo-router';
import { ProfileBuilderProvider } from '@/context/ProfileBuilderContext';

export default function ProfileBuilderLayout() {
  return (
    <ProfileBuilderProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="step1-basics" />
        <Stack.Screen name="step2-goals" />
        <Stack.Screen name="step3-goal-details" />
      </Stack>
    </ProfileBuilderProvider>
  );
}
