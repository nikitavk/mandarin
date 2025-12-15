import * as THREE from 'three';
import { EdgeType, PeelCell } from './types';
import { getPeelTexture, getPeelNormalMap, getBodyTexture } from './textures';

// Voronoi cell generation for mandarin peel pieces

interface VoronoiSite {
  id: number;
  x: number;
  y: number;
}

// Generate random sites for Voronoi diagram with good distribution
function generateSites(count: number, bounds: number): VoronoiSite[] {
  const sites: VoronoiSite[] = [];
  const margin = bounds * 0.15;
  const effectiveBounds = bounds - margin;

  // Use relaxed random placement with minimum distance
  const minDist = (effectiveBounds * 2) / Math.sqrt(count) * 0.7;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let x: number, y: number;

    do {
      x = (Math.random() * 2 - 1) * effectiveBounds;
      y = (Math.random() * 2 - 1) * effectiveBounds;
      attempts++;

      // Check distance from existing sites
      let valid = true;
      for (const site of sites) {
        const dx = x - site.x;
        const dy = y - site.y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          valid = false;
          break;
        }
      }

      if (valid || attempts > 100) {
        break;
      }
    } while (true);

    sites.push({ id: i, x, y });
  }

  return sites;
}

// Compute Voronoi cell for a given site using half-plane intersection
function computeCell(site: VoronoiSite, allSites: VoronoiSite[], bounds: number): THREE.Vector2[] {
  // Start with bounding box
  let polygon: THREE.Vector2[] = [
    new THREE.Vector2(-bounds, -bounds),
    new THREE.Vector2(bounds, -bounds),
    new THREE.Vector2(bounds, bounds),
    new THREE.Vector2(-bounds, bounds),
  ];

  // Clip against each other site's bisector
  for (const other of allSites) {
    if (other.id === site.id) continue;

    // Compute bisector between site and other
    const mx = (site.x + other.x) / 2;
    const my = (site.y + other.y) / 2;

    // Normal pointing toward site
    const nx = site.x - other.x;
    const ny = site.y - other.y;
    const len = Math.sqrt(nx * nx + ny * ny);
    if (len < 0.0001) continue;

    const nnx = nx / len;
    const nny = ny / len;

    // Clip polygon to half-plane on site's side
    polygon = clipPolygonToHalfPlane(polygon, mx, my, nnx, nny);

    if (polygon.length < 3) break;
  }

  return polygon;
}

// Clip a polygon to a half-plane defined by point (px, py) and normal (nx, ny)
function clipPolygonToHalfPlane(
  polygon: THREE.Vector2[],
  px: number,
  py: number,
  nx: number,
  ny: number
): THREE.Vector2[] {
  if (polygon.length < 3) return [];

  const result: THREE.Vector2[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const curr = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    // Signed distance to plane (positive = inside, toward normal direction)
    const dCurr = (curr.x - px) * nx + (curr.y - py) * ny;
    const dNext = (next.x - px) * nx + (next.y - py) * ny;

    if (dCurr >= 0) {
      // Current point is inside
      result.push(curr.clone());
    }

    // Check for edge crossing
    if ((dCurr >= 0 && dNext < 0) || (dCurr < 0 && dNext >= 0)) {
      // Compute intersection
      const t = dCurr / (dCurr - dNext);
      const ix = curr.x + t * (next.x - curr.x);
      const iy = curr.y + t * (next.y - curr.y);
      result.push(new THREE.Vector2(ix, iy));
    }
  }

  return result;
}

// Classify which edge(s) a cell touches based on its vertices
function classifyEdge(vertices: THREE.Vector2[], center: THREE.Vector2, bounds: number): EdgeType {
  const threshold = bounds * 0.85;

  // Check if center is near an edge
  if (center.y > threshold) return 'top';
  if (center.y < -threshold) return 'bottom';
  if (center.x > threshold) return 'right';
  if (center.x < -threshold) return 'left';

  // Check if any vertex touches an edge
  for (const v of vertices) {
    if (Math.abs(v.x - bounds) < 0.01 || Math.abs(v.x + bounds) < 0.01 ||
        Math.abs(v.y - bounds) < 0.01 || Math.abs(v.y + bounds) < 0.01) {
      // Vertex on boundary, classify by center position
      if (Math.abs(center.x) > Math.abs(center.y)) {
        return center.x > 0 ? 'right' : 'left';
      } else {
        return center.y > 0 ? 'top' : 'bottom';
      }
    }
  }

  return 'center';
}

