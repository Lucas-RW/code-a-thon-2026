import * as React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchInterestedOpportunities, GoalType, InterestedOpportunity } from '@/lib/api';
import { getItem, setItem } from '@/lib/storage';
import { shadows, theme } from '@/lib/theme';

type OpportunityStatus = 'saved' | 'viewed' | 'applied';

type ActivityItem = {
  id: string;
  label: string;
  meta: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const STATUS_STORAGE_KEY = 'campuslens_profile_opportunity_statuses';
const STATUS_ORDER: OpportunityStatus[] = ['saved', 'viewed', 'applied'];

const GOAL_SKILL_MAP: Record<GoalType, string[]> = {
  career: ['Resume Building', 'Interview Prep', 'Networking'],
  research: ['Research Methods', 'Literature Review', 'Lab Collaboration'],
  academic_aid: ['Study Planning', 'Tutoring', 'Course Strategy'],
  social_support: ['Community Building', 'Leadership', 'Campus Involvement'],
};

const GOAL_INTEREST_MAP: Record<GoalType, string[]> = {
  career: ['Career Growth', 'Internships'],
  research: ['Faculty Research', 'Innovation'],
  academic_aid: ['Academic Support', 'Study Groups'],
  social_support: ['Student Life', 'Mentorship'],
};

function formatGoalLabel(goal: GoalType) {
  return goal.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatusLabel(status: OpportunityStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ProfileScreen() {
  const { userProfile, refreshProfile, logout, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [opportunities, setOpportunities] = React.useState<InterestedOpportunity[]>([]);
  const [statusMap, setStatusMap] = React.useState<Record<string, OpportunityStatus>>({});
  const [isDashboardLoading, setIsDashboardLoading] = React.useState(true);

  const loadStatuses = React.useCallback(async () => {
    try {
      const raw = await getItem(STATUS_STORAGE_KEY);
      if (!raw) {
        setStatusMap({});
        return;
      }

      setStatusMap(JSON.parse(raw) as Record<string, OpportunityStatus>);
    } catch {
      setStatusMap({});
    }
  }, []);

  const loadProfileDashboard = React.useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      await Promise.all([
        refreshProfile(),
        fetchInterestedOpportunities()
          .then(setOpportunities)
          .catch(() => setOpportunities([])),
        loadStatuses(),
      ]);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [loadStatuses, refreshProfile]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileDashboard();
    }, [loadProfileDashboard])
  );

  const cycleOpportunityStatus = React.useCallback(
    async (opportunityId: string, title: string) => {
      const currentStatus = statusMap[opportunityId] ?? 'saved';
      const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length];
      const nextMap = { ...statusMap, [opportunityId]: nextStatus };

      setStatusMap(nextMap);
      await setItem(STATUS_STORAGE_KEY, JSON.stringify(nextMap));
      showToast(`${title} marked as ${formatStatusLabel(nextStatus).toLowerCase()}.`, 'success');
    },
    [showToast, statusMap]
  );

  const derivedSkills = React.useMemo(() => {
    if (!userProfile) return [];

    const fromGoals = userProfile.goals.flatMap((goal) => GOAL_SKILL_MAP[goal] ?? []);
    const fromOpportunities = opportunities.flatMap((item) => item.tags ?? []);

    return Array.from(new Set([...fromGoals, ...fromOpportunities])).slice(0, 8);
  }, [opportunities, userProfile]);

  const derivedInterests = React.useMemo(() => {
    if (!userProfile) return [];

    const fromGoals = userProfile.goals.flatMap((goal) => GOAL_INTEREST_MAP[goal] ?? []);
    const fromOpportunities = opportunities.flatMap((item) => {
      const bucket = [item.type.replace('_', ' ')];
      if (item.building_short_name) {
        bucket.push(item.building_short_name);
      }
      return bucket;
    });

    return Array.from(new Set([...fromGoals, ...fromOpportunities]))
      .map((item) => item.replace(/\b\w/g, (char) => char.toUpperCase()))
      .slice(0, 8);
  }, [opportunities, userProfile]);

  const progressStats = React.useMemo(
    () => [
      {
        id: 'skills',
        label: 'Skills Tracked',
        value: String(derivedSkills.length),
        icon: 'auto-awesome' as const,
      },
      {
        id: 'explored',
        label: 'Opportunities Explored',
        value: String(opportunities.length),
        icon: 'trending-up' as const,
      },
      {
        id: 'interests',
        label: 'Active Interests',
        value: String(derivedInterests.length),
        icon: 'favorite-border' as const,
      },
    ],
    [derivedInterests.length, derivedSkills.length, opportunities.length]
  );

  const graphSize = derivedSkills.length + derivedInterests.length + opportunities.length;

  const activityHistory = React.useMemo<ActivityItem[]>(() => {
    if (!userProfile) return [];

    const timeline: ActivityItem[] = [];

    timeline.push({
      id: 'major',
      label: `Set your academic path around ${userProfile.major}`,
      meta: userProfile.year ? `Class of ${userProfile.year}` : 'Profile milestone',
      icon: 'school',
    });

    userProfile.goals.slice(0, 2).forEach((goal) => {
      timeline.push({
        id: `goal-${goal}`,
        label: `Focused your journey on ${formatGoalLabel(goal)}`,
        meta: 'Goal preference updated',
        icon: 'track-changes',
      });
    });

    opportunities.slice(0, 3).forEach((item) => {
      timeline.push({
        id: item.id,
        label: `Marked ${item.title} as interested`,
        meta: item.building_name,
        icon: 'bookmark-border',
      });
    });

    return timeline.slice(0, 5);
  }, [opportunities, userProfile]);

  if ((isLoading || isDashboardLoading) && !userProfile) {
    return <LoadingState message="Loading your growth dashboard..." />;
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.screenTitle}>Who am I becoming?</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/profile-builder/step1-basics')}>
            <MaterialIcons name="edit" size={18} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <LinearGradient colors={[...theme.gradients.panelGlow]} style={styles.headerShell}>
          <View style={styles.headerCard}>
            <LinearGradient colors={[...theme.gradients.accent]} style={styles.avatar}>
              <Text style={styles.avatarText}>{userProfile.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.headerCopy}>
              <Text style={styles.name}>{userProfile.name}</Text>
              <Text style={styles.metaText}>{userProfile.major || 'Major coming soon'}</Text>
              <Text style={styles.metaText}>
                {userProfile.year ? `Class of ${userProfile.year}` : 'Graduation year coming soon'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          <Text style={styles.sectionHint}>Current focus</Text>
        </View>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Top Skills</Text>
          <View style={styles.chipRow}>
            {derivedSkills.length > 0 ? (
              derivedSkills.map((skill) => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Your graph skills will appear here soon.</Text>
            )}
          </View>

          <Text style={[styles.sectionLabel, styles.subsectionSpacing]}>Interests</Text>
          <View style={styles.chipRow}>
            {derivedInterests.length > 0 ? (
              derivedInterests.map((interest) => (
                <View key={interest} style={styles.secondaryChip}>
                  <Text style={styles.secondaryChipText}>{interest}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Interests will sharpen as you explore more of campus.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress & Growth</Text>
          <Text style={styles.sectionHint}>Momentum</Text>
        </View>
        <View style={styles.statsRow}>
          {progressStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <MaterialIcons name={stat.icon} size={18} color={theme.colors.accentTertiary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.graphPreviewCard}>
          <View style={styles.graphPreviewHeader}>
            <Text style={styles.graphPreviewTitle}>Knowledge Graph Preview</Text>
            <Text style={styles.graphPreviewMeta}>{graphSize} total connections</Text>
          </View>
          <View style={styles.graphPlaceholder}>
              // Replace with actual graph visualization component in the future
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved & Interested Opportunities</Text>
        </View>
        <View style={styles.sectionCard}>
          {opportunities.length > 0 ? (
            opportunities.slice(0, 4).map((item) => {
              const status = statusMap[item.id] ?? 'saved';

              return (
                <View key={item.id} style={styles.opportunityCard}>
                  <View style={styles.opportunityHeader}>
                    <View style={styles.opportunityBody}>
                      <Text style={styles.opportunityTitle}>{item.title}</Text>
                      <Text style={styles.opportunityMeta}>{item.building_name}</Text>
                    </View>
                    <Pressable
                      style={styles.statusButton}
                      onPress={() => cycleOpportunityStatus(item.id, item.title)}
                    >
                      <Text style={styles.statusButtonText}>{formatStatusLabel(status)}</Text>
                    </Pressable>
                  </View>
                  {item.description ? (
                    <Text style={styles.opportunityDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>When you mark opportunities as interested, they will appear here.</Text>
          )}
          <Pressable style={styles.secondaryAction} onPress={() => router.push('/my-opportunities')}>
            <Text style={styles.secondaryActionText}>Open all saved opportunities</Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.colors.accentTertiary} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          <Text style={styles.sectionHint}>Recent movement</Text>
        </View>
        <View style={styles.sectionCard}>
          {activityHistory.map((item, index) => (
            <View key={item.id} style={[styles.timelineRow, index === activityHistory.length - 1 && styles.timelineRowLast]}>
              <View style={styles.timelineIcon}>
                <MaterialIcons name={item.icon} size={16} color={theme.colors.accentTertiary} />
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineLabel}>{item.label}</Text>
                <Text style={styles.timelineMeta}>{item.meta}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settings & Preferences</Text>
          <Text style={styles.sectionHint}>Control center</Text>
        </View>
        <View style={styles.sectionCard}>
          <Pressable style={styles.preferenceRow} onPress={() => router.push('/profile-builder/step1-basics')}>
            <Text style={styles.preferenceLabel}>Edit profile info</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable style={styles.preferenceRow} onPress={() => router.push('/profile-builder/step2-goals')}>
            <Text style={styles.preferenceLabel}>Manage goals</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable style={styles.preferenceRow} onPress={() => router.push('/profile-builder/step3-goal-details')}>
            <Text style={styles.preferenceLabel}>Update goal preferences</Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable style={[styles.preferenceRow, styles.preferenceRowLast]} onPress={logout}>
            <Text style={styles.signOutLabel}>Sign Out</Text>
            <MaterialIcons name="logout" size={18} color={theme.colors.error} />
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundPrimary,
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  screenTitle: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerShell: {
    borderRadius: 26,
    padding: 1,
    marginBottom: 28,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...shadows.glow,
  },
  avatarText: {
    color: theme.colors.textOnAccent,
    fontSize: 30,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionHint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 28,
    ...shadows.card,
  },
  sectionLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  subsectionSpacing: {
    marginTop: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentWash,
    borderWidth: 1,
    borderColor: theme.colors.accentLine,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...shadows.card,
  },
  statValue: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  graphPreviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 28,
    ...shadows.card,
  },
  graphPreviewHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  graphPreviewTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  graphPreviewMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  graphPlaceholder: {
    height: 124,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  graphPreviewCopy: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  opportunityCard: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  opportunityBody: {
    flex: 1,
  },
  opportunityTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  opportunityMeta: {
    color: theme.colors.accentTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  opportunityDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  statusButton: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.accentWash,
    borderWidth: 1,
    borderColor: theme.colors.accentLine,
  },
  statusButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  secondaryActionText: {
    color: theme.colors.accentTertiary,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timelineRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineBody: {
    flex: 1,
  },
  timelineLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  timelineMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  preferenceLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  signOutLabel: {
    color: theme.colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
