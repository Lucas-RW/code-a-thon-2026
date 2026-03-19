import * as React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchInterestedOpportunities, InterestedOpportunity, GoalType, GOAL_OPTIONS } from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { shadows, theme } from '@/lib/theme';

const GOAL_PERSIST_KEY = 'campuslens_selected_goal';

const GOAL_MICROCOPY: Record<GoalType, string> = {
  career: "Focus on opportunities that build career capital.",
  research: "Highlight opportunities that move you toward research.",
  academic_aid: "Surface options to strengthen your coursework.",
  social_support: "Lift up spaces for community and support."
};

export default function MyOpportunitiesScreen() {
  const { accessToken, userProfile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const initialGoal = (userProfile?.goals && userProfile.goals.length > 0) ? userProfile.goals[0] : "all";
  const [opportunities, setOpportunities] = React.useState<InterestedOpportunity[]>([]);
  const [selectedGoal, setSelectedGoal] = React.useState<GoalType | "all">(initialGoal);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = React.useState(false);

  // Load persistent goal
  React.useEffect(() => {
    getItem(GOAL_PERSIST_KEY).then(val => {
      if (val) setSelectedGoal(val as GoalType | "all");
    });
  }, []);

  const handleGoalChange = (goal: GoalType | "all") => {
    setSelectedGoal(goal);
    setItem(GOAL_PERSIST_KEY, goal);
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
  }, [accessToken]);

  const filteredOpportunities = React.useMemo(() => {
    if (selectedGoal === "all") {
      setIsFallbackMode(false);
      return opportunities;
    }

    const filtered = opportunities.filter(opp => 
      opp.goal_tags && opp.goal_tags.includes(selectedGoal)
    );

    // Fallback logic
    if (filtered.length === 0 && opportunities.length > 0) {
      setIsFallbackMode(true);
      return opportunities;
    }

    setIsFallbackMode(false);
    return filtered;
  }, [opportunities, selectedGoal]);

  useFocusEffect(
    React.useCallback(() => {
      loadOpportunities();
    }, [loadOpportunities])
  );

  const renderOpportunityCard = ({ item }: { item: InterestedOpportunity }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
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

        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {item.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.viewBuildingButton}
          onPress={() => router.push({ 
            pathname: '/building/[id]', 
            params: { 
              id: item.building_id, 
              name: item.building_name, 
              short_name: item.building_short_name || '' 
            } 
          })}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Opportunities</Text>
        <Text style={styles.subtitle}>{opportunities.length} marked as interested</Text>
      </View>

      <View style={styles.goalSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalSelector}>
          <TouchableOpacity 
            style={[styles.goalChip, selectedGoal === "all" && styles.activeGoalChip]}
            onPress={() => handleGoalChange("all")}
          >
            <Text style={[styles.goalChipText, selectedGoal === "all" && styles.activeGoalChipText]}>All Goals</Text>
          </TouchableOpacity>
          {GOAL_OPTIONS.map((goal) => (
            <TouchableOpacity 
              key={goal.id} 
              style={[styles.goalChip, selectedGoal === goal.id && styles.activeGoalChip]}
              onPress={() => handleGoalChange(goal.id)}
            >
              <Text style={[styles.goalChipText, selectedGoal === goal.id && styles.activeGoalChipText]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedGoal !== "all" && (
          <Text style={styles.goalMicrocopy}>
            {GOAL_MICROCOPY[selectedGoal]}
          </Text>
        )}
      </View>

      {isFallbackMode && (
        <View style={styles.fallbackNote}>
          <MaterialIcons name="info-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.fallbackNoteText}>
            No items tagged for this goal yet. Showing all interests instead.
          </Text>
        </View>
      )}

      <FlatList
        data={filteredOpportunities}
        keyExtractor={(item) => item.id}
        renderItem={renderOpportunityCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No opportunities yet — go explore buildings!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.backgroundPrimary },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, backgroundColor: theme.colors.surfaceAlt, paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  badgeContainer: { backgroundColor: theme.colors.accentWash, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.accentLine, alignSelf: 'flex-start' },
  badgeText: { color: theme.colors.info, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  buildingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  buildingName: { fontSize: 14, color: theme.colors.textSecondary, marginLeft: 6, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: { backgroundColor: theme.colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: theme.colors.border },
  tagText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '500' },
  viewBuildingButton: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 'auto', backgroundColor: theme.colors.accentWash },
  viewBuildingText: { color: theme.colors.accentTertiary, fontWeight: '600' },
  errorText: { color: theme.colors.error, fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.accentSecondary, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: theme.colors.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  goalSelectorContainer: {
    backgroundColor: theme.colors.backgroundPrimary,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  goalSelector: {
    paddingHorizontal: 24,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
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
    paddingHorizontal: 24,
    marginTop: 6,
    fontStyle: 'italic',
  },
  fallbackNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginBottom: 0,
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
