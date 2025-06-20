import { type Coord } from '../schemas/coord';

export const inventoryCoords: Coord[] = [
  { x1: 11, y1: 7, x2: 47, y2: 39 },
  { x1: 54, y1: 7, x2: 90, y2: 39 },
  { x1: 97, y1: 7, x2: 133, y2: 39 },
  { x1: 140, y1: 7, x2: 176, y2: 39 },
  { x1: 183, y1: 7, x2: 219, y2: 39 },
  { x1: 226, y1: 7, x2: 262, y2: 39 },
  { x1: 269, y1: 7, x2: 305, y2: 39 },

  { x1: 11, y1: 43, x2: 47, y2: 75 },
  { x1: 54, y1: 43, x2: 90, y2: 75 },
  { x1: 97, y1: 43, x2: 133, y2: 75 },
  { x1: 140, y1: 43, x2: 176, y2: 75 },
  { x1: 183, y1: 43, x2: 219, y2: 75 },
  { x1: 226, y1: 43, x2: 262, y2: 75 },
  { x1: 269, y1: 43, x2: 305, y2: 75 },

  { x1: 11, y1: 79, x2: 47, y2: 111 },
  { x1: 54, y1: 79, x2: 90, y2: 111 },
  { x1: 97, y1: 79, x2: 133, y2: 111 },
  { x1: 140, y1: 79, x2: 176, y2: 111 },
  { x1: 183, y1: 79, x2: 219, y2: 111 },
  { x1: 226, y1: 79, x2: 262, y2: 111 },
  { x1: 269, y1: 79, x2: 305, y2: 111 },

  { x1: 11, y1: 115, x2: 47, y2: 147 },
  { x1: 54, y1: 115, x2: 90, y2: 147 },
  { x1: 97, y1: 115, x2: 133, y2: 147 },
  { x1: 140, y1: 115, x2: 176, y2: 147 },
  { x1: 183, y1: 115, x2: 219, y2: 147 },
  { x1: 226, y1: 115, x2: 262, y2: 147 },
  { x1: 269, y1: 115, x2: 305, y2: 147 }
];

export const equipmentCoords: Coord[] = [
  { x1: 330, y1: 8.5, x2: 362, y2: 39 },
  { x1: 376, y1: 8.5, x2: 408, y2: 39 },
  { x1: 422, y1: 8.5, x2: 454, y2: 39 },
  { x1: 468, y1: 8.5, x2: 500, y2: 39 },

  { x1: 330, y1: 46.5, x2: 362, y2: 78 },
  { x1: 376, y1: 46.5, x2: 408, y2: 78 },
  { x1: 422, y1: 46.5, x2: 454, y2: 78 },
  { x1: 468, y1: 46.5, x2: 500, y2: 78 },

  { x1: 330, y1: 84, x2: 362, y2: 115 },
  { x1: 376, y1: 84, x2: 408, y2: 115 },
  { x1: 422, y1: 84, x2: 454, y2: 115 },
  { x1: 468, y1: 84, x2: 500, y2: 115 },

  { x1: 330, y1: 122, x2: 362, y2: 152 }
];

/* Mobile version (vertical layout) */

// roughly 43px between columns
// roughly 36px between rows

// Works at 419 px screen width

/**
 * The order of these must be preserved.
 */
export const equipmentCoordsMobile: Coord[] = [
  // Helm
  { x1: 76, y1: 25, x2: 362, y2: 39 },
  // Cape
  { x1: 36, y1: 67, x2: 408, y2: 39 },
  // Necklace
  { x1: 76, y1: 67, x2: 454, y2: 39 },
  // Mainhand
  { x1: 16, y1: 108, x2: 500, y2: 39 },
  // Chest
  { x1: 76, y1: 108, x2: 362, y2: 78 },
  // Shield
  { x1: 136, y1: 108, x2: 408, y2: 78 },
  // Legs
  { x1: 76, y1: 148, x2: 454, y2: 78 },
  // Gloves
  { x1: 16, y1: 189, x2: 500, y2: 78 },
  // Boots
  { x1: 77, y1: 189, x2: 362, y2: 115 },
  // Ring
  { x1: 136, y1: 189, x2: 408, y2: 115 },
  // Ammo/rune pouch
  { x1: 116, y1: 67, x2: 454, y2: 115 },
  // Aura
  { x1: 37, y1: 24, x2: 500, y2: 115 },
  // Pocket slot
  { x1: 117, y1: 24, x2: 362, y2: 152 }
];

/**
 * The order of these must be preserved.
 */
export const inventoryCoordsMobile: Coord[] = [
  // First row
  { x1: 8, y1: 252, x2: 47, y2: 39 },
  { x1: 51, y1: 252, x2: 90, y2: 39 },
  { x1: 95, y1: 252, x2: 133, y2: 39 },
  { x1: 141, y1: 252, x2: 176, y2: 39 },

  // Second row
  { x1: 8, y1: 288, x2: 47, y2: 39 },
  { x1: 51, y1: 288, x2: 90, y2: 39 },
  { x1: 95, y1: 288, x2: 133, y2: 39 },
  { x1: 141, y1: 288, x2: 176, y2: 39 },

  // Third row
  { x1: 8, y1: 324, x2: 47, y2: 39 },
  { x1: 51, y1: 324, x2: 90, y2: 39 },
  { x1: 95, y1: 324, x2: 133, y2: 39 },
  { x1: 141, y1: 324, x2: 176, y2: 39 },

  // Fourth row
  { x1: 8, y1: 360, x2: 47, y2: 39 },
  { x1: 51, y1: 360, x2: 90, y2: 39 },
  { x1: 95, y1: 360, x2: 133, y2: 39 },
  { x1: 141, y1: 360, x2: 176, y2: 39 },

  // Fifth row
  { x1: 8, y1: 396, x2: 47, y2: 39 },
  { x1: 51, y1: 396, x2: 90, y2: 39 },
  { x1: 95, y1: 396, x2: 133, y2: 39 },
  { x1: 141, y1: 396, x2: 176, y2: 39 },

  // Sixth row
  { x1: 8, y1: 433, x2: 47, y2: 39 },
  { x1: 51, y1: 433, x2: 90, y2: 39 },
  { x1: 95, y1: 433, x2: 133, y2: 39 },
  { x1: 141, y1: 433, x2: 176, y2: 39 },

  // Seventh row
  { x1: 8, y1: 471, x2: 47, y2: 39 },
  { x1: 51, y1: 471, x2: 90, y2: 39 },
  { x1: 95, y1: 471, x2: 133, y2: 39 },
  { x1: 141, y1: 471, x2: 176, y2: 39 }
];
