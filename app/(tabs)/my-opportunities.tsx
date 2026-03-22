import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchInterestedOpportunities, InterestedOpportunity } from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { shadows, theme } from '@/lib/theme';

const FILTER_PERSIST_KEY = 'campuslens_selected_opportunity_filter';

type OpportunityFilter = 'all' | 'interested' | 'work' | 'research' | 'social';

const FILTER_OPTIONS: { id: OpportunityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'interested', label: 'Interested' },
  { id: 'work', label: 'Work' },
  { id: 'research', label: 'Research' },
  { id: 'social', label: 'Social' },
];

const FILTER_MICROCOPY: Record<Exclude<OpportunityFilter, 'all'>, string> = {
  interested: 'Everything you have marked to revisit.',
  work: 'Roles, courses, and career-building opportunities.',
  research: 'Research-focused labs, projects, and faculty pathways.',
  social: 'Community, student life, and support-oriented opportunities.',
};

export default function MyOpportunitiesScreen() {
  const { accessToken, userProfile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = React.useState<InterestedOpportunity[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<OpportunityFilter>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = React.useState(false);

  React.useEffect(() => {
    getItem(FILTER_PERSIST_KEY).then((val) => {
      if (val) setSelectedFilter(val as OpportunityFilter);
    });
  }, []);

  const handleFilterChange = (filter: OpportunityFilter) => {
    setSelectedFilter(filter);
    setItem(FILTER_PERSIST_KEY, filter);
  };

  const loadOpportunities = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchInterestedOpportunities();
      setOpportunities(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load opportunities';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, showToast]);

  const filteredOpportunities = React.useMemo(() => {
    if (selectedFilter === 'all' || selectedFilter === 'interested') {
      setIsFallbackMode(false);
      return opportunities;
    }

    const filtered = opportunities.filter((opp) => {
      if (selectedFilter === 'work') {
        return (
          opp.type === 'job' ||
          opp.type === 'course' ||
          opp.goal_tags?.includes('career') ||
          opp.goal_tags?.includes('academic_aid')
        );
      }

      if (selectedFilter === 'research') {
        return opp.type === 'research' || opp.goal_tags?.includes('research');
      }

      if (selectedFilter === 'social') {
        return (
          opp.type === 'student_org' ||
          opp.type === 'event' ||
          opp.goal_tags?.includes('social_support')
        );
      }

      return true;
    });

    if (filtered.length === 0 && opportunities.length > 0) {
      setIsFallbackMode(true);
      return opportunities;
    }

    setIsFallbackMode(false);
    return filtered;
  }, [opportunities, selectedFilter]);

  useFocusEffect(
    React.useCallback(() => {
      loadOpportunities();
    }, [loadOpportunities])
  );

  const renderOpportunityCard = (item: InterestedOpportunity) => {
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.buildingRow}>
          <MaterialIcons name="business" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.buildingName}>
            {item.building_name} {item.building_short_name ? `(${item.building_short_name})` : ''}
          </Text>
        </View>

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagContainer}>
            {item.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.viewBuildingButton}
          onPress={() =>
            router.push({
              pathname: '/building/[id]',
              params: {
                id: item.building_id,
                name: item.building_name,
                short_name: item.building_short_name || '',
              },
            })
          }
        >
          <Text style={styles.viewBuildingText}>View in building</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && opportunities.length === 0) {
    return <LoadingState message="Loading your opportunities..." />;
  }

  if (error && opportunities.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOpportunities}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>My Opportunities</Text>
            <Text style={styles.subtitle}>{opportunities.length} marked as interested</Text>
          </View>
        </View>

        <View style={styles.goalSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalSelector}>
            {FILTER_OPTIONS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.goalChip, selectedFilter === filter.id && styles.activeGoalChip]}
                onPress={() => handleFilterChange(filter.id)}
              >
                <Text style={[styles.goalChipText, selectedFilter === filter.id && styles.activeGoalChipText]}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedFilter !== 'all' ? <Text style={styles.goalMicrocopy}>{FILTER_MICROCOPY[selectedFilter]}</Text> : null}
        </View>

        {isFallbackMode ? (
          <View style={styles.fallbackNote}>
            <MaterialIcons name="info-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.fallbackNoteText}>
              No items tagged for this goal yet. Showing all interests instead.
            </Text>
          </View>
        ) : null}

        <View style={styles.listContent}>
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((item) => renderOpportunityCard(item))
          ) : !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No opportunities yet - go explore buildings!</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.backgroundPrimary },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, maxWidth: 260 },
  listContent: { paddingTop: 16, paddingBottom: 20 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  badgeContainer: {
    backgroundColor: theme.colors.accentWash,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.accentLine,
    alignSelf: 'flex-start',
  },
  badgeText: { color: theme.colors.info, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  buildingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  buildingName: { fontSize: 14, color: theme.colors.textSecondary, marginLeft: 6, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' },
  viewBuildingButton: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 'auto',
    backgroundColor: theme.colors.accentWash,
  },
  viewBuildingText: { color: theme.colors.accentTertiary, fontWeight: '600' },
  errorText: { color: theme.colors.error, fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.accentSecondary, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  goalSelectorContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  goalSelector: {
    paddingHorizontal: 16,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeGoalChip: {
    backgroundColor: theme.colors.accentWash,
    borderColor: theme.colors.borderStrong,
  },
  goalChipText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeGoalChipText: {
    color: theme.colors.accentTertiary,
  },
  goalMicrocopy: {
    fontSize: 12,
    color: theme.colors.textMuted,
    paddingHorizontal: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
  fallbackNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fallbackNoteText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
  },
});
