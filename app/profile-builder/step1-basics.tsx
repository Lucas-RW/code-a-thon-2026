import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileBuilder } from '@/context/ProfileBuilderContext';

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'];

export default function Step1Basics() {
  const { profileData, updateProfileData } = useProfileBuilder();
  const router = useRouter();

  const handleNext = () => {
    if (!profileData.name || !profileData.year || !profileData.major) {
      // In a real app we'd show a toast here
      return;
    }
    router.push('/profile-builder/step2-goals' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
          <Text style={styles.title}>The Basics</Text>
          <Text style={styles.subtitle}>Tell us a bit about your academic journey.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="How should we call you?"
              placeholderTextColor="#666"
              value={profileData.name}
              onChangeText={(text) => updateProfileData({ name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Academic Year</Text>
            <View style={styles.chipContainer}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => updateProfileData({ year: y })}
                  style={[
                    styles.chip,
                    profileData.year === y && styles.chipActive,
                  ]}
                >
                  <Text style={[styles.chipText, profileData.year === y && styles.chipTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you studying?"
              placeholderTextColor="#666"
              value={profileData.major}
              onChangeText={(text) => updateProfileData({ major: text })}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>First Generation Student</Text>
              <Text style={styles.switchSublabel}>First in your family to attend college</Text>
            </View>
            <Switch
              value={profileData.is_first_gen}
              onValueChange={(v) => updateProfileData({ is_first_gen: v })}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={profileData.is_first_gen ? '#000' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Transfer Student</Text>
              <Text style={styles.switchSublabel}>Transferred from another institution</Text>
            </View>
            <Switch
              value={profileData.is_transfer}
              onValueChange={(v) => updateProfileData({ is_transfer: v })}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={profileData.is_transfer ? '#000' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, (!profileData.name || !profileData.year || !profileData.major) && styles.buttonDisabled]} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  stepText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  form: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  chipText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  switchSublabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  nextButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
