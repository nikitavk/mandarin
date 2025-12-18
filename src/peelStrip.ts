import * as THREE from 'three';
import { PeelCell } from './types';
import { projectToRoundedCube } from './mandarin';
import { getPeelTexture } from './textures';

// ============================================================================
// Peel Strip - Single Continuous Mesh with Physics
// ============================================================================
// Creates a physically connected mesh where each cell connects ONLY to the
// previous cell. If no natural connection exists, we create one artificially.
// Uses verlet integration for dangling physics.

const ROUNDNESS = 0.9;
const RADIUS = 1.0;
const MATCH_TOLERANCE = 0.15;  // Distance tolerance for vertex matching

const MAX_VERTICES = 500;
const MAX_INDICES = 2000;

// ============================================================================
// Types
// ============================================================================

interface PhysicsVertex {
  position: THREE.Vector3;
  previousPosition: THREE.Vector3;
  pinned: boolean;
}

interface Constraint {
  a: number;
  b: number;
  restLength: number;
}

// Tracks a vertex from the previous cell's perimeter
interface PrevCellVertex {
  index: number;           // Index in the vertex buffer
  surfacePos: THREE.Vector3;  // Original 3D position on surface
}

// ============================================================================
// Helper Functions
// ============================================================================

function get3DPosition(uv: THREE.Vector2, sideId: number): THREE.Vector3 {
  // Use a larger radius to lift the strip above the mandarin surface
  return projectToRoundedCube(uv.x, uv.y, sideId, ROUNDNESS, RADIUS * 1.08);
}

// ============================================================================
// PeelStrip Class
// ============================================================================

export class PeelStrip {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;

  // Vertex data
  private positions: Float32Array;
  private indices: Uint16Array;
  private vertexCount: number = 0;
  private indexCount: number = 0;

  // Track ONLY the previous cell's perimeter vertices
  private prevCellPerimeter: PrevCellVertex[] = [];

  // Physics
  private physicsVertices: PhysicsVertex[] = [];
  private constraints: Constraint[] = [];
  private constraintSet: Set<string> = new Set();
  private pinnedIndices: Set<number> = new Set();

  // Gravity - strong pull downward
  private gravity: THREE.Vector3 = new THREE.Vector3(0, -1, 0);

  // Cursor position for pinning
  private cursorPosition: THREE.Vector3 = new THREE.Vector3();
  private hasCursorPosition: boolean = false;

  // Fun physics
  private time: number = 0;

  // Reusable vectors to avoid allocations in hot paths
  private tempVec1 = new THREE.Vector3();
  private tempVec2 = new THREE.Vector3();
  private tempVelocity = new THREE.Vector3();

  // Flag to track when normals need recomputation
  private needsNormalUpdate = false;

  // Orbit animation state
  private isOrbiting: boolean = false;
  private orbitAngle: number = 0;
  private orbitSpeed: number = 2.0; // radians per second
  private orbitRadius: number = 2.5;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(MAX_VERTICES * 3);
    this.indices = new Uint16Array(MAX_INDICES);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setDrawRange(0, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: getPeelTexture(),
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.name = 'peel-strip';
    this.scene.add(this.mesh);
  }

  setCamera(_camera: THREE.Camera): void {}
  setGravityForSide(_sideId: number): void {}

  // Update cursor position - the strip will be pinned to this point
  updatePeelPosition(position: THREE.Vector3): void {
    this.cursorPosition.copy(position);
    this.hasCursorPosition = true;
  }

  setGravityFromCamera(camera: THREE.Camera): void {
    const strength = 20.0;

    // Down in camera space
    const down = new THREE.Vector3(0, -1, 0);
    down.applyQuaternion(camera.quaternion);

    // Towards camera (negative Z in camera space = towards viewer)
    const towardsPlayer = new THREE.Vector3(0, 0, -1);
    towardsPlayer.applyQuaternion(camera.quaternion);

    // Mix: 70% down, 30% towards player
    this.gravity.set(0, 0, 0);
    this.gravity.addScaledVector(down, 0.7);
    this.gravity.addScaledVector(towardsPlayer, 0.3);
    this.gravity.normalize().multiplyScalar(strength);
  }

  // ============================================================================
  // Add a new cell segment
  // ============================================================================

