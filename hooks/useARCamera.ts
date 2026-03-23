import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface DeviceState {
  location: Location.LocationObject | null;
  heading: number | null;
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

export interface ARCameraResult {
  projected: ProjectedBuilding[];
}

const MAX_DISTANCE_METERS = 500;
const HFOV = 60;

export function useARCamera(buildings: BuildingCoord[]): ARCameraResult {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    location: null,
    heading: null,
  });

  // 1. Subscribe to GPS location
  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2 },
        (location) => setDeviceState((prev) => ({ ...prev, location }))
      );
    })();
    return () => sub?.remove();
  }, []);

  // 2. Subscribe to compass heading
  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchHeadingAsync((headingData) => {
        setDeviceState((prev) => ({ ...prev, heading: headingData.magHeading }));
      });
    })();
    return () => sub?.remove();
  }, []);

  // 3. Project buildings to screen coordinates
  const { location, heading } = deviceState;

  if (!location || heading === null || buildings.length === 0) {
    return { projected: [] };
  }

  const userLat = location.coords.latitude;
  const userLng = location.coords.longitude;

  const projected = buildings
    .map((b): ProjectedBuilding | null => {
      const dist = getDistance(userLat, userLng, b.lat, b.lng);
      if (dist > MAX_DISTANCE_METERS) return null;

      const bearing = getBearing(userLat, userLng, b.lat, b.lng);

      let relativeBearing = (bearing - heading + 360) % 360;
      if (relativeBearing > 180) relativeBearing -= 360;

      const screenX = relativeBearing / HFOV + 0.5;
      const inView = screenX >= 0.0 && screenX <= 1.0;

      return { id: b.id, screenX, screenY: 0.5, distanceMeters: Math.round(dist), inView };
    })
    .filter((b): b is ProjectedBuilding => b !== null);

  return { projected };
}

// ── Math Helpers ──────────────────────────────────────────────────────────────

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
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
  return ((θ * 180) / Math.PI + 360) % 360;
}
