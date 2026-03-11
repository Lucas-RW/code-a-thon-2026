/**
 * Standalone demo screen for the AR overlay feature.
 *
 * This screen is self-contained and does NOT require any modifications to
 * existing navigation or app code. To wire it into the app, import and
 * register it in your navigation configuration.
 *
 * The camera background is simulated with a dark placeholder for now.
 * Swap the placeholder View with an expo-camera CameraView when ready.
 */

import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getMockARBuildings } from './mockData';
import AROverlayLayer from './AROverlayLayer';

/**
 * Demo screen that renders the AR overlay on top of a simulated camera view.
 * Call `getMockARBuildings()` once to supply static building data.
 */
export default function AROverlayDemoScreen() {
  // Fetch mock data once (stable across re-renders).
  const buildings = useMemo(() => getMockARBuildings(), []);

  return (
    <View style={styles.container}>
      {/* ── Camera placeholder ─────────────────────────────────── */}
      {/*
       * Replace this View with <CameraView style={styles.camera} />
       * from expo-camera when you're ready to use a real camera feed.
       */}
      <View style={styles.camera}>
        <Text style={styles.placeholderText}>Camera View</Text>
      </View>

      {/* ── AR overlay ─────────────────────────────────────────── */}
      <AROverlayLayer buildings={buildings} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#444',
    fontSize: 18,
    fontStyle: 'italic',
  },
});
