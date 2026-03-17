import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';

export interface DeviceState {
  location: Location.LocationObject | null;
  heading: number | null; // Magnetic heading in degrees
}

export interface BuildingCoord {
  id: string;
  lat: number;
  lng: number;
}

export interface ProjectedBuilding {
  id: string;
  screenX: number; // 0..1
  screenY: number; // 0..1
  distanceMeters: number;
  inView: boolean;
}

export function useARCamera(buildings: BuildingCoord[]) {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    location: null,
    heading: null,
  });
  const [projectedBuildings, setProjectedBuildings] = useState<ProjectedBuilding[]>([]);

  // 1. Subscribe to Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // Update every 1 meter
        },
        (location: Location.LocationObject) => {
          setDeviceState((prev) => ({ ...prev, location }));
        }
      );

      return () => subscription.remove();
    })();
  }, []);

  // 2. Subscribe to Heading (Compass)
  useEffect(() => {
    (async () => {
      // DeviceMotion provides better results than Magnetometer for AR in some cases
      // because it combines multiple sensors.
      const { status } = await DeviceMotion.isAvailableAsync().then(() => ({ status: 'granted' })).catch(() => ({ status: 'denied' }));
      if (status !== 'granted') return;

      DeviceMotion.setUpdateInterval(100); // 10Hz
      const subscription = DeviceMotion.addListener((data: DeviceMotion.DeviceMotionMeasurement) => {
        if (data.rotation) {
          // Simplistic heading calculation from rotation
          // In a real app, you'd use a more robust matrix transformation
          // DeviceMotion.rotation.alpha is the rotation around the Z axis
          let heading = (data.rotation.alpha * 180) / Math.PI;
          if (heading < 0) heading += 360;
          setDeviceState((prev) => ({ ...prev, heading }));
        }
      });

      return () => subscription.remove();
    })();
  }, []);

  // 3. Project buildings to screen coordinates
  useEffect(() => {
    const { location, heading } = deviceState;
    if (!location || heading === null || buildings.length === 0) return;

    const userLat = location.coords.latitude;
    const userLng = location.coords.longitude;

    const nextProjected = buildings.map((b) => {
      const dist = getDistance(userLat, userLng, b.lat, b.lng);
      const bearing = getBearing(userLat, userLng, b.lat, b.lng);

      // Relate bearing to current device heading
      // 0 degrees is North
      let relativeBearing = (bearing - heading + 360) % 360;
      
      // Normalize to -180..180
      if (relativeBearing > 180) relativeBearing -= 360;

      // Simplistic projection
      // FOV is approx 60 degrees
      const fov = 60;
      const screenX = relativeBearing / fov + 0.5;
      
      // Fixed horizon for now
      const screenY = 0.5;

      const inView = screenX >= -0.2 && screenX <= 1.2; // Keep slightly outside for smooth entry

      return {
        id: b.id,
        screenX,
        screenY,
        distanceMeters: Math.round(dist),
        inView,
      };
    });

    setProjectedBuildings(nextProjected);
  }, [deviceState, buildings]);

  return projectedBuildings;
}

// ── Math Helpers ─────────────────────────────────────────────────────────────

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const brng = ((θ * 180) / Math.PI + 360) % 360; // in degrees
  return brng;
}
