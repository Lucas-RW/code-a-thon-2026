import * as React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { useToast } from '@/context/ToastContext';
import { useGraph } from '@/context/GraphContext';
import { useAuth } from '@/context/AuthContext';
import SimpleWebView from '@/components/SimpleWebView';
import { fetchPathfind, GoalType, PathStep } from '@/lib/api';
import { shadows, theme } from '@/lib/theme';

const SUGGESTED_PROMPTS = [
  'How do I become a software engineer?',
  'What skills are needed for robotics?',
  'What clubs help with product management?',
];

export default function GoldenPathScreen() {
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const { pathData, setPathData, setGlobalGoalText } = useGraph();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const promptFade = React.useRef(new Animated.Value(1)).current;
  const milestoneOffsetYRef = React.useRef(0);
  const [alternatives, setAlternatives] = React.useState<PathStep[]>([]);
  const [query, setQuery] = React.useState('');
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<Set<string>>(new Set());
  const [showSuggestedPrompts, setShowSuggestedPrompts] = React.useState(true);
  const [isGeneratingPath, setIsGeneratingPath] = React.useState(false);
  const graphHeight = Math.max(640, windowHeight - 110);

  // Initialize all nodes as selected when path changes
  React.useEffect(() => {
    if (pathData.length > 0) {
      const allIds = new Set(pathData.map(step => `opp:${step.opportunity_id || step.opportunity_title}`));
      setSelectedNodeIds(allIds);
    }
  }, [pathData]);

  const onGraphMessage = React.useCallback((event: any) => {
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
  }, [selectedNodeIds]);

  const hideSuggestedPrompts = React.useCallback(() => {
    if (!showSuggestedPrompts) return;

    Animated.timing(promptFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowSuggestedPrompts(false);
      }
    });
  }, [promptFade, showSuggestedPrompts]);

  const submitPrompt = React.useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      showToast('Enter a prompt to explore the graph.', 'info');
      return;
    }

    try {
      setIsGeneratingPath(true);
      setQuery('');
      hideSuggestedPrompts();

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
      setQuery(trimmedQuery);
    } finally {
      setIsGeneratingPath(false);
    }
  }, [query, showToast, userProfile, setPathData, setGlobalGoalText, hideSuggestedPrompts]);

  const isGenericSkill = (skill: string) => {
    const generic = ['professional', 'networking', 'career', 'teamwork', 'leadership', 'communication', 'interpersonal', 'soft skills'];
    return generic.includes(skill.toLowerCase());
  };

  const uniquePathData = React.useMemo(() => {
    const seen = new Set();
    return pathData.filter(step => {
      const id = step.opportunity_id || step.opportunity_title;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [pathData]);

  const hasMilestones = uniquePathData.length > 0 || alternatives.length > 0;

  React.useEffect(() => {
    setShowSuggestedPrompts(true);
    promptFade.setValue(1);
  }, [promptFade]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.graphStage, { height: graphHeight }]}>
          <View style={styles.graphSurface}>
            <SimpleWebView 
              source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/assets/graph/index.html` }}
              path={pathData}
              alternatives={alternatives}
              onMessage={onGraphMessage}
            />
          </View>

          <View pointerEvents="box-none" style={styles.overlayLayer}>
            <View style={styles.topOverlay}>
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Connection Graph</Text>
                  <Text style={styles.subtitle}>
                    Explore how skills, professors, clubs, and opportunities connect.
                  </Text>
                </View>
                {hasMilestones ? (
                  <Pressable
                    style={styles.journeyButton}
                    onPress={() =>
                      scrollRef.current?.scrollTo({
                        y: Math.max(milestoneOffsetYRef.current - 16, 0),
                        animated: true,
                      })
                    }
                  >
                    <MaterialIcons name="timeline" size={20} color={theme.colors.textPrimary} />
                  </Pressable>
                ) : null}
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
                    editable={!isGeneratingPath}
                  />
                  <Pressable onPress={submitPrompt} style={styles.submitButton} disabled={isGeneratingPath}>
                    {isGeneratingPath ? (
                      <ActivityIndicator size="small" color={theme.colors.backgroundPrimary} />
                    ) : (
                      <MaterialIcons
                        name="south-east"
                        size={22}
                        color={theme.colors.backgroundPrimary}
                      />
                    )}
                  </Pressable>
                </View>

                {showSuggestedPrompts ? (
                  <Animated.View style={[styles.promptRow, { opacity: promptFade }]}>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <Pressable
                        key={prompt}
                        onPress={() => {
                          setQuery(prompt);
                          hideSuggestedPrompts();
                        }}
                        style={styles.promptChip}
                      >
                        <Text style={styles.promptChipText}>{prompt}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {hasMilestones && (
          <View
            style={styles.milestoneSection}
            onLayout={(event) => {
              milestoneOffsetYRef.current = event.nativeEvent.layout.y;
            }}
          >
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
  },
  screenContent: {
    paddingBottom: 50,
  },
  graphStage: {
    position: 'relative',
    backgroundColor: theme.colors.backgroundPrimary,
  },
  graphSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
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
  journeyButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    ...shadows.card,
  },
  searchSection: {
    gap: 14,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
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
  },
  promptChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promptChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneSection: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 24,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    ...shadows.card,
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
});
