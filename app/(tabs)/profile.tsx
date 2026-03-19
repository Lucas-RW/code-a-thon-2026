import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import LoadingState from '@/components/LoadingState';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, theme } from '@/lib/theme';

export default function ProfileScreen() {
  const { userProfile, refreshProfile, logout, isLoading } = useAuth();
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [])
  );

  if (isLoading && !userProfile) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!userProfile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No profile found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            onLongPress={() => router.push('/dev/ai-bootstrap' as any)}
            delayLongPress={2000}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[...theme.gradients.accent]} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userProfile.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.subtitle}>{userProfile.major} • {userProfile.year}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Goals</Text>
          <View style={styles.goalsContainer}>
            {userProfile.goals.map((goal, idx) => (
              <View key={idx} style={styles.goalChip}>
                <Text style={styles.goalChipText}>{goal.replace('_', ' ').toUpperCase()}</Text>
              </View>
            ))}
            {userProfile.goals.length === 0 && (
              <Text style={styles.emptyText}>No goals set yet</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userProfile.interested_opportunities?.length || 0}</Text>
              <Text style={styles.statLabel}>Interests</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Skills</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  scrollContent: {
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundPrimary,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    ...shadows.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    color: theme.colors.textOnAccent,
    fontSize: 42,
    fontWeight: '800',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalChipText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...shadows.card,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutButton: {
    marginTop: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.textPrimary,
  },
});
