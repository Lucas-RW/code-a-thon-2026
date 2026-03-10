import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { createOrUpdateUserProfile } from '@/lib/api';
import { useOnboarding } from '@/context/OnboardingContext';

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

export default function OnboardingScreen() {
  const { user } = useUser();
  const { setOnboardingComplete } = useOnboarding();
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [major, setMajor] = React.useState('');
  const [year, setYear] = React.useState('');
  const [interests, setInterests] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit() {
    if (!user) return;
    if (!name.trim() || !major.trim() || !year || !interests.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const interestsList = interests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      const payload = {
        clerk_user_id: user.id,
        name: name.trim(),
        major: major.trim(),
        year,
        interests: interestsList,
      };

      const result = await createOrUpdateUserProfile(payload);

      if (!result.ok) {
        setError(result.error ?? 'Failed to save your profile. Please try again.');
        setLoading(false);
        return;
      }

      // Mark onboarding complete in Clerk (unsafeMetadata is client-writable).
      await user.update({ unsafeMetadata: { onboardingComplete: true } });

      // Update local state so AuthGate re-renders immediately.
      setOnboardingComplete();

      // Navigate to main app.
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself to get started.</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alex Johnson"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Major</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Computer Science"
          placeholderTextColor="#666"
          value={major}
          onChangeText={setMajor}
        />

        <Text style={styles.label}>Year</Text>
        <View style={styles.yearRow}>
          {YEARS.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, year === y && styles.yearChipSelected]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearChipText, year === y && styles.yearChipTextSelected]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Interests</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="ai, robotics, sustainability (comma-separated)"
          placeholderTextColor="#666"
          value={interests}
          onChangeText={setInterests}
          multiline
          numberOfLines={3}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Started →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#A78BFA',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#1A1A2E',
    color: '#F0F0FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333366',
  },
  inputMultiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333366',
    backgroundColor: '#1A1A2E',
  },
  yearChipSelected: {
    backgroundColor: '#6C47FF',
    borderColor: '#6C47FF',
  },
  yearChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  yearChipTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