// Get all edges a cell touches (for corner cells that touch multiple edges)
function classifyEdges(vertices: THREE.Vector2[], bounds: number): EdgeType[] {
  const edges: Set<EdgeType> = new Set();
  const threshold = bounds * 0.98;

  for (const v of vertices) {
    if (v.y >= threshold) edges.add('top');
    if (v.y <= -threshold) edges.add('bottom');
    if (v.x >= threshold) edges.add('right');
    if (v.x <= -threshold) edges.add('left');
  }

  if (edges.size === 0) {
    edges.add('center');
  }

  return Array.from(edges);
}

// Check if two cells share an edge (are neighbors)
// Two Voronoi cells are neighbors if they share at least 2 vertices (an edge)
function cellsShareEdge(
  vertices1: THREE.Vector2[],
  vertices2: THREE.Vector2[],
  tolerance: number = 0.001
): boolean {
  let sharedCount = 0;

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      const dx = Math.abs(v1.x - v2.x);
      const dy = Math.abs(v1.y - v2.y);
      if (dx < tolerance && dy < tolerance) {
        sharedCount++;
        if (sharedCount >= 2) {
          return true;
        }
        break; // Move to next v1
      }
    }
  }

  return false;
}

// Find the shared vertices between two cells (the edge where they connect)
// Returns array of shared vertex positions from vertices1
export function findSharedVertices(
  vertices1: THREE.Vector2[],
  vertices2: THREE.Vector2[],
  tolerance: number = 0.001
): THREE.Vector2[] {
  const shared: THREE.Vector2[] = [];

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      const dx = Math.abs(v1.x - v2.x);
      const dy = Math.abs(v1.y - v2.y);
      if (dx < tolerance && dy < tolerance) {
        shared.push(v1.clone());
        break;
      }
    }
  }

  return shared;
}

// Compute neighbors for all cells based on shared edges
function computeNeighbors(cells: { id: number; vertices: THREE.Vector2[] }[]): Map<number, number[]> {
  const neighbors = new Map<number, number[]>();

  for (const cell of cells) {
    neighbors.set(cell.id, []);
  }

  // Compare each pair of cells
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (cellsShareEdge(cells[i].vertices, cells[j].vertices)) {
        neighbors.get(cells[i].id)!.push(cells[j].id);
        neighbors.get(cells[j].id)!.push(cells[i].id);
      }
    }
  }

  return neighbors;
}

// Compute polygon centroid
function computeCentroid(vertices: THREE.Vector2[]): THREE.Vector2 {
  if (vertices.length === 0) return new THREE.Vector2(0, 0);

  let cx = 0;
  let cy = 0;
  let area = 0;

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    area += cross;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }

  area /= 2;
  if (Math.abs(area) < 0.0001) {
    // Fallback to simple average
    const avg = new THREE.Vector2(0, 0);
    for (const v of vertices) {
      avg.add(v);
    }
    return avg.divideScalar(vertices.length);
  }

  cx /= 6 * area;
  cy /= 6 * area;

  return new THREE.Vector2(cx, cy);
}

