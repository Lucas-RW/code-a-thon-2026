import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileBuilder } from '@/context/ProfileBuilderContext';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, theme } from '@/lib/theme';

const GOALS = [
  { id: 'career', label: 'Career Opportunities', icon: '💼', description: 'Internships, jobs, and professional growth.' },
  { id: 'research', label: 'Research', icon: '🔬', description: 'Labs, projects, and academic inquiry.' },
  { id: 'academic_aid', label: 'Academic Aid', icon: '📚', description: 'Tutoring, study groups, and course support.' },
  { id: 'social_support', label: 'Social Support & Wellbeing', icon: '🌱', description: 'Community, mental health, and belonging.' },
];

export default function Step2Goals() {
  const { profileData, updateProfileData } = useProfileBuilder();
  const router = useRouter();

  const toggleGoal = (goalId: string) => {
    const goals = [...profileData.goals];
    if (goals.includes(goalId)) {
      updateProfileData({ goals: goals.filter((g) => g !== goalId) });
    } else {
      updateProfileData({ goals: [...goals, goalId] });
    }
  };

  const handleNext = () => {
    if (profileData.goals.length === 0) return;
    router.push('/profile-builder/step3-goal-details' as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <LinearGradient colors={[...theme.gradients.hero]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 2 of 3</Text>
          <Text style={styles.title}>What are your goals?</Text>
          <Text style={styles.subtitle}>Select everything you're interested in exploring on campus.</Text>
        </View>

        <View style={styles.goalList}>
          {GOALS.map((goal) => {
            const isSelected = profileData.goals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, isSelected && styles.goalCardActive]}
                onPress={() => toggleGoal(goal.id)}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalLabel, isSelected && styles.goalLabelActive]}>{goal.label}</Text>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.buttonShell, profileData.goals.length === 0 && styles.buttonDisabled]} 
          onPress={handleNext}
        >
          <LinearGradient colors={[...theme.gradients.accent]} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
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
  goalList: {
    gap: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 20,
    ...shadows.card,
  },
  goalCardActive: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceAlt,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  goalLabelActive: {
    color: theme.colors.textPrimary,
  },
  goalDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxActive: {
    borderColor: theme.colors.borderStrong,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accentTertiary,
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
