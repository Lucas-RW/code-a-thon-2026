import * as React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useToast } from '@/context/ToastContext';
import { shadows, theme } from '@/lib/theme';

type GraphMode = 'skills' | 'network';

const SUGGESTED_PROMPTS = [
  'How do I become a software engineer?',
  'What skills are needed for robotics?',
  'What clubs help with product management?',
];

export default function GoldenPathScreen() {
  const { showToast } = useToast();
  const [query, setQuery] = React.useState('');
  const [graphMode, setGraphMode] = React.useState<GraphMode>('skills');

  const submitPrompt = React.useCallback(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      showToast('Enter a prompt to explore the graph.', 'info');
      return;
    }

    showToast('Graph search is simulated for now. Canvas is coming next.', 'info');
  }, [query, showToast]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Growth Graph</Text>
          <Text style={styles.subtitle}>
            Explore how skills, professors, clubs, and opportunities connect.
          </Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchShell}>
            <MaterialIcons
              name="auto-awesome"
              size={18}
              color={theme.colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask about careers, clubs, or skills..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              returnKeyType="send"
              onSubmitEditing={submitPrompt}
            />
            <Pressable onPress={submitPrompt} style={styles.submitButton}>
              <MaterialIcons
                name="south-east"
                size={22}
                color={theme.colors.backgroundPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.promptRow}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Pressable key={prompt} onPress={() => setQuery(prompt)} style={styles.promptChip}>
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.canvasSpacer} />

        <View style={styles.toggleDock}>
          <View style={styles.toggleTrack}>
            {[
              { key: 'skills' as const, label: 'Skills Map' },
              { key: 'network' as const, label: 'Network Map' },
            ].map((option) => {
              const isActive = graphMode === option.key;

              if (isActive) {
                return (
                  <React.Fragment key={option.key}>
                    <LinearGradient
                      colors={theme.gradients.accent}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activeToggle}
                    >
                      <Pressable onPress={() => setGraphMode(option.key)} style={styles.toggleButton}>
                        <Text style={styles.activeToggleText}>{option.label}</Text>
                      </Pressable>
                    </LinearGradient>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={option.key}>
                  <Pressable
                    onPress={() => setGraphMode(option.key)}
                    style={styles.inactiveToggle}
                  >
                    <Text style={styles.inactiveToggleText}>{option.label}</Text>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.backgroundPrimary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 112,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    maxWidth: 320,
  },
  searchSection: {
    marginBottom: 18,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 66,
    paddingLeft: 16,
    paddingRight: 10,
    ...shadows.card,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 18,
  },
  submitButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  promptChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promptChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  canvasSpacer: {
    flex: 1,
  },
  toggleDock: {
    marginTop: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.card,
  },
  toggleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeToggle: {
    flex: 1,
    borderRadius: theme.radius.pill,
    padding: 1,
    ...shadows.glow,
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    minHeight: 42,
  },
  activeToggleText: {
    color: theme.colors.textOnAccent,
    fontSize: 13,
    fontWeight: '800',
  },
  inactiveToggle: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inactiveToggleText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
