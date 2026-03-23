import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ScrollView 
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { getItem, setItem } from '@/lib/storage';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchBuilding, 
  fetchBuildingOpportunities, 
  setOpportunityInterest,
  GoalType,
  GOAL_OPTIONS,
  Opportunity
} from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { theme } from '@/lib/theme';

export interface BuildingDetail {
  id: string;
  name: string;
  short_name?: string;
  lat: number;
  lng: number;
  departments: string[];
  description?: string;
  image_url?: string;
}

// Opportunity interface is now imported from @/lib/api

type TabType = "Overview" | "Organizations" | "Research" | "Jobs" | "Professors" | "Events" | "Courses";
type OpportunityType = "student_org" | "research" | "job" | "course" | "event" | "professor";

const TAB_MAPPING: Record<TabType, OpportunityType | "overview"> = {
  "Overview": "overview",
  "Organizations": "student_org",
  "Research": "research",
  "Jobs": "job",
  "Professors": "professor",
  "Events": "event",
  "Courses": "course",
};

const GOAL_PERSIST_KEY = 'campuslens_selected_goal';

const GOAL_MICROCOPY: Record<GoalType, string> = {
  career: "Focus on opportunities that build career capital.",
  research: "Highlight opportunities that move you toward research.",
  academic_aid: "Surface options to strengthen your coursework.",
  social_support: "Lift up spaces for community and support."
};

