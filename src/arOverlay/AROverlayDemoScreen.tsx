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
import { useMemo, useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

import { fetchBuildings, BuildingSummary } from '@/lib/api';
import AROverlayLayer from './AROverlayLayer';
import { useARCamera } from '@/hooks/useARCamera';
import { ARBuilding } from './types';


export default function AROverlayDemoScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch buildings
  useEffect(() => {
    fetchBuildings()
      .then(setBuildings)
      .finally(() => setIsLoading(false));
  }, []);

  // 2. Track GPS and project coordinates
  const buildingCoords = useMemo(() =>
    buildings.map(b => ({ id: b.id, lat: b.lat, lng: b.lng })),
  [buildings]);
  
  const { projected: projectedData, debugLat, debugLng, debugHeading } = useARCamera(buildingCoords);

  // 3. Merge projected data with building details
  const arBuildings: ARBuilding[] = useMemo(() => {
    return projectedData.map(p => {
      const b = buildings.find(orig => orig.id === p.id);
      return {
        ...p,
        name: b?.name || 'Unknown',
        lat: b?.lat || 0,
        lng: b?.lng || 0,
        opportunityCount: 0, // Could be fetched per building if needed
        buildingType: 'science', // Default or map from building data
        description: b?.description,
      };
    });
  }, [projectedData, buildings]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} />
      
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <AROverlayLayer buildings={arBuildings} />
      )}

      {/* ── Debug overlay — remove before shipping ── */}
      <View style={styles.debugOverlay} pointerEvents="none">
        <Text style={styles.debugText}>
          lat: {debugLat?.toFixed(6) ?? '…'}{'\n'}
          lng: {debugLng?.toFixed(6) ?? '…'}{'\n'}
          heading: {debugHeading?.toFixed(1) ?? '…'}°
        </Text>
      </View>

      <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
        <Ionicons name="camera-reverse-outline" size={30} color="white" />
      </TouchableOpacity>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 60,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 8,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