  addSegment(cell: PeelCell, _cellMesh: THREE.Mesh, _worldPosition: THREE.Vector3): void {
    const sideId = cell.sideId;
    const isFirstCell = this.vertexCount === 0;

    // 1. Get surface positions for this cell's vertices
    const surfacePositions = cell.vertices.map(v => get3DPosition(v, sideId));

    // 2. Compute surface center
    const surfaceCenter = new THREE.Vector3();
    for (const v of surfacePositions) surfaceCenter.add(v);
    surfaceCenter.divideScalar(surfacePositions.length);

    // 3. Find matches with ONLY the previous cell's perimeter
    // We want to match 2 ADJACENT vertices (one edge) for stable connection

    const vertexIndices: number[] = [];
    const matchedIndices: number[] = [];   // Indices that were reused from prev cell
    const matchedLocalIndices: number[] = []; // Local indices (0..n-1) that matched
    const newLocalIndices: number[] = [];  // Local indices that are new

    // First pass: find ALL potential matches (not limited yet)
    const allMatches: { localIdx: number; prevIdx: number; dist: number }[] = [];

    for (let i = 0; i < surfacePositions.length; i++) {
      const surfacePos = surfacePositions[i];
      for (let j = 0; j < this.prevCellPerimeter.length; j++) {
        const prev = this.prevCellPerimeter[j];
        const dist = surfacePos.distanceTo(prev.surfacePos);
        if (dist < MATCH_TOLERANCE) {
          allMatches.push({ localIdx: i, prevIdx: j, dist });
        }
      }
    }

    // Sort by distance (closest first)
    allMatches.sort((a, b) => a.dist - b.dist);

    // Track which local indices and prev indices we've used
    const usedLocalIndices = new Set<number>();
    const usedPrevIndices = new Set<number>();
    const selectedMatches: { localIdx: number; prevIdx: number }[] = [];

    // Try to find a PAIR of adjacent matches first (shared edge = 2 connected vertices)
    // This creates a much more stable connection between cells
    const n = surfacePositions.length;
    const prevN = this.prevCellPerimeter.length;

    let bestEdgePair: { m1: typeof allMatches[0]; m2: typeof allMatches[0] } | null = null;
    let bestEdgeDist = Infinity;

    for (let i = 0; i < allMatches.length; i++) {
      const m1 = allMatches[i];
      for (let j = i + 1; j < allMatches.length; j++) {
        const m2 = allMatches[j];

        // Check if both local indices are adjacent (form an edge on new cell)
        const localAdj =
          (m1.localIdx + 1) % n === m2.localIdx ||
          (m2.localIdx + 1) % n === m1.localIdx;

        // Check if both prev indices are adjacent (form an edge on prev cell perimeter)
        const prevAdj =
          (m1.prevIdx + 1) % prevN === m2.prevIdx ||
          (m2.prevIdx + 1) % prevN === m1.prevIdx ||
          Math.abs(m1.prevIdx - m2.prevIdx) === 1; // Also allow simple adjacency

        if (localAdj && prevAdj) {
          const totalDist = m1.dist + m2.dist;
          if (totalDist < bestEdgeDist) {
            bestEdgeDist = totalDist;
            bestEdgePair = { m1, m2 };
          }
        }
      }
    }

    // If we found an adjacent pair, use it
    if (bestEdgePair) {
      selectedMatches.push(bestEdgePair.m1);
      selectedMatches.push(bestEdgePair.m2);
      usedLocalIndices.add(bestEdgePair.m1.localIdx);
      usedLocalIndices.add(bestEdgePair.m2.localIdx);
      usedPrevIndices.add(bestEdgePair.m1.prevIdx);
      usedPrevIndices.add(bestEdgePair.m2.prevIdx);
    } else {
      // Fallback: select the single best match
      for (const match of allMatches) {
        if (usedLocalIndices.has(match.localIdx) || usedPrevIndices.has(match.prevIdx)) continue;
        selectedMatches.push(match);
        usedLocalIndices.add(match.localIdx);
        usedPrevIndices.add(match.prevIdx);
        break;
      }

      // Second pass: try to find an adjacent vertex to form an edge
      if (selectedMatches.length === 1 && allMatches.length > 1) {
        const firstMatch = selectedMatches[0];

        // Adjacent local indices to the first match
        const adjLocalIndices = [
          (firstMatch.localIdx + 1) % n,
          (firstMatch.localIdx - 1 + n) % n
        ];

        // Find a match with an adjacent local index
        for (const match of allMatches) {
          if (usedLocalIndices.has(match.localIdx) || usedPrevIndices.has(match.prevIdx)) continue;
          if (adjLocalIndices.includes(match.localIdx)) {
            selectedMatches.push(match);
            usedLocalIndices.add(match.localIdx);
            usedPrevIndices.add(match.prevIdx);
            break;
          }
        }
      }
    }

    // Now build vertex indices, reusing matched vertices
    for (let i = 0; i < surfacePositions.length; i++) {
      const surfacePos = surfacePositions[i];
      const matchInfo = selectedMatches.find(m => m.localIdx === i);

      if (matchInfo) {
        // Reuse existing vertex from previous cell
        const prevVertex = this.prevCellPerimeter[matchInfo.prevIdx];
        vertexIndices.push(prevVertex.index);
        matchedIndices.push(prevVertex.index);
        matchedLocalIndices.push(i);
      } else {
        // Create new vertex
        const newIndex = this.addVertex(surfacePos.clone());
        vertexIndices.push(newIndex);
        newLocalIndices.push(i);
      }
    }

    // Remove matched vertices from prev perimeter (in reverse order to not mess up indices)
    const prevIndicesToRemove = selectedMatches.map(m => m.prevIdx).sort((a, b) => b - a);
    for (const idx of prevIndicesToRemove) {
      this.prevCellPerimeter.splice(idx, 1);
    }

    // 4. If this is NOT the first cell and we have NO matches, force a connection
    if (!isFirstCell && matchedIndices.length === 0 && this.prevCellPerimeter.length > 0) {
      // Find the closest pair: one vertex from new cell, one from prev cell
      let bestDist = Infinity;
      let bestNewLocalIdx = 0;
      let bestPrevIdx = 0;

      for (let i = 0; i < surfacePositions.length; i++) {
        for (let j = 0; j < this.prevCellPerimeter.length; j++) {
          const dist = surfacePositions[i].distanceTo(this.prevCellPerimeter[j].surfacePos);
          if (dist < bestDist) {
            bestDist = dist;
            bestNewLocalIdx = i;
            bestPrevIdx = j;
          }
        }
      }

      // Force connection: replace the new vertex with the prev cell's vertex
      const prevVertex = this.prevCellPerimeter[bestPrevIdx];
      const oldNewIndex = vertexIndices[bestNewLocalIdx];

      // Update the vertex index to use the prev cell's vertex
      vertexIndices[bestNewLocalIdx] = prevVertex.index;
      matchedIndices.push(prevVertex.index);

      // Remove from newLocalIndices and add to matchedLocalIndices
      const idx = newLocalIndices.indexOf(bestNewLocalIdx);
      if (idx !== -1) newLocalIndices.splice(idx, 1);
      matchedLocalIndices.push(bestNewLocalIdx);

      // Move the new vertex position to match the connection point
      // (The vertex was already created, but we're not using it - it becomes orphaned)
      // Actually, we need to update the physics vertex position
      if (this.physicsVertices[oldNewIndex]) {
        // Move unused vertex to the connection point so constraints work
        this.physicsVertices[oldNewIndex].position.copy(prevVertex.surfacePos);
        this.physicsVertices[oldNewIndex].previousPosition.copy(prevVertex.surfacePos);
      }

      // Remove from prev perimeter
      this.prevCellPerimeter.splice(bestPrevIdx, 1);
    }

    // 5. Add center vertex (always new)
    const centerIndex = this.addVertex(surfaceCenter.clone());

    // 6. Create triangles (fan from center)
    for (let i = 0; i < surfacePositions.length; i++) {
      const curr = vertexIndices[i];
      const next = vertexIndices[(i + 1) % surfacePositions.length];
      this.addTriangle(centerIndex, curr, next);
    }

    // 7. Add constraints for this cell
    // Perimeter constraints
    for (let i = 0; i < vertexIndices.length; i++) {
      const a = vertexIndices[i];
      const b = vertexIndices[(i + 1) % vertexIndices.length];
      this.addConstraint(a, b, surfacePositions[i], surfacePositions[(i + 1) % surfacePositions.length]);
    }
    // Center-to-vertex constraints
    for (let i = 0; i < vertexIndices.length; i++) {
      this.addConstraint(centerIndex, vertexIndices[i], surfaceCenter, surfacePositions[i]);
    }

    // 8. Pin the newest cell's connection point (will follow cursor)
    // Unpin all previous
    for (const pv of this.physicsVertices) {
      pv.pinned = false;
    }
    this.pinnedIndices.clear();

    // Pin the matched vertices (connection to previous) or first two vertices for first cell
    if (matchedIndices.length > 0) {
      for (const idx of matchedIndices) {
        this.physicsVertices[idx].pinned = true;
        this.pinnedIndices.add(idx);
      }
    } else if (isFirstCell && vertexIndices.length >= 2) {
      this.physicsVertices[vertexIndices[0]].pinned = true;
      this.physicsVertices[vertexIndices[1]].pinned = true;
      this.pinnedIndices.add(vertexIndices[0]);
      this.pinnedIndices.add(vertexIndices[1]);
    }

    // 9. Update prev cell perimeter for next cell
    // The new perimeter consists of all NON-matched vertices from this cell
    this.prevCellPerimeter = [];
    for (let i = 0; i < surfacePositions.length; i++) {
      if (!matchedLocalIndices.includes(i)) {
        this.prevCellPerimeter.push({
          index: vertexIndices[i],
          surfacePos: surfacePositions[i].clone()
        });
      }
    }
    // Also add center to perimeter (cells might connect through centers)
    this.prevCellPerimeter.push({
      index: centerIndex,
      surfacePos: surfaceCenter.clone()
    });

    // 10. Update geometry
    this.updateGeometry();
  }

