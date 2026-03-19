import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileBuilder } from '@/context/ProfileBuilderContext';
import * as Api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, theme } from '@/lib/theme';
import type { GoalType } from '@/lib/api';

export default function Step3GoalDetails() {
  const { profileData, updateGoalPreferences } = useProfileBuilder();
  const { refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      await Api.updateUserProfile({
        name: profileData.name,
        year: profileData.year,
        major: profileData.major,
        is_first_gen: profileData.is_first_gen,
        is_transfer: profileData.is_transfer,
        goals: profileData.goals as GoalType[],
        goal_preferences: profileData.goal_preferences,
      });
      await refreshProfile();
      showToast('Profile completed!', 'success');
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderCareerSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💼 Career Goals</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Target Roles</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Software Engineer, Designer (comma separated)"
          placeholderTextColor="#666"
          onChangeText={(text) => updateGoalPreferences('career', { ...profileData.goal_preferences.career, target_roles: text.split(',').map(s => s.trim()) })}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipContainer}>
          {['Impact', 'Salary', 'Stability', 'Growth'].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => updateGoalPreferences('career', { ...profileData.goal_preferences.career, priority: p.toLowerCase() })}
              style={[styles.chip, profileData.goal_preferences.career?.priority === p.toLowerCase() && styles.chipActive]}
            >
              <Text style={[styles.chipText, profileData.goal_preferences.career?.priority === p.toLowerCase() && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderResearchSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔬 Research Interests</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fields of interest</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AI, Quantum Physics (comma separated)"
          placeholderTextColor="#666"
          onChangeText={(text) => updateGoalPreferences('research', { ...profileData.goal_preferences.research, fields: text.split(',').map(s => s.trim()) })}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Math Comfort</Text>
        <View style={styles.chipContainer}>
          {['Low', 'Medium', 'High'].map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => updateGoalPreferences('research', { ...profileData.goal_preferences.research, math_comfort: c.toLowerCase() })}
              style={[styles.chip, profileData.goal_preferences.research?.math_comfort === c.toLowerCase() && styles.chipActive]}
            >
              <Text style={[styles.chipText, profileData.goal_preferences.research?.math_comfort === c.toLowerCase() && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAcademicSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📚 Academic Aid</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Courses of Concern</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. CS50, MATH101 (comma separated)"
          placeholderTextColor="#666"
          onChangeText={(text) => updateGoalPreferences('academic_aid', { ...profileData.goal_preferences.academic_aid, courses_of_concern: text.split(',').map(s => s.trim()) })}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Help Style</Text>
        <View style={styles.chipContainer}>
          {['1:1', 'Small Group', 'Drop-in'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => updateGoalPreferences('academic_aid', { ...profileData.goal_preferences.academic_aid, help_style: s.toLowerCase().replace(' ', '_') })}
              style={[styles.chip, profileData.goal_preferences.academic_aid?.help_style === s.toLowerCase().replace(' ', '_') && styles.chipActive]}
            >
              <Text style={[styles.chipText, profileData.goal_preferences.academic_aid?.help_style === s.toLowerCase().replace(' ', '_') && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSocialSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🌱 Social Support</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>What are you seeking?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Community, Mentorship (comma separated)"
          placeholderTextColor="#666"
          onChangeText={(text) => updateGoalPreferences('social_support', { ...profileData.goal_preferences.social_support, seeks: text.split(',').map(s => s.trim()) })}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={[...theme.gradients.hero]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 3 of 3</Text>
          <Text style={styles.title}>The Details</Text>
          <Text style={styles.subtitle}>Help us personalize your experience based on your goals.</Text>
        </View>

        {profileData.goals.includes('career') && renderCareerSection()}
        {profileData.goals.includes('research') && renderResearchSection()}
        {profileData.goals.includes('academic_aid') && renderAcademicSection()}
        {profileData.goals.includes('social_support') && renderSocialSection()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.buttonShell, loading && styles.buttonDisabled]} 
          onPress={handleFinish}
          disabled={loading}
        >
          <LinearGradient colors={[...theme.gradients.accent]} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>{loading ? 'Saving...' : 'Finish'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  stepText: {
    color: theme.colors.accentTertiary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.accentWash,
    borderColor: theme.colors.borderStrong,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: theme.colors.accentTertiary,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  backButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonShell: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.glow,
  },
  nextButton: {
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    color: theme.colors.textOnAccent,
    fontSize: 16,
    fontWeight: '700',
  },
});
