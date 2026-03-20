import * as React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useToast } from '@/context/ToastContext';
import { useGraph } from '@/context/GraphContext';
import { useAuth } from '@/context/AuthContext';
import SkillTree from '@/components/SkillTree';
import SimpleWebView from '@/components/SimpleWebView';
import { fetchPathfind, GoalType, PathStep } from '@/lib/api';
import { shadows, theme } from '@/lib/theme';

type GraphMode = 'skills' | 'network';

const SUGGESTED_PROMPTS = [
  'How do I become a software engineer?',
  'What skills are needed for robotics?',
  'What clubs help with product management?',
];

export default function GoldenPathScreen() {
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const { pathData, setPathData, setGlobalGoalText } = useGraph();
  const [alternatives, setAlternatives] = React.useState<PathStep[]>([]);
  const [query, setQuery] = React.useState('');
  const [graphMode, setGraphMode] = React.useState<'skills' | 'network'>('network');
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<Set<string>>(new Set());

  // Initialize all nodes as selected when path changes
  React.useEffect(() => {
    if (pathData.length > 0) {
      const allIds = new Set(pathData.map(step => `opp:${step.opportunity_id || step.opportunity_title}`));
      setSelectedNodeIds(allIds);
    }
  }, [pathData]);

  const onGraphMessage = (event: any) => {
    try {
      const data = typeof event.nativeEvent.data === 'string' 
        ? JSON.parse(event.nativeEvent.data) 
        : event.nativeEvent.data;
        
      if (data.type === 'TOGGLE_NODE') {
        const newSelected = new Set(selectedNodeIds);
        if (data.selected) {
          newSelected.add(data.nodeId);
        } else {
          newSelected.delete(data.nodeId);
        }
        setSelectedNodeIds(newSelected);
      }
    } catch (e) {
      console.error('Error parsing graph message', e);
    }
  };
  const [isGenerating, setIsGenerating] = React.useState(false);

  const submitPrompt = React.useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      showToast('Enter a prompt to explore the graph.', 'info');
      return;
    }

    setIsGenerating(true);
    try {
      // For now, we'll use the first goal of the user or 'career' as default
      const goalType = (userProfile?.goals[0] as GoalType) || 'career';
      const response = await fetchPathfind({ 
        goal_type: goalType, 
        goal_text: trimmedQuery 
      });
      
      setPathData(response.steps);
      setAlternatives(response.alternatives || []);
      
      // Initialize selection: default to all main steps selected
      const mainIds = new Set(response.steps.map(s => `opp:${s.opportunity_id || s.opportunity_title}`));
      setSelectedNodeIds(mainIds);

      setGlobalGoalText(trimmedQuery);
      showToast('Career path generated!', 'success');
    } catch (err: any) {
      if (err.status === 401) {
        showToast('Session expired. Please log out and back in.', 'info');
      } else {
        showToast('Failed to generate path. Please try again.', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [query, showToast, userProfile, setPathData, setGlobalGoalText]);

  const isGenericSkill = (skill: string) => {
    const generic = ['professional', 'networking', 'career', 'teamwork', 'leadership', 'communication', 'interpersonal', 'soft skills'];
    return generic.includes(skill.toLowerCase());
  };

  const acquiredSkills = React.useMemo(() => {
    if (!userProfile) return ['Data Structures', 'Git Version Control', 'Statistical Analysis'];
    
    // Extract skills from goals and profile
    const goalSkills = userProfile.goals.flatMap(g => {
      if (g === 'career') return ['Software Engineering', 'System Design'];
      if (g === 'research') return ['Python', 'Data Science', 'Machine Learning'];
      return [];
    });
    
    // Simple filter to keep it relevant to query if possible
    const allAcquired = Array.from(new Set([...goalSkills, 'Git', 'Data Structures']));
    const q = query.toLowerCase();
    
    // Sort by relevance to query
    return allAcquired
      .filter(s => !isGenericSkill(s))
      .sort((a, b) => {
        const aMatch = q.includes(a.toLowerCase());
        const bMatch = q.includes(b.toLowerCase());
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      })
      .slice(0, 6);
  }, [userProfile, query]);

  const plannedSkills = React.useMemo(() => {
    const allSkills = pathData.flatMap(step => step.skills || []);
    return Array.from(new Set(allSkills)).filter(s => !isGenericSkill(s));
  }, [pathData]);

  const uniquePathData = React.useMemo(() => {
    const seen = new Set();
    return pathData.filter(step => {
      const id = step.opportunity_id || step.opportunity_title;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [pathData]);

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

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          <View style={styles.canvasArea}>
            {graphMode === 'skills' ? (
              <SkillTree 
                acquiredSkills={acquiredSkills} 
                plannedSkills={plannedSkills}
                acquiredOnly={false}
              />
            ) : (
              <SimpleWebView 
                source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/assets/graph/index.html` }}
                path={pathData}
                alternatives={alternatives}
                onMessage={onGraphMessage}
              />
            )}
          </View>

          {(uniquePathData.length > 0 || alternatives.length > 0) && (
            <View style={styles.milestoneSection}>
              <Text style={styles.milestoneTitle}>Your Journey Milestones</Text>
              {(() => {
                const combined = [...uniquePathData, ...alternatives];
                const seenIds = new Set();
                return combined
                  .filter((step) => {
                    const oId = step.opportunity_id || step.opportunity_title;
                    if (seenIds.has(oId)) return false;
                    const oppId = `opp:${oId}`;
                    const altId = `alt:${oId}`;
                    const isSelected = selectedNodeIds.has(oppId) || selectedNodeIds.has(altId);
                    if (isSelected) {
                      seenIds.add(oId);
                      return true;
                    }
                    return false;
                  })
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((step, idx) => (
                    <View key={`${step.opportunity_id}-${idx}`} style={styles.milestoneCard}>
                      <View style={styles.milestoneHeader}>
                        <View style={styles.milestoneBadge}>
                          <Text style={styles.milestoneBadgeText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.milestoneHeaderText}>
                          <Text style={styles.milestoneBuilding}>{step.building_name}</Text>
                          <Text style={styles.milestoneOpp}>{step.opportunity_title}</Text>
                        </View>
                      </View>
                      <Text style={styles.milestoneReason}>{step.short_reason}</Text>
                      <View style={styles.skillBadgeRow}>
                        {step.skills.filter((s: string) => !isGenericSkill(s)).map((s: string) => (
                          <View key={s} style={styles.skillBadge}>
                            <Text style={styles.skillBadgeText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ));
              })()}
            </View>
          )}
        </ScrollView>

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
  scrollArea: {
    flex: 1,
  },
  canvasArea: {
    height: 450,
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  milestoneSection: {
    marginTop: 10,
    paddingBottom: 40,
  },
  milestoneTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  milestoneCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    ...shadows.card,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  milestoneBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accentTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneBadgeText: {
    color: theme.colors.backgroundPrimary,
    fontWeight: '900',
    fontSize: 14,
  },
  milestoneHeaderText: {
    flex: 1,
  },
  milestoneBuilding: {
    color: theme.colors.accentTertiary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  milestoneOpp: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneReason: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  skillBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skillBadgeText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  toggleDock: {
    marginTop: 0,
    marginBottom: 10,
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