  // ============================================================================
  // Vertex Management
  // ============================================================================

  private addVertex(position: THREE.Vector3): number {
    const index = this.vertexCount;
    const offset = index * 3;

    this.positions[offset] = position.x;
    this.positions[offset + 1] = position.y;
    this.positions[offset + 2] = position.z;

    this.physicsVertices.push({
      position: position.clone(),
      previousPosition: position.clone(),
      pinned: true,
    });

    this.vertexCount++;
    return index;
  }

  private addTriangle(a: number, b: number, c: number): void {
    const offset = this.indexCount;
    this.indices[offset] = a;
    this.indices[offset + 1] = b;
    this.indices[offset + 2] = c;
    this.indexCount += 3;
  }

  private addConstraint(a: number, b: number, posA: THREE.Vector3, posB: THREE.Vector3): void {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (this.constraintSet.has(key)) return;
    this.constraintSet.add(key);

    const restLength = posA.distanceTo(posB);
    this.constraints.push({ a, b, restLength });
  }

  // ============================================================================
  // Physics Update
  // ============================================================================

  update(deltaTime: number): void {
    if (this.vertexCount === 0) return;

    const damping = 0.92; // Less damping = more bouncy
    const dt = Math.min(deltaTime, 0.033);
    this.time += dt;

    // Handle orbit animation if active
    if (this.isOrbiting) {
      this.updateOrbit(dt);
      this.syncGeometryFromPhysics();
      return;
    }

    // Move pinned vertices to cursor position
    if (this.hasCursorPosition) {
      for (const idx of this.pinnedIndices) {
        const pv = this.physicsVertices[idx];
        if (pv) {
          pv.previousPosition.copy(pv.position);
          pv.position.copy(this.cursorPosition);
        }
      }
    }

    // Verlet integration for unpinned vertices
    for (let i = 0; i < this.physicsVertices.length; i++) {
      const pv = this.physicsVertices[i];
      if (pv.pinned) continue;

      // Reuse tempVelocity instead of cloning
      this.tempVelocity.copy(pv.position).sub(pv.previousPosition);
      pv.previousPosition.copy(pv.position);

      pv.position.add(this.tempVelocity.multiplyScalar(damping));
      // Reuse tempVec1 for gravity calculation
      this.tempVec1.copy(this.gravity).multiplyScalar(dt * dt);
      pv.position.add(this.tempVec1);
      // Wind flutter removed for mobile performance
    }

    // Solve constraints - 1 iteration for performance (still stable enough)
    const iterations = 1;
    for (let iter = 0; iter < iterations; iter++) {
      this.solveConstraints();
    }

    this.syncGeometryFromPhysics();
  }

