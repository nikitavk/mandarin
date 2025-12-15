# Peel Strip Implementation

## Overview

The peel strip is a single continuous mesh that grows as cells are peeled. Each new cell connects to the **previous cell only** via shared vertices. The strip follows the player's cursor and dangles with physics.

## Architecture

### Single Continuous Mesh

Instead of separate meshes per cell, the strip uses one `BufferGeometry` with:
- Pre-allocated `Float32Array` for positions (500 vertices max)
- Pre-allocated `Uint16Array` for triangle indices (2000 max)
- Dynamic draw range that grows as cells are added

### Connection Strategy

Each cell connects to the **previous cell only** (not to any random earlier cell):
- Find **2 ADJACENT vertices** (one shared edge) between consecutive cells
- Use distance-based matching with `MATCH_TOLERANCE = 0.15`
- Adjacent vertex requirement ensures we connect via a proper polygon edge
- If no natural match exists, force a connection to the closest vertex

### Cursor-Following Physics

The strip follows the player's finger/cursor:
- The **pinned vertices** (shared edge with previous cell) move to cursor position
- All other vertices dangle freely with gravity
- Creates a "dragging a ribbon" effect

## Data Structures

```typescript
interface PhysicsVertex {
  position: THREE.Vector3;        // Current position (mutated by physics)
  previousPosition: THREE.Vector3; // For verlet integration
  pinned: boolean;                // If true, follows cursor
}

interface Constraint {
  a: number;      // Vertex index
  b: number;      // Vertex index
  restLength: number;  // Target distance
}

// Tracks previous cell's perimeter for connection
interface PrevCellVertex {
  index: number;           // Index in vertex buffer
  surfacePos: THREE.Vector3;  // Original 3D position on surface
}

class PeelStrip {
  // Geometry
  private geometry: THREE.BufferGeometry;
  private mesh: THREE.Mesh;
  private positions: Float32Array;
  private indices: Uint16Array;
  private vertexCount: number;
  private indexCount: number;

  // Connection tracking - ONLY previous cell's perimeter
  private prevCellPerimeter: PrevCellVertex[];

  // Physics
  private physicsVertices: PhysicsVertex[];
  private constraints: Constraint[];
  private constraintSet: Set<string>;  // Prevent duplicate constraints
  private pinnedIndices: Set<number>;  // Currently pinned vertices
  private gravity: THREE.Vector3;

  // Cursor tracking
  private cursorPosition: THREE.Vector3;
  private hasCursorPosition: boolean;
}
```

## Algorithm: Adding a Cell

### Step 1: Project to 3D

```typescript
addSegment(cell: PeelCell): void {
  const isFirstCell = this.vertexCount === 0;

  // Project cell's 2D UV vertices to 3D world space
  // Uses RADIUS * 1.08 to lift strip slightly above mandarin surface
  const surfacePositions = cell.vertices.map(v =>
    projectToRoundedCube(v.x, v.y, cell.sideId, ROUNDNESS, RADIUS * 1.08)
  );

  // Compute 3D center
  const surfaceCenter = average(surfacePositions);
```

### Step 2: Find ALL Potential Matches

```typescript
  // Find all vertices within MATCH_TOLERANCE of previous cell's perimeter
  const allMatches: { localIdx: number; prevIdx: number; dist: number }[] = [];

  for (let i = 0; i < surfacePositions.length; i++) {
    for (let j = 0; j < prevCellPerimeter.length; j++) {
      const dist = surfacePositions[i].distanceTo(prevCellPerimeter[j].surfacePos);
      if (dist < MATCH_TOLERANCE) {
        allMatches.push({ localIdx: i, prevIdx: j, dist });
      }
    }
  }

  // Sort by distance (closest first)
  allMatches.sort((a, b) => a.dist - b.dist);
```

### Step 3: Select Adjacent Matches (Key Innovation)

The critical insight: we want 2 vertices that form an **edge** on the new cell polygon, not just any 2 vertices that happen to match.

```typescript
  // First pass: select the single best (closest) match
  const selectedMatches = [];
  const usedLocalIndices = new Set();
  const usedPrevIndices = new Set();

  for (const match of allMatches) {
    if (usedLocalIndices.has(match.localIdx) || usedPrevIndices.has(match.prevIdx)) continue;
    selectedMatches.push(match);
    usedLocalIndices.add(match.localIdx);
    usedPrevIndices.add(match.prevIdx);
    break; // Only one in first pass
  }

  // Second pass: find an ADJACENT vertex to form an edge
  if (selectedMatches.length === 1) {
    const firstMatch = selectedMatches[0];
    const n = surfacePositions.length;

    // Adjacent indices on the polygon (wrapping around)
    const adjLocalIndices = [
      (firstMatch.localIdx + 1) % n,
      (firstMatch.localIdx - 1 + n) % n
    ];

    // Look for a match with an adjacent local index
    for (const match of allMatches) {
      if (usedLocalIndices.has(match.localIdx) || usedPrevIndices.has(match.prevIdx)) continue;
      if (adjLocalIndices.includes(match.localIdx)) {
        selectedMatches.push(match);
        break;
      }
    }
  }
```

