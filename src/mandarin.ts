import * as THREE from 'three';
import { MandarinSide, SIDE_ADJACENCY, PeelCell } from './types';
import { generateVoronoiCells, createCellMeshesForCurvedSurface } from './voronoi';

// Roundness factor: 0 = cube, 1 = sphere
const ROUNDNESS = 0.9;
const MANDARIN_RADIUS = 1.0;

// Create a rounded cube mesh for the core (solid orange flesh)
function createRoundedCubeCore(radius: number, _roundness: number): THREE.Mesh {
  const segments = 16;
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

  // Solid orange color for the mandarin flesh
  const material = new THREE.MeshStandardMaterial({
    color: 0xff9933,  // Bright orange
    roughness: 0.7,
    metalness: 0.0,
  });

  return new THREE.Mesh(geometry, material);
}

// Project a point from a cube face onto a rounded cube surface
// uv: coordinates on face (-1 to 1), sideId: which face
export function projectToRoundedCube(
  u: number,
  v: number,
  sideId: number,
  roundness: number = ROUNDNESS,
  radius: number = MANDARIN_RADIUS
): THREE.Vector3 {
  // Get the cube position first
  let cubePos: THREE.Vector3;

  switch (sideId) {
    case 0: // FRONT (+Z)
      cubePos = new THREE.Vector3(u, v, 1);
      break;
    case 1: // BACK (-Z)
      cubePos = new THREE.Vector3(-u, v, -1);
      break;
    case 2: // TOP (+Y)
      cubePos = new THREE.Vector3(u, 1, -v);
      break;
    case 3: // BOTTOM (-Y)
      cubePos = new THREE.Vector3(u, -1, v);
      break;
    case 4: // LEFT (-X)
      cubePos = new THREE.Vector3(-1, v, -u);
      break;
    case 5: // RIGHT (+X)
      cubePos = new THREE.Vector3(1, v, u);
      break;
    default:
      cubePos = new THREE.Vector3(u, v, 1);
  }

  // Normalize to get sphere position
  const spherePos = cubePos.clone().normalize();

  // Blend between cube and sphere based on roundness
  const result = new THREE.Vector3().lerpVectors(cubePos, spherePos, roundness);

  // Scale to desired radius
  result.multiplyScalar(radius);

  return result;
}

// Create a single mandarin side with Voronoi cells on curved surface
function createSide(sideId: number, cellCount: number = 6): MandarinSide {
  const cellData = generateVoronoiCells(sideId, cellCount);
  const cells = createCellMeshesForCurvedSurface(cellData, sideId, ROUNDNESS, MANDARIN_RADIUS);

  const group = new THREE.Group();
  group.name = `side-${sideId}`;

  for (const cell of cells) {
    group.add(cell.mesh);
  }

  // No positioning needed - cells are already in world space

  return {
    id: sideId,
    cells,
    peeled: false,
    adjacent: SIDE_ADJACENCY[sideId],
    group,
  };
}

// Create full mandarin with all 6 sides
export function createMandarin(cellsPerSide: number = 6): {
  sides: MandarinSide[];
  group: THREE.Group;
  totalCells: number;
} {
  const sides: MandarinSide[] = [];
  const group = new THREE.Group();
  group.name = 'mandarin';

  let totalCells = 0;

  for (let i = 0; i < 6; i++) {
    const side = createSide(i, cellsPerSide);
    sides.push(side);
    group.add(side.group);
    totalCells += side.cells.length;
  }

  // Add a core rounded cube for visual reference
  const core = createRoundedCubeCore(0.95, ROUNDNESS);
  core.name = 'core';
  group.add(core);

  return { sides, group, totalCells };
}

// Check if a point is inside a polygon (2D)
export function pointInPolygon(point: THREE.Vector2, vertices: THREE.Vector2[]): boolean {
  let inside = false;
  const n = vertices.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

// Find cell at local UV coordinates
export function findCellAtPoint(side: MandarinSide, point: THREE.Vector2): PeelCell | null {
  for (const cell of side.cells) {
    if (pointInPolygon(point, cell.vertices)) {
      return cell;
    }
  }
  return null;
}

// Check if all cells on a side are peeled
export function isSideComplete(side: MandarinSide): boolean {
  return side.cells.every(cell => cell.peeled);
}

// Get count of peeled cells on a side
export function getPeeledCount(side: MandarinSide): number {
  return side.cells.filter(cell => cell.peeled).length;
}
