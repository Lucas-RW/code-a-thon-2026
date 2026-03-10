import * as React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchInterestedOpportunities, InterestedOpportunity } from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function MyOpportunitiesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [opportunities, setOpportunities] = React.useState<InterestedOpportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadOpportunities = React.useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchInterestedOpportunities(user.id);
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
          <MaterialIcons name="business" size={16} color="#94a3b8" />
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
            {item.tags.map(tag => (
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
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
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

      <FlatList
        data={opportunities}
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, backgroundColor: '#1e293b', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#94a3b8' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9', flex: 1, marginRight: 8 },
  badgeContainer: { backgroundColor: '#3b82f620', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f650', alignSelf: 'flex-start' },
  badgeText: { color: '#60a5fa', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  buildingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  buildingName: { fontSize: 14, color: '#94a3b8', marginLeft: 6, fontWeight: '500' },
  cardDescription: { fontSize: 14, color: '#cbd5e1', lineHeight: 20, marginBottom: 16 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  tagText: { color: '#e2e8f0', fontSize: 12, fontWeight: '500' },
  viewBuildingButton: { borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 'auto' },
  viewBuildingText: { color: '#3b82f6', fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#3b82f6', borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: '#64748b', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
