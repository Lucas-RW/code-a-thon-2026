/**
 * Utility functions for the AR overlay feature.
 * Pure helpers kept separate so they can be unit-tested and reused.
 */

/**
 * Convert normalized screen coordinates (0..1) to absolute pixel positions.
 *
 * @param screenX - Normalized horizontal position (0 = left, 1 = right).
 * @param screenY - Normalized vertical position (0 = top, 1 = bottom).
 * @param windowWidth - Current window width in pixels.
 * @param windowHeight - Current window height in pixels.
 * @returns Pixel coordinates `{ x, y }`.
 */
export function normalizedToPixel(
  screenX: number,
  screenY: number,
  windowWidth: number,
  windowHeight: number,
): { x: number; y: number } {
  return {
    x: screenX * windowWidth,
    y: screenY * windowHeight,
  };
}

/**
 * Map a building type to a theme colour used throughout the overlay UI.
 */
export function themeColorForBuildingType(
  buildingType: 'engineering' | 'student_life' | 'science',
): string {
  switch (buildingType) {
    case 'engineering':
      return '#4F46E5';
    case 'student_life':
      return '#2563EB';
    case 'science':
      return '#A78BFA';
  }
}
