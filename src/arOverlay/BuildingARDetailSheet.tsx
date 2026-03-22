import * as React from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ARBuilding } from './types';
import { themeColorForBuildingType } from './utils';
import { shadows, theme } from '@/lib/theme';
import { fetchBuilding, fetchBuildingOpportunities, Opportunity } from '@/lib/api';

interface BuildingARDetailSheetProps {
  building: ARBuilding;
  onClose: () => void;
}

type TabKey = 'description' | 'professors' | 'opportunities' | 'events' | 'research';

type BuildingProfessor = {
  id: string;
  name: string;
  department: string;
  focus: string;
  email?: string;
  linkedin_url?: string;
  image_url?: string;
};

const HERO_PLACEHOLDER = 'https://placehold.co/1200x700/14182A/F8FAFC?text=UF+Building';
const SHEET_TOP_OFFSET = 76;
const CLOSE_THRESHOLD = 150;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'professors', label: 'Professors' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'events', label: 'Events' },
  { key: 'research', label: 'Research' },
];

export default function BuildingARDetailSheet({ building, onClose }: BuildingARDetailSheetProps) {
  const translateY = useSharedValue(900);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [interestedMap, setInterestedMap] = useState<Record<string, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [expandedProfessorMap, setExpandedProfessorMap] = useState<Record<string, boolean>>({});
  const [highlightedProfessorId, setHighlightedProfessorId] = useState<string | null>(null);
  const accentColor = themeColorForBuildingType(building.buildingType);
  const [buildingDetail, setBuildingDetail] = useState<{
    departments?: string[];
    professors?: BuildingProfessor[];
    image_url?: string;
    description?: string;
  } | null>(null);
  const [buildingOpportunities, setBuildingOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const sheetTransition = React.useMemo(
    () => ({ duration: 180, easing: Easing.out(Easing.cubic) }),
    []
  );

  React.useEffect(() => {
    translateY.value = withTiming(0, sheetTransition);
  }, [sheetTransition, translateY]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadBuildingData() {
      setIsLoadingData(true);
      try {
        const [detail, opportunities] = await Promise.all([
          fetchBuilding(building.id),
          fetchBuildingOpportunities(building.id),
        ]);

        if (!cancelled) {
          setBuildingDetail(detail);
          setBuildingOpportunities(opportunities);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }

    loadBuildingData();

    return () => {
      cancelled = true;
    };
  }, [building.id]);

  const closeSheet = React.useCallback(() => {
    translateY.value = withTiming(900, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > CLOSE_THRESHOLD || event.velocityY > 900) {
        translateY.value = withTiming(900, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, sheetTransition);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 500], [1, 0], Extrapolation.CLAMP),
  }));

  const toggleInterested = (id: string) => {
    setInterestedMap((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedMap((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleProfessorExpanded = (id: string) => {
    setExpandedProfessorMap((current) => ({ ...current, [id]: !current[id] }));
  };

  const openProfessor = (professorId?: string) => {
    if (!professorId) return;
    setActiveTab('professors');
    setHighlightedProfessorId(professorId);
    setExpandedProfessorMap((current) => ({ ...current, [professorId]: true }));
  };

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const renderDescription = () => (
    <View style={styles.panelStack}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.sectionBody}>
          {buildingDetail?.description ||
            building.description ||
            'This building connects physical campus space with opportunities, people, and graph growth.'}
        </Text>
      </View>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Departments & Focus Areas</Text>
        <View style={styles.chipWrap}>
          {(buildingDetail?.departments || []).map((department) => (
            <View key={department} style={styles.infoChip}>
              <Text style={styles.infoChipText}>{department}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderProfessors = () => (
    <View style={styles.panelStack}>
      {(buildingDetail?.professors || []).map((professor) => (
        (() => {
          const isExpanded = expandedProfessorMap[professor.id];
          return (
        <View
          key={professor.id}
          style={[
            styles.sectionCard,
            highlightedProfessorId === professor.id && styles.sectionCardHighlighted,
          ]}
        >
          <View style={styles.professorHeaderRow}>
            <View style={styles.professorRow}>
            <View style={styles.professorAvatar}>
              {professor.image_url ? (
                <Image source={{ uri: professor.image_url }} style={styles.professorAvatarImage} />
              ) : (
                <Ionicons name="person-outline" size={20} color={theme.colors.textMuted} />
              )}
            </View>
            <View style={styles.professorTextWrap}>
              <Text style={styles.cardTitle}>{professor.name}</Text>
              <Text style={styles.cardMeta}>{professor.department}</Text>
            </View>
            </View>
            <View style={styles.professorActionRow}>
              {professor.linkedin_url ? (
                <Pressable style={styles.iconAction} onPress={() => openExternal(professor.linkedin_url!)}>
                  <Ionicons name="logo-linkedin" size={18} color={theme.colors.accentTertiary} />
                </Pressable>
              ) : null}
              {professor.email ? (
                <Pressable style={styles.iconAction} onPress={() => openExternal(`mailto:${professor.email}`)}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.accentTertiary} />
                </Pressable>
              ) : null}
              <Pressable style={styles.iconAction} onPress={() => toggleProfessorExpanded(professor.id)}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>
          {isExpanded ? (
            <View style={styles.expandedBlock}>
              <Text style={styles.sectionBody}>{professor.focus}</Text>
            </View>
          ) : null}
        </View>
          );
        })()
      ))}
    </View>
  );

  const renderExpandableRows = (items: Opportunity[]) => (
    <View style={styles.panelStack}>
      {items.map((item) => {
        const isInterested = interestedMap[item.id];
        const isExpanded = expandedMap[item.id];

        return (
          <View key={item.id} style={styles.sectionCard}>
            <View style={styles.expandableHeader}>
              <View style={styles.expandableCopy}>
                <View style={[styles.typePill, { borderColor: accentColor }]}>
                  <Text style={[styles.typePillText, { color: accentColor }]}>{item.type}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.summary || item.description || 'Building-linked opportunity'}</Text>
              </View>
              <View style={styles.rowActions}>
                <Pressable onPress={() => toggleInterested(item.id)} style={styles.iconAction}>
                  <Ionicons
                    name={isInterested ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isInterested ? theme.colors.accentTertiary : theme.colors.textSecondary}
                  />
                </Pressable>
                <Pressable onPress={() => toggleExpanded(item.id)} style={styles.iconAction}>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {isExpanded ? (
              <View style={styles.expandedBlock}>
                <Text style={styles.sectionBody}>{item.description || 'Additional details coming soon.'}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hourly commitment</Text>
                  <Text style={styles.detailValue}>{item.hourly_commitment || 'TBD'}</Text>
                </View>
                {item.pay ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Potential pay</Text>
                    <Text style={styles.detailValue}>{item.pay}</Text>
                  </View>
                ) : null}
                {item.professor ? (
                  <Pressable style={styles.detailRow} onPress={() => openProfessor(item.professor_id)}>
                    <Text style={styles.detailLabel}>Professor associated</Text>
                    <View style={styles.professorLink}>
                      <Text style={styles.professorLinkText}>{item.professor}</Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.colors.accentTertiary} />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );

  const renderTabContent = () => {
    const opportunities = buildingOpportunities.filter((item) =>
      ['job', 'student_org', 'course'].includes(item.type)
    );
    const events = buildingOpportunities.filter((item) => item.type === 'event');
    const research = buildingOpportunities.filter((item) => item.type === 'research');

    switch (activeTab) {
      case 'professors':
        return renderProfessors();
      case 'opportunities':
        return renderExpandableRows(opportunities);
      case 'events':
        return renderExpandableRows(events);
      case 'research':
        return renderExpandableRows(research);
      case 'description':
      default:
        return renderDescription();
    }
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
            contentContainerStyle={styles.scrollContent}
          >
            <View>
              <ImageBackground source={{ uri: buildingDetail?.image_url || building.image_url || HERO_PLACEHOLDER }} style={styles.hero} imageStyle={styles.heroImage}>
                <LinearGradient colors={['rgba(11,11,15,0.08)', 'rgba(11,11,15,0.92)']} style={styles.heroOverlay}>
                  <View style={styles.handleWrap}>
                    <View style={styles.handle} />
                  </View>
                  <View style={styles.heroTopRow}>
                    <View style={[styles.heroBadge, { backgroundColor: `${accentColor}33` }]}>
                      <Ionicons name="business-outline" size={16} color={theme.colors.textOnAccent} />
                      <Text style={styles.heroBadgeText}>AR Building</Text>
                    </View>
                    <Pressable onPress={closeSheet} style={styles.closeButton}>
                      <Ionicons name="close" size={18} color={theme.colors.textPrimary} />
                    </Pressable>
                  </View>

                  <View style={styles.heroBottom}>
                    <Text style={styles.heroName}>{building.name}</Text>
                    <Text style={styles.heroMeta}>
                      {building.distanceMeters}m away · {building.opportunityCount} graph-linked opportunities
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>

            <View style={styles.stickyTabsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
                {TABS.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <Pressable key={tab.key} style={styles.tabButton} onPress={() => setActiveTab(tab.key)}>
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                      <View style={styles.tabIndicatorSlot}>
                        {isActive ? (
                          <LinearGradient
                            colors={[theme.colors.accent, theme.colors.accentTertiary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tabIndicator}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.bodyContent}>
              {isLoadingData ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={theme.colors.accentTertiary} />
                  <Text style={styles.loadingText}>Loading building details...</Text>
                </View>
              ) : (
                renderTabContent()
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.58)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: SHEET_TOP_OFFSET,
    backgroundColor: theme.colors.backgroundPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadows.card,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  hero: {
    height: 250,
    width: '100%',
  },
  heroImage: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 18,
    paddingTop: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: theme.colors.textOnAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,11,15,0.55)',
  },
  heroBottom: {
    paddingTop: 36,
  },
  heroName: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroMeta: {
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  stickyTabsWrap: {
    backgroundColor: theme.colors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsRow: {
    paddingHorizontal: 18,
    gap: 18,
  },
  tabButton: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
  },
  tabIndicatorSlot: {
    height: 4,
    marginTop: 10,
  },
  tabIndicator: {
    width: '100%',
    height: 4,
    borderRadius: 999,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  panelStack: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  sectionCardHighlighted: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceAlt,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  professorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  professorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  professorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  professorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  professorTextWrap: {
    flex: 1,
  },
  professorActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardMeta: {
    color: theme.colors.accentTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expandableCopy: {
    flex: 1,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: 10,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    marginLeft: 8,
  },
  expandedBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailRow: {
    marginTop: 12,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  professorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  professorLinkText: {
    color: theme.colors.accentTertiary,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
});
