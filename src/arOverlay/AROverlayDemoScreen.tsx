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
import { useMemo, useState} from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

import { getMockARBuildings } from './mockData';
import AROverlayLayer from './AROverlayLayer';

/**
 * Demo screen that renders the AR overlay on top of a simulated camera view.
 * Call `getMockARBuildings()` once to supply static building data.
 */
export default function AROverlayDemoScreen() {
  // Fetch mock data once (stable across re-renders).
  const buildings = useMemo(() => getMockARBuildings(), []);

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} />
      <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
        <Ionicons name="camera-reverse-outline" size={30} color="white" />
      </TouchableOpacity>
      {/* ── AR overlay ─────────────────────────────────────────── */}
      {/* <AROverlayLayer buildings={buildings} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  flipButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
