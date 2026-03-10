import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ARBuilding } from './types';
import { themeColorForBuildingType } from './utils';

interface BuildingARCardProps {
  /** The building whose details are displayed. */
  building: ARBuilding;
  /** Called when the user closes the card. */
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% of screen height

/**
 * Immersive bottom-sheet style info card.
 * Features a slide-up animation from the bottom and displays extensive details.
 */
export default function BuildingARCard({ building, onClose }: BuildingARCardProps) {
  // ── Slide-up animation ─────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, slideAnim]);

  const themeColor = themeColorForBuildingType(building.buildingType);

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.contentWrapper}>
        {/* ── Handle ────────────────────────────────────────────── */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>
          {/* ── Header ────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.typeBadge, { backgroundColor: themeColor }]}>
              <Ionicons
                name={
                  building.buildingType === 'engineering'
                    ? 'construct-outline'
                    : building.buildingType === 'student_life'
                    ? 'people-outline'
                    : 'flask-outline'
                }
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{building.name}</Text>
              <Text style={styles.distance}>~{building.distanceMeters}m away</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ── Badges ──────────────────────────────────────────── */}
            <View style={styles.badgeRow}>
              <View style={[styles.oppBadge, { backgroundColor: themeColor }]}>
                <Text style={styles.oppText}>{building.opportunityCount} Opportunities</Text>
              </View>
              {building.hours && (
                <View style={styles.hoursBadge}>
                  <Ionicons name="time-outline" size={14} color="#ccc" style={{ marginRight: 4 }} />
                  <Text style={styles.hoursText}>{building.hours}</Text>
                </View>
              )}
            </View>

            {/* ── Extensive Details ────────────────────────────────── */}
            {building.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <Text style={styles.bodyText}>{building.description}</Text>
              </View>
            )}

            {building.history && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>History</Text>
                <Text style={styles.bodyText}>{building.history}</Text>
              </View>
            )}

            {/* TODO: Add "Get Directions" or "View More" big button here */}
            <View style={styles.spacer} />
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    // Shadow
    boxShadow: '0px -4px 16px rgba(0, 0, 0, 0.45)',
    elevation: 20,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  distance: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  oppBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  oppText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hoursText: {
    color: '#ccc',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  spacer: {
    height: 20,
  },
});