export default function BuildingDetailScreen() {
  const { id, name, short_name } = useLocalSearchParams<{ id: string; name: string; short_name: string }>();
  const { accessToken, userProfile } = useAuth();
  const { showToast, showError } = useToast();
  const [activeTab, setActiveTab] = React.useState<TabType>("Overview");
  const [interestedMap, setInterestedMap] = React.useState<Record<string, boolean>>({});
  const [opportunitySkills, setOpportunitySkills] = React.useState<Record<string, string[]>>({});
  
  const initialGoal = (userProfile?.goals && userProfile.goals.length > 0) ? userProfile.goals[0] : "all";
  const [selectedGoal, setSelectedGoal] = React.useState<GoalType | "all">(initialGoal);
  const [building, setBuilding] = React.useState<BuildingDetail | null>(null);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
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

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [bldgData, oppsData] = await Promise.all([
        fetchBuilding(id),
        fetchBuildingOpportunities(id)
      ]);
      setBuilding(bldgData);
      setOpportunities(oppsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOpportunities = React.useMemo(() => {
    const targetType = TAB_MAPPING[activeTab];
    if (targetType === "overview") {
      setIsFallbackMode(false);
      return [];
    }
    
    const baseList = opportunities.filter(opt => opt.type === targetType);
    
    if (selectedGoal === "all") {
      setIsFallbackMode(false);
      return baseList;
    }

    const filtered = baseList.filter(opp => 
      opp.goal_tags && opp.goal_tags.includes(selectedGoal)
    );

    // Fallback logic
    if (filtered.length === 0 && baseList.length > 0) {
      setIsFallbackMode(true);
      return baseList;
    }

    setIsFallbackMode(false);
    return filtered;
  }, [activeTab, opportunities, selectedGoal]);

  const toggleInterest = (oppId: string) => {
    if (!accessToken) return;

    // Optimistic UI update.
    const nextValue = !interestedMap[oppId];
    setInterestedMap(prev => ({ ...prev, [oppId]: nextValue }));
    
    if (!nextValue) {
      setOpportunitySkills(prev => {
        const copy = { ...prev };
        delete copy[oppId];
        return copy;
      });
    }

    // Background API call — revert on failure.
    setOpportunityInterest(oppId, nextValue).then((response) => {
      if (response.interested && Array.isArray(response.skills)) {
        setOpportunitySkills(prev => ({
          ...prev,
          [oppId]: response.skills,
        }));
      }
    }).catch((err) => {
      console.error('[interest] API error:', err);
      showToast("Couldn't update interest status.", 'error');
      // Revert optimistic update.
      setInterestedMap(prev => ({ ...prev, [oppId]: !nextValue }));
    });
  };

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => {
    const isInterested = interestedMap[item.id] || false;
    const skills = opportunitySkills[item.id];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.professor && <Text style={styles.professorText}>{item.professor}</Text>}
        </View>
        
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.tagContainer}>
          {item.tags.map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {isInterested && skills && skills.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.skillsHeader}>Skills you’ll gain</Text>
            <View style={styles.skillPillContainer}>
              {skills.map(skill => (
                <View key={skill} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.interestedButton, isInterested && styles.interestedButtonActive]}
          onPress={() => toggleInterest(item.id)}
        >
          <Text style={[styles.interestedButtonText, isInterested && styles.interestedButtonTextActive]}>
            {isInterested ? "Interested" : "Mark Interested"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOverview = () => {
    const counts = opportunities.reduce((acc, opt) => {
      acc[opt.type] = (acc[opt.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <ScrollView contentContainerStyle={styles.overviewContainer}>
        <Text style={styles.overviewTitle}>About {building?.name || name}</Text>
        {building?.description ? (
          <Text style={styles.overviewDescription}>{building.description}</Text>
        ) : (
          <Text style={styles.overviewDescription}>No description available for this building.</Text>
        )}
        
        {building?.departments && building.departments.length > 0 && (
          <View style={styles.departmentsContainer}>
            <Text style={styles.sectionHeader}>Departments</Text>
            <View style={styles.tagContainer}>
              {building.departments.map((dept: string) => (
                <View key={dept} style={styles.tag}>
                  <Text style={styles.tagText}>{dept}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <Text style={styles.sectionHeader}>Available Opportunities</Text>
          <View style={styles.statsGrid}>
            {Object.entries(TAB_MAPPING).map(([label, type]) => {
              if (type === "overview") return null;
              const count = counts[type as OpportunityType] || 0;
              return (
                <View key={label} style={styles.statItem}>
                  <Text style={styles.statCount}>{count}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: short_name || 'Loading...', headerShown: true }} />
        <LoadingState message="Loading building details..." />
      </View>
    );
  }

  if (error || !building) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <Text style={styles.errorText}>{error || 'Building not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: building.short_name || short_name || 'Building Detail', headerShown: true }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>{building.name || name}</Text>
        {(building.short_name || short_name) && <Text style={styles.subtitle}>{building.short_name || short_name}</Text>}
      </View>

      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {(Object.keys(TAB_MAPPING) as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab !== "Overview" && (
        <View style={styles.goalSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalSelector}>
            <TouchableOpacity 
              style={[styles.goalChip, selectedGoal === "all" && styles.activeGoalChip]}
              onPress={() => handleGoalChange("all")}
            >
              <Text style={[styles.goalChipText, selectedGoal === "all" && styles.activeGoalChipText]}>All Opportunities</Text>
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
      )}

      {activeTab === "Overview" ? (
        renderOverview()
      ) : (
        <>
          {isFallbackMode && (
            <View style={styles.fallbackNote}>
              <MaterialIcons name="info-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.fallbackNoteText}>
                No items tagged for this goal yet. Showing all {activeTab.toLowerCase()} instead.
              </Text>
            </View>
          )}
          <FlatList
            data={filteredOpportunities}
            keyExtractor={(item) => item.id}
            renderItem={renderOpportunityCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found for this building.</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.accentSecondary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  header: {
    padding: 24,
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  activeTabButton: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  professorText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  skillsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  skillPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  skillPillText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  interestedButton: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  interestedButtonActive: {
    backgroundColor: '#3b82f6',
  },
  interestedButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  interestedButtonTextActive: {
    color: '#ffffff',
  },
  overviewContainer: {
    padding: 24,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  overviewDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 24,
  },
  departmentsContainer: {
    marginBottom: 24,
  },
  statsContainer: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  goalSelectorContainer: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  goalSelector: {
    paddingHorizontal: 16,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeGoalChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  goalChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  activeGoalChipText: {
    color: '#3b82f6',
  },
  goalMicrocopy: {
    fontSize: 12,
    color: '#64748b',
    paddingHorizontal: 20,
    marginTop: 6,
    fontStyle: 'italic',
  },
  fallbackNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    marginBottom: 0,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fallbackNoteText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 6,
  },
});