// Create mesh from polygon vertices (flat version - kept for compatibility)
function createCellMesh(vertices: THREE.Vector2[], peeled: boolean): THREE.Mesh {
  const shape = new THREE.Shape();

  if (vertices.length < 3) {
    // Return a tiny placeholder mesh
    const geo = new THREE.PlaneGeometry(0.01, 0.01);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    return new THREE.Mesh(geo, mat);
  }

  shape.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    shape.lineTo(vertices[i].x, vertices[i].y);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: peeled ? 0xffcc88 : 0xff8833,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

// Project a 2D point onto a rounded cube surface
function projectToRoundedCube(
  u: number,
  v: number,
  sideId: number,
  roundness: number,
  radius: number
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


// Create curved mesh from polygon vertices projected onto rounded cube
// Returns a Group containing the cell mesh and an outline
function createCurvedCellMesh(
  vertices: THREE.Vector2[],
  sideId: number,
  roundness: number,
  radius: number,
  peeled: boolean
): THREE.Mesh {
  if (vertices.length < 3) {
    // Return a tiny placeholder mesh
    const geo = new THREE.PlaneGeometry(0.01, 0.01);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    return new THREE.Mesh(geo, mat);
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Compute centroid
  const centroid = computeCentroid(vertices);

  const centerPos = projectToRoundedCube(centroid.x, centroid.y, sideId, roundness, radius * 1.01);

  // Add center vertex with UV
  positions.push(centerPos.x, centerPos.y, centerPos.z);
  // UV: map from -1..1 to 0..1
  uvs.push((centroid.x + 1) * 0.5, (centroid.y + 1) * 0.5);
  const centerIndex = 0;
  let vertexIndex = 1;

  // Subdivide edges for smoother curves on the sphere
  const subdivisions = 4;
  const allEdgePoints: THREE.Vector2[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    for (let j = 0; j < subdivisions; j++) {
      const t = j / subdivisions;
      allEdgePoints.push(new THREE.Vector2(
        v1.x + t * (v2.x - v1.x),
        v1.y + t * (v2.y - v1.y)
      ));
    }
  }

  // Add all edge vertices with UVs
  const edgeStartIndex = vertexIndex;
  for (const v of allEdgePoints) {
    const pos = projectToRoundedCube(v.x, v.y, sideId, roundness, radius * 1.01);
    positions.push(pos.x, pos.y, pos.z);
    // UV: map from -1..1 to 0..1
    uvs.push((v.x + 1) * 0.5, (v.y + 1) * 0.5);
    vertexIndex++;
  }

  // Create fan triangles from center to edges
  for (let i = 0; i < allEdgePoints.length; i++) {
    const curr = edgeStartIndex + i;
    const next = edgeStartIndex + ((i + 1) % allEdgePoints.length);
    indices.push(centerIndex, curr, next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Get shared textures
  const peelTexture = getPeelTexture();
  const peelNormalMap = getPeelNormalMap();

  const material = new THREE.MeshStandardMaterial({
    color: peeled ? 0xffddaa : 0xffffff,
    map: peelTexture,
    normalMap: peelNormalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    side: THREE.DoubleSide,
    flatShading: false,
    roughness: 0.7,
    metalness: 0.0,
  });

  return new THREE.Mesh(geometry, material);
}

// Generate Voronoi cells for a mandarin side
export function generateVoronoiCells(
  sideId: number,
  cellCount: number = 6,
  bounds: number = 1
): Omit<PeelCell, 'mesh'>[] {
  const sites = generateSites(cellCount, bounds);
  const tempCells: { id: number; vertices: THREE.Vector2[]; center: THREE.Vector2; edge: EdgeType; edges: EdgeType[] }[] = [];

  for (const site of sites) {
    const vertices = computeCell(site, sites, bounds);

    if (vertices.length < 3) continue;

    const center = computeCentroid(vertices);
    const edge = classifyEdge(vertices, center, bounds);
    const edges = classifyEdges(vertices, bounds);

    tempCells.push({
      id: site.id,
      vertices,
      center,
      edge,
      edges,
    });
  }

  // Compute neighbor relationships
  const neighborMap = computeNeighbors(tempCells);

  // Build final cells with neighbor IDs
  const cells: Omit<PeelCell, 'mesh'>[] = tempCells.map(cell => ({
    id: cell.id,
    sideId,
    vertices: cell.vertices,
    center: cell.center,
    peeled: false,
    edge: cell.edge,
    edges: cell.edges,
    neighborIds: neighborMap.get(cell.id) || [],
  }));

  // Ensure we have at least one non-center cell
  // If all are center, make one an edge cell
  const hasEdge = cells.some(c => c.edge !== 'center');
  if (!hasEdge && cells.length > 0) {
    // Find the cell closest to any edge
    let maxDist = 0;
    let edgeCell = cells[0];
    for (const cell of cells) {
      const dist = Math.max(
        Math.abs(cell.center.x),
        Math.abs(cell.center.y)
      );
      if (dist > maxDist) {
        maxDist = dist;
        edgeCell = cell;
      }
    }
    // Assign edge based on position
    if (Math.abs(edgeCell.center.x) > Math.abs(edgeCell.center.y)) {
      edgeCell.edge = edgeCell.center.x > 0 ? 'right' : 'left';
    } else {
      edgeCell.edge = edgeCell.center.y > 0 ? 'top' : 'bottom';
    }
    edgeCell.edges = [edgeCell.edge];
  }

  return cells;
}

// Create Three.js meshes for cells
export function createCellMeshes(cells: Omit<PeelCell, 'mesh'>[]): PeelCell[] {
  return cells.map(cell => ({
    ...cell,
    mesh: createCellMesh(cell.vertices, cell.peeled),
  }));
}

// Update cell mesh color when peeled
export function updateCellVisual(cell: PeelCell): void {
  const material = cell.mesh.material as THREE.MeshStandardMaterial;
  if (cell.peeled) {
    // Show inner body texture (darker orange flesh)
    material.map = getBodyTexture();
    material.color.setHex(0xffffff);
    material.needsUpdate = true;
  } else {
    // Show outer peel texture (bright orange)
    material.map = getPeelTexture();
    material.color.setHex(0xffffff);
    material.needsUpdate = true;
  }
}

// Create Three.js meshes for cells on curved surface
export function createCellMeshesForCurvedSurface(
  cells: Omit<PeelCell, 'mesh'>[],
  sideId: number,
  roundness: number,
  radius: number
): PeelCell[] {
  return cells.map(cell => ({
    ...cell,
    mesh: createCurvedCellMesh(cell.vertices, sideId, roundness, radius, cell.peeled),
  }));
}
