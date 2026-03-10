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
import { useLocalSearchParams, Stack } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { fetchBuilding, fetchBuildingOpportunities, BuildingDetail, Opportunity, setOpportunityInterest } from '@/lib/api';

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

export default function BuildingDetailScreen() {
  const { id, name, short_name } = useLocalSearchParams<{ id: string; name: string; short_name: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<TabType>("Overview");
  const [interestedMap, setInterestedMap] = React.useState<Record<string, boolean>>({});
  const [opportunitySkills, setOpportunitySkills] = React.useState<Record<string, string[]>>({});

  const [building, setBuilding] = React.useState<BuildingDetail | null>(null);
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOpportunities = React.useMemo(() => {
    const targetType = TAB_MAPPING[activeTab];
    if (targetType === "overview") return [];
    return opportunities.filter(opt => opt.type === targetType);
  }, [activeTab, opportunities]);

  const toggleInterest = (oppId: string) => {
    if (!user) return;

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
    setOpportunityInterest({
      opportunityId: oppId,
      interested: nextValue,
      clerkUserId: user.id,
    }).then((response) => {
      if (response.interested && Array.isArray(response.skills)) {
        setOpportunitySkills(prev => ({
          ...prev,
          [oppId]: response.skills,
        }));
      }
    }).catch((err) => {
      console.error('[interest] API error:', err);
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
          {item.tags.map(tag => (
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
              {building.departments.map(dept => (
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
        <ActivityIndicator size="large" color="#3b82f6" />
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

      {activeTab === "Overview" ? (
        renderOverview()
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  header: {
    padding: 24,
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});
