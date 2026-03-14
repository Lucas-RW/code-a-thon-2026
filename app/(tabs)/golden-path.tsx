import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { GoalType, GOAL_OPTIONS, PathStep, fetchPathfind } from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useToast } from '@/context/ToastContext';
import LoadingState from '@/components/LoadingState';
import { sendGraphMessage } from '@/lib/graphMessaging';
import { useGraph } from '@/context/GraphContext';

const { width } = Dimensions.get('window');

export default function GoldenPathScreen() {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  
  // A.5 Profile-driven defaults
  const initialGoal = (userProfile?.goals && userProfile.goals.length > 0) ? userProfile.goals[0] : "career";
  const [selectedGoal, setSelectedGoal] = React.useState<GoalType>(initialGoal as GoalType);
  
  // Effect to prefill goal text based on profile
  const [goalText, setGoalText] = React.useState('');
  React.useEffect(() => {
    if (userProfile && !goalText) {
      if (selectedGoal === "research") {
        const fields = userProfile.goal_preferences?.research?.fields || [];
        if (fields.length > 0) {
          setGoalText(`I want to get into ${fields[0]} research.`);
        }
      } else if (selectedGoal === "career") {
        const industries = userProfile.goal_preferences?.career?.industries || [];
        if (industries.length > 0) {
          setGoalText(`I am looking for roles in ${industries[0]}.`);
        }
      }
    }
  }, [selectedGoal, userProfile]);

  const [steps, setSteps] = React.useState<PathStep[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [playbackIndex, setPlaybackIndex] = React.useState<number | null>(null);
  
  // B.2 Graph Messaging Refs (Using shared ref from context)
  const { webViewRef } = useGraph();
  
  const fadeAnims = React.useRef<Animated.Value[]>([]).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const generatePath = async () => {
    try {
      setIsGenerating(true);
      setPlaybackIndex(null);
      const response = await fetchPathfind({ goal_type: selectedGoal, goal_text: goalText });
      const newSteps = response.steps;
      setSteps(newSteps);
      
      // B.2 Highlight full path on generation
      if (newSteps.length > 0) {
        const allSkillNodeIds = newSteps.flatMap(s => s.skill_node_ids || []);
        const allNetworkNodeIds = newSteps.flatMap(s => s.network_node_ids || []);
        
        sendGraphMessage(webViewRef, { type: "HIGHLIGHT_PATH", skillNodeIds: allSkillNodeIds, networkNodeIds: allNetworkNodeIds });
      }

      // Initialize animations
      fadeAnims.length = 0;
      newSteps.forEach(() => {
        fadeAnims.push(new Animated.Value(1));
      });
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Couldn’t generate a path, please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const playPath = () => {
    if (steps.length === 0) return;
    
    let current = 0;
    setPlaybackIndex(current);
    
    // Initial highlight for first step
    sendGraphMessage(webViewRef, { type: "HIGHLIGHT_PATH", skillNodeIds: steps[current].skill_node_ids, networkNodeIds: steps[current].network_node_ids });

    const interval = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(interval);
        setPlaybackIndex(null);
        sendGraphMessage(webViewRef, { type: "CLEAR_HIGHLIGHT" });
        return;
      }
      setPlaybackIndex(current);
      
      // B.2 Highlight current step nodes
      sendGraphMessage(webViewRef, { type: "HIGHLIGHT_PATH", skillNodeIds: steps[current].skill_node_ids, networkNodeIds: steps[current].network_node_ids });

      // Auto-scroll to current step
      scrollViewRef.current?.scrollTo({
        y: current * 180, 
        animated: true
      });
    }, 2500);
  };

  const handleCtaPress = async (url: string) => {
    if (!url) return;
    try {
      if (url.startsWith('http')) {
        await Linking.openURL(url);
      } else {
        // Handle internal deep links if needed via router
        showToast(`Locating building: ${url}`, 'info');
      }
    } catch (err) {
      showToast('Could not open link', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Golden Path</Text>
        <Text style={styles.subtitle}>Guided journey to your campus goals</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>What's your primary focus?</Text>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoal === goal.id && styles.activeGoalButton
                ]}
                onPress={() => setSelectedGoal(goal.id)}
              >
                <Text style={[
                  styles.goalButtonText,
                  selectedGoal === goal.id && styles.activeGoalButtonText
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Additional context (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. I want to build a portfolio for UX design"
            placeholderTextColor="#64748b"
            value={goalText}
            onChangeText={setGoalText}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[
                styles.generateButton, 
                isGenerating && styles.disabledButton,
                steps.length > 0 && styles.regenerateButton
              ]}
              onPress={generatePath}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons 
                    name={steps.length > 0 ? "refresh" : "auto-fix-high"} 
                    size={20} 
                    color="#fff" 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={styles.generateButtonText}>
                    {steps.length > 0 ? "Regenerate Path" : "Generate My Path"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {userProfile && (
              <TouchableOpacity 
                style={styles.profileUsageButton}
                onPress={() => {
                  setGoalText(''); // Trigger the useEffect to re-apply template
                  showToast('Re-applied profile goals', 'info');
                }}
              >
                <MaterialIcons name="person-outline" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {steps.length > 0 && (
          <View style={styles.stepsSection}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionTitle}>The Recommended Route</Text>
              <TouchableOpacity onPress={playPath} style={styles.playButton} disabled={playbackIndex !== null}>
                <MaterialIcons name="play-arrow" size={24} color={playbackIndex !== null ? "#64748b" : "#3b82f6"} />
                <Text style={[styles.playButtonText, playbackIndex !== null && { color: "#64748b" }]}>
                  {playbackIndex !== null ? "Playing..." : "Play Path"}
                </Text>
              </TouchableOpacity>
            </View>

            {steps.map((step, index) => (
              <View key={step.opportunity_id + index} style={styles.stepWrapper}>
                <View style={styles.stepConnectorLineContainer}>
                  <View style={[
                    styles.stepConnectorLine,
                    playbackIndex !== null && playbackIndex >= index && styles.activeConnectorLine,
                    index === steps.length - 1 && { height: 40 } // Cap the last line
                  ]} />
                  <View style={[
                    styles.stepMarker,
                    playbackIndex === index && styles.highlightedMarker,
                    playbackIndex !== null && playbackIndex > index && styles.completedMarker
                  ]}>
                    <Text style={styles.stepNumber}>{step.order}</Text>
                  </View>
                </View>

                <Animated.View style={[
                  styles.stepCard,
                  playbackIndex === index && styles.highlightedCard
                ]}>
                  <View style={styles.stepCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stepTitle}>{step.opportunity_title}</Text>
                      <View style={styles.buildingRow}>
                        <MaterialIcons name="business" size={14} color="#94a3b8" />
                        <Text style={styles.buildingName}>{step.building_name}</Text>
                      </View>
                    </View>
                    {playbackIndex === index && (
                      <MaterialIcons name="insights" size={20} color="#3b82f6" />
                    )}
                  </View>
                  
                  {step.short_reason && (
                    <Text style={styles.shortReason}>{step.short_reason}</Text>
                  )}

                  <View style={styles.skillsContainer}>
                    {step.skills.map((skill) => (
                      <View key={skill} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>

                  {(step.cta_label && step.cta_url) && (
                    <TouchableOpacity 
                      style={styles.ctaButton}
                      onPress={() => step.cta_url && handleCtaPress(step.cta_url)}
                    >
                      <Text style={styles.ctaButtonText}>{step.cta_label}</Text>
                      <MaterialIcons name="chevron-right" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            ))}
          </View>
        )}

        {steps.length === 0 && !isGenerating && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="map" size={48} color="#334155" />
            <Text style={styles.emptyText}>Pick a goal and generate your personalized journey path.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
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
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  configSection: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeGoalButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  goalButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeGoalButtonText: {
    color: '#3b82f6',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#f1f5f9',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  regenerateButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  profileUsageButton: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepsSection: {
    marginTop: 8,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  stepWrapper: {
    flexDirection: 'row',
  },
  stepConnectorLineContainer: {
    width: 40,
    alignItems: 'center',
  },
  stepConnectorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#334155',
  },
  activeConnectorLine: {
    backgroundColor: '#3b82f6',
  },
  stepMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    marginTop: 10,
  },
  highlightedMarker: {
    borderColor: '#3b82f6',
    backgroundColor: '#0f172a',
  },
  completedMarker: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  stepNumber: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  highlightedCard: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  buildingName: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 4,
  },
  shortReason: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  skillPillText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '600',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  ctaButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
});