### Step 4: Build Vertex Indices

```typescript
  const vertexIndices: number[] = [];
  const matchedIndices: number[] = [];

  for (let i = 0; i < surfacePositions.length; i++) {
    const matchInfo = selectedMatches.find(m => m.localIdx === i);

    if (matchInfo) {
      // REUSE existing vertex from previous cell - this creates the connection!
      const prevVertex = prevCellPerimeter[matchInfo.prevIdx];
      vertexIndices.push(prevVertex.index);
      matchedIndices.push(prevVertex.index);
    } else {
      // Create new vertex
      vertexIndices.push(addVertex(surfacePositions[i]));
    }
  }

  // Remove matched vertices from perimeter (they're now internal)
  // Done in reverse order to preserve indices
```

### Step 5: Force Connection (if needed)

```typescript
  // If not first cell and no matches found, force a connection
  if (!isFirstCell && matchedIndices.length === 0 && prevCellPerimeter.length > 0) {
    // Find closest pair between new cell and prev perimeter
    // Replace new vertex with prev vertex to create artificial connection
    console.log(`Forced connection at distance ${bestDist}`);
  }
```

### Step 6: Create Geometry

```typescript
  // Add center vertex (always new)
  const centerIndex = addVertex(surfaceCenter);

  // Create triangles using fan triangulation from center
  for (let i = 0; i < vertexIndices.length; i++) {
    addTriangle(centerIndex, vertexIndices[i], vertexIndices[(i+1) % n]);
  }
```

### Step 7: Add Physics Constraints

```typescript
  // Perimeter edge constraints (maintain cell shape)
  for (let i = 0; i < vertexIndices.length; i++) {
    addConstraint(vertexIndices[i], vertexIndices[(i+1) % n]);
  }

  // Center-to-vertex constraints (maintain cell rigidity)
  for (const idx of vertexIndices) {
    addConstraint(centerIndex, idx);
  }
```

### Step 8: Update Pinning

```typescript
  // Unpin ALL previous vertices (they now dangle)
  for (const pv of physicsVertices) {
    pv.pinned = false;
  }
  pinnedIndices.clear();

  // Pin only the matched vertices (connection to previous cell)
  // These will follow the cursor
  if (matchedIndices.length > 0) {
    for (const idx of matchedIndices) {
      physicsVertices[idx].pinned = true;
      pinnedIndices.add(idx);
    }
  } else if (isFirstCell) {
    // First cell: pin first two vertices
    physicsVertices[vertexIndices[0]].pinned = true;
    physicsVertices[vertexIndices[1]].pinned = true;
  }
```

### Step 9: Update Perimeter for Next Cell

```typescript
  // New perimeter = all NON-matched vertices from this cell + center
  prevCellPerimeter = [];
  for (let i = 0; i < surfacePositions.length; i++) {
    if (!matchedLocalIndices.includes(i)) {
      prevCellPerimeter.push({
        index: vertexIndices[i],
        surfacePos: surfacePositions[i]
      });
    }
  }
  // Also add center (cells might connect through centers)
  prevCellPerimeter.push({ index: centerIndex, surfacePos: surfaceCenter });
}
```

## Physics System

### Cursor Following

```typescript
update(deltaTime: number): void {
  // Move pinned vertices to cursor position
  if (this.hasCursorPosition) {
    for (const idx of this.pinnedIndices) {
      const pv = this.physicsVertices[idx];
      pv.previousPosition.copy(pv.position);
      pv.position.copy(this.cursorPosition);
    }
  }

  // Verlet integration for unpinned vertices
  const damping = 0.98;
  const dt = Math.min(deltaTime, 0.033);

  for (const pv of physicsVertices) {
    if (pv.pinned) continue;

    const velocity = pv.position.clone().sub(pv.previousPosition);
    pv.previousPosition.copy(pv.position);

    pv.position.add(velocity.multiplyScalar(damping));
    pv.position.add(gravity.clone().multiplyScalar(dt * dt));
  }

  // Solve constraints (3 iterations for stability)
  for (let i = 0; i < 3; i++) {
    solveConstraints();
  }

  syncGeometryFromPhysics();
}
```

