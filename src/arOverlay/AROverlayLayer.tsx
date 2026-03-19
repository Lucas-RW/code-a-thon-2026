import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View, Pressable } from 'react-native';

import type { ARBuilding, ARBuildingUIState } from './types';
import { normalizedToPixel, themeColorForBuildingType } from './utils';
import EyeIcon from './EyeIcon';
import BuildingARDetailSheet from './BuildingARDetailSheet';

interface AROverlayLayerProps {
  /** The current set of buildings to display. */
  buildings: ARBuilding[];
}

/** Delay before a building that left the view actually hides (ms). */
const HIDE_DEBOUNCE_MS = 300;

/**
 * Full-screen overlay that renders eye-icon markers and an immersive
 * bottom-sheet building card.
 */
export default function AROverlayLayer({ buildings }: AROverlayLayerProps) {
  const { width: winW, height: winH } = Dimensions.get('window');

  // buildingId → UI state (hidden/icon)
  const [uiStates, setUiStates] = useState<Record<string, ARBuildingUIState>>({});
  // The building currently being shown in the bottom sheet.
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Keep refs to debounce timers so we can clear on unmount / re-render.
  const hideTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Sync buildings prop → uiStates ──────────────────────────────
  useEffect(() => {
    setUiStates((prev) => {
      const next = { ...prev };

      for (const b of buildings) {
        if (b.inView) {
          if (hideTimers.current[b.id]) {
            clearTimeout(hideTimers.current[b.id]);
            delete hideTimers.current[b.id];
          }
          if (!next[b.id] || next[b.id] === 'hidden') {
            next[b.id] = 'icon';
          }
        } else {
          if (next[b.id] && next[b.id] !== 'hidden' && !hideTimers.current[b.id]) {
            hideTimers.current[b.id] = setTimeout(() => {
              setUiStates((s) => ({ ...s, [b.id]: 'hidden' }));
              delete hideTimers.current[b.id];
              // If the hidden building was selected, close the card.
              if (selectedBuildingId === b.id) {
                setSelectedBuildingId(null);
              }
            }, HIDE_DEBOUNCE_MS);
          }
        }
      }

      return next;
    });

    return () => {
      for (const id of Object.keys(hideTimers.current)) {
        clearTimeout(hideTimers.current[id]);
      }
    };
  }, [buildings, selectedBuildingId]);

  // ── Interaction handlers ────────────────────────────────────────
  const handleIconPress = useCallback((buildingId: string) => {
    setSelectedBuildingId(buildingId);
  }, []);

  const handleCloseCard = useCallback(() => {
    setSelectedBuildingId(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  const selectedCard = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <View style={[styles.overlay, { pointerEvents: 'box-none' }]}>
      {/* ── Icons Layer ──────────────────────────────────────────── */}
      {buildings.map((b) => {
        const state = uiStates[b.id];
        if (!state || state === 'hidden') return null;

        const { x, y } = normalizedToPixel(b.screenX, b.screenY, winW, winH);
        const color = themeColorForBuildingType(b.buildingType);

        return (
          <EyeIcon
            key={b.id}
            x={x}
            y={y}
            themeColor={color}
            onPress={() => handleIconPress(b.id)}
          />
        );
      })}

      {/* ── Bottom Sheet Overlay ─────────────────────────────────── */}
      {selectedCard && (
        <>
          {/* Dim background briefly or catch taps */}
          <Pressable style={styles.backdrop} onPress={handleCloseCard} />
          <BuildingARDetailSheet
            building={selectedCard}
            onClose={handleCloseCard}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
