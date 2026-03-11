import type { ARBuilding } from './types';

/**
 * Returns mock AR building data for development and demo purposes.
 * This is the **only** source of AR input for the overlay feature.
 * Swap this function's implementation for real detection logic later.
 */
export function getMockARBuildings(): ARBuilding[] {
  return [
    {
      id: 'malachowsky-hall',
      name: 'Malachowsky Hall',
      screenX: 0.25,
      screenY: 0.45,
      distanceMeters: 80,
      opportunityCount: 12,
      buildingType: 'engineering',
      inView: true,
      description: 'A hub for AI, data science, and engineering excellence. This state-of-the-art facility houses top-tier research labs and collaborative spaces.',
      hours: 'Open 24/7 for students with ID',
      history: 'Opened in 2023, named after NVIDIA co-founder Chris Malachowsky.',
    },
    {
      id: 'reitz-union',
      name: 'Reitz Union',
      screenX: 0.75,
      screenY: 0.55,
      distanceMeters: 150,
      opportunityCount: 8,
      buildingType: 'student_life',
      inView: true,
      description: 'The heart of student life on campus. Home to the bookstore, food court, and countless student organizations.',
      hours: 'Mon-Sun: 7:00 AM - 12:00 AM',
      history: 'A central gathering spot since 1967, recently renovated to feel like home.',
    },
    {
      id: 'new-physics-building',
      name: 'New Physics Building',
      screenX: 0.5,
      screenY: 0.48,
      distanceMeters: 60,
      opportunityCount: 15,
      buildingType: 'science',
      inView: true,
      description: 'Where the fundamental laws of the universe are explored. Features advanced laser labs and theoretical physics offices.',
      hours: 'Mon-Fri: 8:00 AM - 6:00 PM',
      history: 'Houses one of the most powerful low-temperature physics labs in the world.',
    },
  ];
}
