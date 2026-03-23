import * as React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  fetchBuildings,
  fetchBuildingOpportunities,
  fetchInterestedOpportunities,
  Opportunity,
  setOpportunityInterest,
} from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { shadows, theme } from '@/lib/theme';

const FILTER_PERSIST_KEY = 'campuslens_selected_opportunity_filter';

type OpportunityFilter = 'all' | 'interested' | 'work' | 'research' | 'social';

type OpportunityWithBuilding = Opportunity & {
  building_name: string;
  building_short_name?: string;
};

const FILTER_OPTIONS: { id: OpportunityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'interested', label: 'Interested' },
  { id: 'work', label: 'Work' },
  { id: 'research', label: 'Research' },
  { id: 'social', label: 'Social' },
];

const FILTER_MICROCOPY: Record<Exclude<OpportunityFilter, 'all'>, string> = {
  interested: 'Only the opportunities you have saved.',
  work: 'Career-building and general opportunities, with saved items first.',
  research: 'Research opportunities, with saved items first.',
  social: 'Events and social opportunities, with saved items first.',
};

export default function MyOpportunitiesScreen() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ opportunityId?: string }>();
  const targetOpportunityId = Array.isArray(params.opportunityId) ? params.opportunityId[0] : params.opportunityId;

  const [opportunities, setOpportunities] = React.useState<OpportunityWithBuilding[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<OpportunityFilter>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [interestedMap, setInterestedMap] = React.useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = React.useState<Record<string, boolean>>({});
  const [pinnedOpportunityId, setPinnedOpportunityId] = React.useState<string | null>(null);
  const consumedTargetOpportunityId = React.useRef<string | null>(null);

  React.useEffect(() => {
    getItem(FILTER_PERSIST_KEY).then((val) => {
      if (val) setSelectedFilter(val as OpportunityFilter);
    });
  }, []);

  const handleFilterChange = (filter: OpportunityFilter) => {
    setSelectedFilter(filter);
    setItem(FILTER_PERSIST_KEY, filter);
    if (filter !== 'all') {
      setPinnedOpportunityId(null);
    }
  };

  const loadOpportunities = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      setError(null);

      const [buildings, interested] = await Promise.all([
        fetchBuildings(),
        fetchInterestedOpportunities(),
      ]);

      const allOpportunityGroups = await Promise.all(
        buildings.map(async (building) => {
          const buildingOpportunities = await fetchBuildingOpportunities(building.id);
          return buildingOpportunities.map((opportunity) => ({
            ...opportunity,
            building_name: building.name,
            building_short_name: building.short_name,
          }));
        })
      );

      const allOpportunities = allOpportunityGroups.flat();
      const interestedIds = new Set(interested.map((item) => item.id));

      setOpportunities(allOpportunities);
      setInterestedMap(
        allOpportunities.reduce<Record<string, boolean>>((acc, opportunity) => {
          acc[opportunity.id] = interestedIds.has(opportunity.id);
          return acc;
        }, {})
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load opportunities';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, showToast]);

  useFocusEffect(
    React.useCallback(() => {
      loadOpportunities();
    }, [loadOpportunities])
  );

  const toggleInterested = async (id: string) => {
    const previous = !!interestedMap[id];
    const next = !previous;
    setInterestedMap((current) => ({ ...current, [id]: next }));
    if (!next && pinnedOpportunityId === id) {
      setPinnedOpportunityId(null);
    }

    try {
      await setOpportunityInterest(id, next);
      showToast(next ? 'Added to interests.' : 'Removed from interests.', next ? 'success' : 'info');
    } catch (err) {
      setInterestedMap((current) => ({ ...current, [id]: previous }));
      if (!next && pinnedOpportunityId === id) {
        setPinnedOpportunityId(id);
      }
      const msg = err instanceof Error ? err.message : 'Failed to update interest';
      showToast(msg, 'error');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedMap((current) => ({ ...current, [id]: !current[id] }));
  };

  React.useEffect(() => {
    if (!targetOpportunityId) return;
    if (consumedTargetOpportunityId.current === targetOpportunityId) return;

    setSelectedFilter('all');
    setExpandedMap((current) => ({ ...current, [targetOpportunityId]: true }));
    setPinnedOpportunityId(targetOpportunityId);
    consumedTargetOpportunityId.current = targetOpportunityId;
  }, [targetOpportunityId]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setPinnedOpportunityId(null);
      };
    }, [])
  );

  const sortWithInterestedFirst = React.useCallback(
    (items: OpportunityWithBuilding[]) =>
      [...items].sort((a, b) => {
        if (pinnedOpportunityId) {
          if (a.id === pinnedOpportunityId) return -1;
          if (b.id === pinnedOpportunityId) return 1;
        }
        const aInterested = interestedMap[a.id] ? 1 : 0;
        const bInterested = interestedMap[b.id] ? 1 : 0;
        if (aInterested !== bInterested) return bInterested - aInterested;
        return a.title.localeCompare(b.title);
      }),
    [interestedMap, pinnedOpportunityId]
  );

  const filteredOpportunities = React.useMemo(() => {
    if (selectedFilter === 'all') {
      return sortWithInterestedFirst(opportunities);
    }

    if (selectedFilter === 'interested') {
      return sortWithInterestedFirst(opportunities.filter((opp) => interestedMap[opp.id]));
    }

    const filtered = opportunities.filter((opp) => {
      if (selectedFilter === 'work') {
        return opp.type === 'job' || opp.type === 'course' || opp.type === 'student_org';
      }

      if (selectedFilter === 'research') {
        return opp.type === 'research';
      }

      if (selectedFilter === 'social') {
        return opp.type === 'event';
      }

      return true;
    });

    return sortWithInterestedFirst(filtered);
  }, [interestedMap, opportunities, selectedFilter, sortWithInterestedFirst]);

  const renderOpportunityCard = (item: OpportunityWithBuilding) => {
    const isInterested = !!interestedMap[item.id];
    const isExpanded = !!expandedMap[item.id];

    return (
      <View key={item.id} style={styles.sectionCard}>
        <View style={styles.expandableHeader}>
          <View style={styles.expandableCopy}>
            <View style={styles.topMetaRow}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{item.type}</Text>
              </View>
              <Text style={styles.buildingMeta}>
                {item.building_name}
                {item.building_short_name ? ` (${item.building_short_name})` : ''}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.summary || item.description || 'Building-linked opportunity'}</Text>
          </View>
          <View style={styles.rowActions}>
            <Pressable onPress={() => toggleInterested(item.id)} style={styles.iconAction}>
              <Ionicons
                name={isInterested ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isInterested ? theme.colors.accentTertiary : theme.colors.textSecondary}
              />
            </Pressable>
            <Pressable onPress={() => toggleExpanded(item.id)} style={styles.iconAction}>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {isExpanded ? (
          <View style={styles.expandedBlock}>
            <Text style={styles.sectionBody}>{item.description || 'Additional details coming soon.'}</Text>
            {item.hosted_by ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hosted by</Text>
                <Text style={styles.detailValue}>{item.hosted_by}</Text>
              </View>
            ) : null}
            {item.location_detail ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{item.location_detail}</Text>
              </View>
            ) : null}
            {item.department ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department</Text>
                <Text style={styles.detailValue}>{item.department}</Text>
              </View>
            ) : null}
            {item.hourly_commitment ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.type === 'event' ? 'Time' : 'Hourly commitment'}</Text>
                <Text style={styles.detailValue}>{item.hourly_commitment}</Text>
              </View>
            ) : null}
            {item.terms_available ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Terms available</Text>
                <Text style={styles.detailValue}>{item.terms_available}</Text>
              </View>
            ) : null}
            {item.student_level ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Student level</Text>
                <Text style={styles.detailValue}>{item.student_level}</Text>
              </View>
            ) : null}
            {item.credit ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Credit</Text>
                <Text style={styles.detailValue}>{item.credit}</Text>
              </View>
            ) : null}
            {item.pay ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Potential pay</Text>
                <Text style={styles.detailValue}>{item.pay}</Text>
              </View>
            ) : null}
            {item.stipend ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stipend</Text>
                <Text style={styles.detailValue}>{item.stipend}</Text>
              </View>
            ) : null}
            {item.deadline ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.type === 'event' ? 'Date' : 'Application deadline'}</Text>
                <Text style={styles.detailValue}>{item.deadline}</Text>
              </View>
            ) : null}
            {item.professor ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Professor associated</Text>
                <Text style={styles.detailValue}>{item.professor}</Text>
              </View>
            ) : null}
            {item.contact ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValue}>{item.contact}</Text>
              </View>
            ) : null}
            {item.phd_student_mentors ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ph.D. mentor(s)</Text>
                <Text style={styles.detailValue}>{item.phd_student_mentors}</Text>
              </View>
            ) : null}
            {item.prerequisites ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prerequisites</Text>
                <Text style={styles.detailValue}>{item.prerequisites}</Text>
              </View>
            ) : null}
            {item.application_requirements ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Application requirements</Text>
                <Text style={styles.detailValue}>{item.application_requirements}</Text>
              </View>
            ) : null}
            {item.next_steps ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next steps</Text>
                <Text style={styles.detailValue}>{item.next_steps}</Text>
              </View>
            ) : null}
            {item.url ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Website</Text>
                <Text style={styles.linkValue}>{item.url}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading && opportunities.length === 0) {
    return <LoadingState message="Loading opportunities..." />;
  }

  if (error && opportunities.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadOpportunities}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const interestedCount = Object.values(interestedMap).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>My Opportunities</Text>
            <Text style={styles.subtitle}>
              {selectedFilter === 'all'
                ? `${opportunities.length} total opportunities across buildings`
                : `${interestedCount} marked as interested`}
            </Text>
          </View>
        </View>

        <View style={styles.goalSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalSelector}>
            {FILTER_OPTIONS.map((filter) => (
              <Pressable
                key={filter.id}
                style={[styles.goalChip, selectedFilter === filter.id && styles.activeGoalChip]}
                onPress={() => handleFilterChange(filter.id)}
              >
                <Text style={[styles.goalChipText, selectedFilter === filter.id && styles.activeGoalChipText]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedFilter !== 'all' ? <Text style={styles.goalMicrocopy}>{FILTER_MICROCOPY[selectedFilter]}</Text> : null}
        </View>

        <View style={styles.listContent}>
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((item) => renderOpportunityCard(item))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No opportunities match this filter yet.</Text>
            </View>
          )}
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
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, maxWidth: 280 },
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
  listContent: { paddingTop: 16, paddingBottom: 20 },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 14,
    ...shadows.card,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  expandableCopy: {
    flex: 1,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typePill: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.colors.accentWash,
  },
  typePillText: {
    color: theme.colors.accentTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  buildingMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  expandedBlock: {
    marginTop: 16,
    gap: 10,
  },
  sectionBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  linkValue: {
    color: theme.colors.accentTertiary,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: { color: theme.colors.error, fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.accentSecondary,
    borderRadius: 8,
  },
  retryButtonText: { color: '#ffffff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
