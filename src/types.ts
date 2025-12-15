import * as THREE from 'three';

export type EdgeType = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type GameStatus = 'title' | 'playing' | 'game_over' | 'win';

export interface PeelCell {
  id: number;
  sideId: number;
  vertices: THREE.Vector2[];
  center: THREE.Vector2;
  mesh: THREE.Mesh;
  peeled: boolean;
  edge: EdgeType;
  edges: EdgeType[]; // All edges this cell touches (for corner cells)
  neighborIds: number[]; // IDs of adjacent cells (share a Voronoi edge)
}

export interface MandarinSide {
  id: number;
  cells: PeelCell[];
  peeled: boolean;
  adjacent: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  group: THREE.Group;
}

export interface GameState {
  status: GameStatus;
  currentSide: number;
  sides: MandarinSide[];
  touchActive: boolean;
  startTime: number;
  lastPeeledEdge: EdgeType | null;
  peeledCount: number;
  totalCells: number;
}

// Side adjacency map based on cube unfolding
export const SIDE_ADJACENCY: Record<number, { top: number; bottom: number; left: number; right: number }> = {
  0: { top: 2, bottom: 3, left: 4, right: 5 },   // FRONT
  1: { top: 2, bottom: 3, left: 5, right: 4 },   // BACK
  2: { top: 1, bottom: 0, left: 4, right: 5 },   // TOP
  3: { top: 0, bottom: 1, left: 4, right: 5 },   // BOTTOM
  4: { top: 2, bottom: 3, left: 1, right: 0 },   // LEFT
  5: { top: 2, bottom: 3, left: 0, right: 1 },   // RIGHT
};

// Side names for debugging
export const SIDE_NAMES = ['FRONT', 'BACK', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'];

// Camera rotations for each side (quaternions)
export const SIDE_ROTATIONS: THREE.Quaternion[] = [];

// Initialize side rotations
export function initSideRotations(): void {
  // FRONT - looking at +Z
  SIDE_ROTATIONS[0] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
  // BACK - looking at -Z
  SIDE_ROTATIONS[1] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
  // TOP - looking at +Y
  SIDE_ROTATIONS[2] = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  // BOTTOM - looking at -Y
  SIDE_ROTATIONS[3] = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  // LEFT - looking at -X
  SIDE_ROTATIONS[4] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
  // RIGHT - looking at +X
  SIDE_ROTATIONS[5] = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
}