### Distance Constraints

```typescript
solveConstraints(): void {
  for (const c of constraints) {
    const pvA = physicsVertices[c.a];
    const pvB = physicsVertices[c.b];

    const delta = pvB.position.clone().sub(pvA.position);
    const currentLength = delta.length();
    if (currentLength < 0.0001) continue;

    const diff = (currentLength - c.restLength) / currentLength;

    if (!pvA.pinned && !pvB.pinned) {
      // Both free - split correction equally
      const correction = delta.multiplyScalar(0.5 * diff);
      pvA.position.add(correction);
      pvB.position.sub(correction);
    } else if (!pvA.pinned) {
      // Only A moves
      pvA.position.add(delta.multiplyScalar(diff));
    } else if (!pvB.pinned) {
      // Only B moves
      pvB.position.sub(delta.multiplyScalar(diff));
    }
    // If both pinned, no correction needed
  }
}
```

### Pinning Strategy

- **First cell**: Pin first 2 vertices (one edge)
- **Subsequent cells**:
  - Unpin ALL previously pinned vertices
  - Pin only the matched vertices (shared with previous cell)
- **Effect**: Only the newest connection follows cursor, everything else dangles

### Camera-Relative Gravity

Gravity direction is computed from the camera's orientation so the strip always hangs "down" on screen:

```typescript
setGravityFromCamera(camera: THREE.Camera): void {
  const strength = 20.0;
  const down = new THREE.Vector3(0, -1, 0);
  down.applyQuaternion(camera.quaternion);
  this.gravity.copy(down).multiplyScalar(strength);
}
```

## Constants

```typescript
const ROUNDNESS = 0.9;          // Cube-to-sphere blend for mandarin shape
const RADIUS = 1.0;             // Mandarin radius (strip uses 1.08x for lift)
const MATCH_TOLERANCE = 0.15;   // Distance for vertex matching in 3D space
const MAX_VERTICES = 500;       // Pre-allocated buffer size
const MAX_INDICES = 2000;       // Pre-allocated buffer size
```

## Why Adjacent Vertex Matching?

The key problem we solved: when finding matches between cells, a single vertex from the new cell might match multiple vertices from the previous cell's perimeter (e.g., both an edge vertex and the center).

Example problematic log:
```
All matches: [L0→P2:0.0000, L0→P1:0.0103]
Selected: [L0→P2]
Found 2 potential matches, selected 1
```

Both matches have the same `localIdx` (L0), so we can only select one. The solution is to:
1. Select the best match first
2. Then specifically look for a match with an **adjacent** local index (forming an actual edge on the polygon)

This ensures cells connect via proper shared edges, not random vertices.

## Integration with Game

```typescript
// In game.ts

// On game start
this.peelStrip = new PeelStrip(this.scene);
this.peelStrip.setGravityFromCamera(this.camera);

// When a cell is peeled
this.peelStrip.addSegment(cell, cell.mesh, worldPosition);

// During touch/drag - update cursor position
this.peelStrip.updatePeelPosition(intersectionPoint);

// Each frame in animate loop
this.peelStrip.update(deltaTime);

// After camera rotation completes
this.peelStrip.setGravityFromCamera(this.camera);

// On game reset
this.peelStrip.reset();
```

## Key Behaviors

1. **Strip follows cursor**: Pinned vertices move to where player is touching
2. **Chain of cells**: Each cell connects only to previous cell via 2 adjacent vertices (1 edge)
3. **Gravity pulls down**: Rest of strip dangles below cursor (camera-relative)
4. **Continuous across sides**: Force connection if cells don't naturally share vertices
5. **Verlet physics**: Simple, stable simulation with distance constraints

## Debug Logging

The implementation logs useful info to console:
- `All matches: [L0→P1:0.0000, L3→P2:0.0000]` - All potential vertex matches (LocalIdx→PrevIdx:distance)
- `Selected: [L0→P1, L3→P2]` - Which matches were selected (should be adjacent local indices)
- `Found X potential matches, selected Y` - Summary
- `Cell added: 2 matched, 3 new, vertexCount: 45` - Cell connection stats
- `Strip state: 45 vertices, 2 pinned, 144 indices` - Overall strip state
- `Forced connection at distance 0.764` - When artificial connection is needed

## Files

- `src/peelStrip.ts` - Main implementation
- `src/game.ts` - Integration (peelCell, handleTouch, animate)
- `src/mandarin.ts` - projectToRoundedCube function
