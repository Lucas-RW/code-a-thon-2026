import * as React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchBuildings, BuildingSummary } from '@/lib/api';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { shadows, theme } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [buildings, setBuildings] = React.useState<BuildingSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadBuildings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBuildings();
      setBuildings(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadBuildings();
  }, []);

  const renderItem = ({ item }: { item: BuildingSummary }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: "/building/[id]",
        params: { 
          id: item.id,
          name: item.name,
          short_name: item.short_name || ''
        }
      })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
      </View>
      {item.short_name && <Text style={styles.shortName}>{item.short_name}</Text>}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading && buildings.length === 0) {
    return <LoadingState message="Loading campus..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Discovery</Text>
        <Text style={styles.subtitle}>Explore buildings and opportunities</Text>
      </View>
      
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.emptyText}>No buildings found.</Text> : null
        }
        onRefresh={loadBuildings}
        refreshing={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: theme.colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  shortName: {
    fontSize: 14,
    color: theme.colors.accentTertiary,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