  private solveConstraints(): void {
    for (const c of this.constraints) {
      const pvA = this.physicsVertices[c.a];
      const pvB = this.physicsVertices[c.b];

      // Reuse tempVec2 instead of cloning
      this.tempVec2.copy(pvB.position).sub(pvA.position);
      const currentLength = this.tempVec2.length();

      if (currentLength < 0.0001) continue;

      const diff = (currentLength - c.restLength) / currentLength;

      if (!pvA.pinned && !pvB.pinned) {
        this.tempVec2.multiplyScalar(0.5 * diff);
        pvA.position.add(this.tempVec2);
        pvB.position.sub(this.tempVec2);
      } else if (!pvA.pinned) {
        pvA.position.add(this.tempVec2.multiplyScalar(diff));
      } else if (!pvB.pinned) {
        pvB.position.sub(this.tempVec2.multiplyScalar(diff));
      }
    }
  }

  private syncGeometryFromPhysics(): void {
    for (let i = 0; i < this.physicsVertices.length; i++) {
      const pv = this.physicsVertices[i];
      const offset = i * 3;
      this.positions[offset] = pv.position.x;
      this.positions[offset + 1] = pv.position.y;
      this.positions[offset + 2] = pv.position.z;
    }

    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    // Only recompute normals when geometry topology changed (new cells added)
    if (this.needsNormalUpdate) {
      this.geometry.computeVertexNormals();
      this.needsNormalUpdate = false;
    }
  }

