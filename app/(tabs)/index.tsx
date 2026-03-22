import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { fetchBuildings, fetchInterestedOpportunities, BuildingSummary, InterestedOpportunity, GoalType } from '@/lib/api';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { shadows, theme } from '@/lib/theme';
import BuildingARDetailSheet from '@/src/arOverlay/BuildingARDetailSheet';
import type { ARBuilding } from '@/src/arOverlay/types';

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  buildingId: string;
  buildingShortName?: string;
};

type ActivityItem = {
  id: string;
  label: string;
  meta: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

function getInitials(label: string) {
  return label
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatGoalLabel(goal: GoalType) {
  return goal.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function toARBuilding(building: BuildingSummary, opportunityCount: number): ARBuilding {
  const departments = building.departments ?? [];
  const lowered = departments.map((department) => department.toLowerCase());

  const buildingType = lowered.some((department) =>
    ['student', 'community', 'campus', 'organization'].some((keyword) => department.includes(keyword))
  )
    ? 'student_life'
    : lowered.some((department) =>
        ['physics', 'science', 'astronomy', 'biology', 'chemistry', 'research'].some((keyword) => department.includes(keyword))
      )
      ? 'science'
      : 'engineering';

  return {
    id: building.id,
    name: building.name,
    lat: building.lat,
    lng: building.lng,
    screenX: 0.5,
    screenY: 0.5,
    distanceMeters: 0,
    opportunityCount,
    buildingType,
    inView: true,
    description: building.description,
    image_url: building.image_url,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const [buildings, setBuildings] = React.useState<BuildingSummary[]>([]);
  const [interests, setInterests] = React.useState<InterestedOpportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBuilding, setSelectedBuilding] = React.useState<ARBuilding | null>(null);

  const loadHome = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [buildingData, interestData] = await Promise.all([
        fetchBuildings(),
        fetchInterestedOpportunities().catch(() => [] as InterestedOpportunity[]),
      ]);
      setBuildings(buildingData);
      setInterests(interestData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadHome();
  }, [loadHome]);

  const buildingLookup = React.useMemo(
    () => new Map(buildings.map((building) => [building.id, building])),
    [buildings]
  );

  const personalizedBuildings = React.useMemo(() => {
    const rankedIds = interests.map((item) => item.building_id);
    const uniqueRanked = Array.from(new Set(rankedIds));
    const prioritized = uniqueRanked
      .map((id) => buildingLookup.get(id))
      .filter((item): item is BuildingSummary => Boolean(item));

    const fallback = buildings.filter((building) => !uniqueRanked.includes(building.id));
    return [...prioritized, ...fallback].slice(0, 8);
  }, [buildingLookup, buildings, interests]);

  const featuredOpportunity = interests[0] ?? null;
  const opportunityCountByBuilding = React.useMemo(() => {
    const counts = new Map<string, number>();
    interests.forEach((item) => {
      counts.set(item.building_id, (counts.get(item.building_id) ?? 0) + 1);
    });
    return counts;
  }, [interests]);

  const recentActivity = React.useMemo<ActivityItem[]>(() => {
    const timeline: ActivityItem[] = [];

    if (userProfile?.major) {
      timeline.push({
        id: 'major',
        label: `Set your academic path around ${userProfile.major}`,
        meta: userProfile.year ? `${userProfile.year}` : 'Profile milestone',
        icon: 'school',
      });
    }

    (userProfile?.goals ?? []).slice(0, 2).forEach((goal) => {
      timeline.push({
        id: `goal-${goal}`,
        label: `Focused your journey on ${formatGoalLabel(goal)}`,
        meta: 'Goal preference updated',
        icon: 'track-changes',
      });
    });

    interests.slice(0, 3).forEach((item) => {
      timeline.push({
        id: item.id,
        label: `Marked ${item.title} as interested`,
        meta: item.building_name,
        icon: 'bookmark-border',
      });
    });

    if (timeline.length > 0) {
      return timeline.slice(0, 5);
    }

    return [
      {
        id: 'empty-activity',
        label: 'Explore buildings to start shaping your path',
        meta: 'Recent movement will appear here',
        icon: 'auto-awesome',
      },
    ];
  }, [interests, userProfile]);

  const feedItems = React.useMemo<FeedItem[]>(() => {
    const items = interests.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle:
        item.type === 'research'
          ? 'A professor in your orbit has a research opening.'
          : item.type === 'event'
            ? 'A campus event connected to your interests is coming up.'
            : 'A new opportunity matches the direction of your graph.',
      meta: item.building_name,
      buildingId: item.building_id,
      buildingShortName: item.building_short_name,
    }));

    if (items.length > 0) {
      return items;
    }

    return buildings.slice(0, 3).map((building, index) => ({
      id: building.id,
      title: `${building.name} has new pathways to explore`,
      subtitle: 'Jump back into a relevant location and see what opportunities are nearby.',
      meta: index === 0 ? 'Suggested next move' : 'Recommended building',
      buildingId: building.id,
      buildingShortName: building.short_name,
    }));
  }, [buildings, interests]);

  const openBuilding = (building: BuildingSummary | { id: string; name?: string; short_name?: string }) => {
    router.push({
      pathname: '/building/[id]',
      params: {
        id: building.id,
        name: building.name ?? 'Building',
        short_name: building.short_name || '',
      },
    });
  };

  if (isLoading && buildings.length === 0) {
    return <LoadingState message="Loading your command center..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => undefined}
        refreshControl={undefined}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>CampusLens</Text>
            <Text style={styles.greeting}>
              {userProfile?.name ? `What should we unlock next, ${userProfile.name.split(' ')[0]}?` : 'Your personalized campus command center'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => showToast('Notifications coming soon', 'info')}>
            <MaterialIcons name="notifications-none" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your Buildings</Text>
          <Text style={styles.sectionHint}>Quick return points</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buildingRail}>
          {personalizedBuildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={styles.buildingPill}
              onPress={() => setSelectedBuilding(toARBuilding(building, opportunityCountByBuilding.get(building.id) ?? 0))}
            >
              {building.image_url ? (
                <View style={styles.buildingAvatarFrame}>
                  <Image source={{ uri: building.image_url }} style={styles.buildingAvatarImage} />
                </View>
              ) : (
                <LinearGradient colors={[...theme.gradients.panelGlow]} style={styles.buildingAvatar}>
                  <Text style={styles.buildingAvatarText}>{getInitials(building.short_name || building.name)}</Text>
                </LinearGradient>
              )}
              <Text style={styles.buildingLabel} numberOfLines={1}>
                {building.short_name || building.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          <Text style={styles.sectionHint}>Your momentum</Text>
        </View>
        <View style={styles.activityHistoryCard}>
          {recentActivity.map((item, index) => (
            <View key={item.id} style={[styles.timelineRow, index === recentActivity.length - 1 && styles.timelineRowLast]}>
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

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Opportunity</Text>
          <Text style={styles.sectionHint}>Best next move</Text>
        </View>
        <LinearGradient colors={[...theme.gradients.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              {featuredOpportunity?.type?.replace('_', ' ').toUpperCase() || 'EXPLORE'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {featuredOpportunity?.title || 'Discover a building that can move your path forward'}
          </Text>
          <Text style={styles.heroDescription}>
            {featuredOpportunity?.description ||
              'Start with a high-signal campus location, then branch into relevant opportunities from there.'}
          </Text>
          <View style={styles.heroMetaRow}>
            <MaterialIcons name="place" size={16} color={theme.colors.textOnAccent} />
            <Text style={styles.heroMetaText}>
              {featuredOpportunity?.building_name || personalizedBuildings[0]?.name || 'Campus-wide'}
            </Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimaryButton}
              onPress={() =>
                featuredOpportunity
                  ? openBuilding({
                      id: featuredOpportunity.building_id,
                      name: featuredOpportunity.building_name,
                      short_name: featuredOpportunity.building_short_name,
                    })
                  : personalizedBuildings[0] && openBuilding(personalizedBuildings[0])
              }
            >
              <Text style={styles.heroPrimaryText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroSecondaryButton} onPress={() => router.push('/my-opportunities')}>
              <Text style={styles.heroSecondaryText}>Interested</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>From Your Network</Text>
          <Text style={styles.sectionHint}>Graph-based updates</Text>
        </View>
        {feedItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.feedCard}
            onPress={() =>
              openBuilding({
                id: item.buildingId,
                name: item.meta,
                short_name: item.buildingShortName,
              })
            }
          >
            <View style={styles.feedIcon}>
              <MaterialIcons name="hub" size={18} color={theme.colors.accentTertiary} />
            </View>
            <View style={styles.feedBody}>
              <Text style={styles.feedTitle}>{item.title}</Text>
              <Text style={styles.feedSubtitle}>{item.subtitle}</Text>
              <Text style={styles.feedMeta}>{item.meta}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                const b = buildings.find(b => b.id === item.buildingId);
                if (b) setSelectedBuilding(toARBuilding(b, opportunityCountByBuilding.get(b.id) ?? 0));
              }}
              style={styles.voyagerTrigger}
            >
              <MaterialIcons name="auto-fix-high" size={20} color={theme.colors.accentTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedBuilding && (
        <BuildingARDetailSheet
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  brand: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    maxWidth: 250,
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
  sectionHeaderRow: {
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buildingRail: {
    paddingBottom: 10,
    gap: 14,
    marginBottom: 28,
  },
  buildingPill: {
    width: 82,
    alignItems: 'center',
  },
  buildingAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.whiteSoft,
    marginBottom: 10,
  },
  buildingAvatarFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.whiteSoft,
    backgroundColor: theme.colors.surfaceMuted,
  },
  buildingAvatarImage: {
    width: '100%',
    height: '100%',
  },
  buildingAvatarText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  buildingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityHistoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 28,
    ...shadows.card,
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
  heroCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 28,
    ...shadows.glow,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: theme.colors.textOnAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: theme.colors.textOnAccent,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    marginBottom: 10,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  heroMetaText: {
    color: theme.colors.textOnAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPrimaryButton: {
    backgroundColor: theme.colors.textOnAccent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroPrimaryText: {
    color: theme.colors.backgroundPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  heroSecondaryButton: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroSecondaryText: {
    color: theme.colors.textOnAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 14,
    ...shadows.card,
  },
  feedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  feedBody: {
    flex: 1,
    paddingRight: 8,
  },
  feedTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  feedSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  feedMeta: {
    color: theme.colors.accentTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  voyagerTrigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
