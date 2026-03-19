import * as React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { fetchBuildings, BuildingSummary } from '@/lib/api';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/context/ToastContext';
import { shadows, theme } from '@/lib/theme';

export default function BuildingsScreen() {
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
      <Text style={styles.name}>{item.name}</Text>
      {item.short_name && <Text style={styles.shortName}>{item.short_name}</Text>}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingState message="Loading buildings..." />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBuildings}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Buildings', headerShown: true }} />
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No buildings found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundPrimary,
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  shortName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.accentSecondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