  private updateGeometry(): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;

    const indexAttr = this.geometry.getIndex() as THREE.BufferAttribute;
    indexAttr.needsUpdate = true;

    this.geometry.setDrawRange(0, this.indexCount);
    // Set flag to recompute normals on next sync (topology changed)
    this.needsNormalUpdate = true;
    this.geometry.computeVertexNormals();
  }

  // ============================================================================
  // Reset and Cleanup
  // ============================================================================

  reset(): void {
    this.vertexCount = 0;
    this.indexCount = 0;
    this.positions.fill(0);
    this.indices.fill(0);

    this.prevCellPerimeter = [];
    this.physicsVertices = [];
    this.constraints = [];
    this.constraintSet.clear();
    this.pinnedIndices.clear();

    this.geometry.setDrawRange(0, 0);
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    const indexAttr = this.geometry.getIndex() as THREE.BufferAttribute;
    indexAttr.needsUpdate = true;
  }

  dispose(): void {
    this.reset();
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  getSegmentCount(): number {
    return Math.floor(this.indexCount / 15);
  }

  // ============================================================================
  // Orbit Animation (Victory Effect)
  // ============================================================================

  startOrbit(): void {
    if (this.vertexCount === 0) return;

    this.isOrbiting = true;
    this.orbitAngle = 0;

    // Unpin all vertices so the whole strip can move freely
    for (const pv of this.physicsVertices) {
      pv.pinned = false;
    }
    this.pinnedIndices.clear();

    // Calculate center of mass for the strip
    const centerOfMass = new THREE.Vector3();
    for (const pv of this.physicsVertices) {
      centerOfMass.add(pv.position);
    }
    centerOfMass.divideScalar(this.physicsVertices.length);

    // Set orbit radius based on current distance from center
    this.orbitRadius = Math.max(centerOfMass.length(), 2.0);

    // Reduce gravity for floaty orbit effect
    this.gravity.set(0, 0, 0);
  }

  private updateOrbit(deltaTime: number): void {
    if (!this.isOrbiting || this.vertexCount === 0) return;

    // Advance orbit angle
    this.orbitAngle += this.orbitSpeed * deltaTime;

    // Calculate orbit position (circular path around Y axis)
    const orbitX = Math.sin(this.orbitAngle) * this.orbitRadius;
    const orbitZ = Math.cos(this.orbitAngle) * this.orbitRadius;
    const orbitY = Math.sin(this.orbitAngle * 0.5) * 0.5; // Slight vertical bobbing

    // Calculate current center of mass
    const currentCenter = new THREE.Vector3();
    for (const pv of this.physicsVertices) {
      currentCenter.add(pv.position);
    }
    currentCenter.divideScalar(this.physicsVertices.length);

    // Target position for the center of mass
    const targetCenter = new THREE.Vector3(orbitX, orbitY, orbitZ);

    // Move all vertices towards the orbit path
    const displacement = targetCenter.clone().sub(currentCenter);
    const moveSpeed = 3.0 * deltaTime;

    for (const pv of this.physicsVertices) {
      // Smoothly move towards orbit path
      pv.position.add(displacement.clone().multiplyScalar(moveSpeed));

      // Add some rotation/tumbling effect
      const tumbleX = Math.sin(this.orbitAngle * 2 + pv.position.x) * 0.02;
      const tumbleY = Math.cos(this.orbitAngle * 1.5 + pv.position.z) * 0.02;
      pv.position.x += tumbleY;
      pv.position.y += tumbleX;
    }
  }
}
