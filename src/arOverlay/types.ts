/**
 * Data types for the AR overlay feature.
 */

/** Represents a building detected/positioned in the AR view. */
export interface ARBuilding {
  /** Unique identifier for the building. */
  id: string;

  /** Display name of the building. */
  name: string;

  /** Latitude coordinate. */
  lat: number;

  /** Longitude coordinate. */
  lng: number;

  /**
   * Normalized horizontal screen position (0.0 = left edge, 1.0 = right edge).
   */
  screenX: number;

  /**
   * Normalized vertical screen position (0.0 = top edge, 1.0 = bottom edge).
   * ~0.5 corresponds roughly to the horizon.
   */
  screenY: number;

  /** Estimated distance to the building in meters. */
  distanceMeters: number;

  /** Number of opportunities (events, jobs, etc.) associated with this building. */
  opportunityCount: number;

  /** Category of the building. */
  buildingType: 'engineering' | 'student_life' | 'science';

  /** Whether the building is currently within the camera's field of view. */
  inView: boolean;

  /** Detailed description of the building. */
  description?: string;
  /** Opening hours placeholder. */
  hours?: string;
  /** Historical context or fun facts. */
  history?: string;
}

/**
 * UI state for a single building marker in the overlay.
 * - "hidden": not rendered at all.
 * - "icon":   small eye-icon marker is shown.
 * - "card":   expanded info card is shown above the icon.
 */
export type ARBuildingUIState = 'hidden' | 'icon' | 'card';
