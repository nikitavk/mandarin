# Mandarin Peeling Game - Technical Documentation

## Overview

A Christmas/New Year themed casual web game where players peel a mandarin by swiping across its surface in one continuous touch. Built with Three.js and TypeScript, deployed as a Telegram Mini App and LINE Mini App.

**Live:** Deployed via GitHub Pages

---

## Architecture

### File Structure

```
src/
  main.ts           # Entry point, initializes after LINE SDK loads
  game.ts           # Main Game class (~1500 lines), orchestrates everything
  types.ts          # TypeScript type definitions
  mandarin.ts       # Creates 3D mandarin geometry with Voronoi cells
  voronoi.ts        # Voronoi cell generation (~700 lines)
  peelStrip.ts      # Physics-based animated peel strip (~640 lines)
  input.ts          # Touch/mouse input handling with optimizations
  textures.ts       # Procedural texture generation (FBM, cellular noise)
  christmasEmoji.ts # CSS-animated falling emoji background
  telegram.ts       # Telegram Mini App integration
  line.ts           # LINE Mini App integration
  i18n.ts           # Internationalization (5+ languages)
```

### Tech Stack

- **Three.js 0.182.0** - 3D rendering
- **TypeScript 5.9.3** - Strict mode with `noUnusedLocals`/`noUnusedParameters`
- **Vite 7.2.7** - Build tool with manual Three.js chunking
- **@line/liff** - LINE Mini App SDK

---

## Core Game Mechanics

### Game Flow

```
TITLE → PLAYING → GAME_OVER | WIN → TITLE
```

1. Game starts with finger down on first piece
2. Drag across pieces to peel them (cells must be neighbors)
3. Peel all cells on current side
4. Last cell's edge determines next side transition
5. Camera rotates to next side (300ms, ease-out)
6. Repeat until all 6 sides peeled → WIN
7. Lift finger at any point → GAME OVER

### Key Rules

- **Single continuous touch** required for entire game
- **Cell connectivity**: Can only peel cells adjacent to the last peeled cell
- **Edge cells**: Determine rotation direction when side is complete
- **Center cell rule**: Ending on a center cell → GAME OVER
- **Path validation**: DFS validates that remaining sides can be completed

### Data Types

```typescript
type EdgeType = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface PeelCell {
  id: number;
  sideId: number;
  vertices: THREE.Vector2[];    // Voronoi polygon points (2D UV)
  center: THREE.Vector2;        // Cell center
  mesh: THREE.Mesh;
  peeled: boolean;
  edge: EdgeType;               // Primary edge classification
  edges: EdgeType[];            // All edges cell touches (corners touch 2)
  neighborIds: number[];        // Adjacent cell IDs for connectivity
}

interface MandarinSide {
  id: number;                   // 0-5 (FRONT, BACK, TOP, BOTTOM, LEFT, RIGHT)
  cells: PeelCell[];
  peeled: boolean;
  adjacent: { top, bottom, left, right: number };
}

interface GameState {
  status: 'title' | 'playing' | 'game_over' | 'win';
  currentSide: number;
  sides: MandarinSide[];
  touchActive: boolean;
  startTime: number;
  lastPeeledEdge: EdgeType | null;
  peeledCount: number;
  totalCells: number;
}
```

### Side Adjacency Map

```
        [2: TOP]
[4: LEFT][0: FRONT][5: RIGHT][1: BACK]
        [3: BOTTOM]
```

| Current | Top → | Bottom → | Left → | Right → |
|---------|-------|----------|--------|---------|
| FRONT   | TOP   | BOTTOM   | LEFT   | RIGHT   |
| BACK    | TOP   | BOTTOM   | RIGHT  | LEFT    |
| TOP     | BACK  | FRONT    | LEFT   | RIGHT   |
| BOTTOM  | FRONT | BACK     | LEFT   | RIGHT   |
| LEFT    | TOP   | BOTTOM   | BACK   | FRONT   |
| RIGHT   | TOP   | BOTTOM   | FRONT  | BACK    |

---

## Voronoi Cell Generation

**File:** `src/voronoi.ts`

### Site Placement Strategy

For playability, sites are placed strategically:

1. **Low counts (1-3)**: Strategic placement toward edges
2. **Higher counts (4+)**: Guaranteed edge sites + random fill with minimum distance constraints

```typescript
// Pre-compute squared distance to avoid sqrt in hot loop
const minDistSq = minDist * minDist;

for (let i = sites.length; i < count; i++) {
  // Random placement with distance validation
  for (const site of sites) {
    const dx = x - site.x;
    const dy = y - site.y;
    if (dx * dx + dy * dy < minDistSq) {  // Squared comparison
      valid = false;
      break;
    }
  }
}
```

### Cell Classification

Cells are classified by which boundary edges their polygon touches:
- Edge cells: touch exactly one boundary → valid exit
- Corner cells: touch two boundaries → can exit either direction
- Center cells: touch no boundaries → game over if last

### Neighbor Computation

Neighbors are determined by shared polygon edges (cells share ≥2 vertices within tolerance).

---

## Peel Strip Physics

**File:** `src/peelStrip.ts`

### Architecture

Single continuous mesh using `BufferGeometry` with:
- Pre-allocated `Float32Array` for positions (500 vertices max)
- Pre-allocated `Uint16Array` for triangle indices (2000 max)
- Dynamic draw range that grows as cells are added

### Connection Strategy

Each cell connects to the **previous cell only** via 2 adjacent vertices (shared edge):

1. Find all potential matches within `MATCH_TOLERANCE = 0.15`
2. Select adjacent vertex pair (forms actual polygon edge)
3. Reuse matched vertices from previous cell
4. If no natural match, force connection to closest vertex

### Verlet Integration Physics

```typescript
update(deltaTime: number): void {
  // Move pinned vertices to cursor position
  for (const idx of this.pinnedIndices) {
    pv.position.copy(this.cursorPosition);
  }

  // Verlet integration for unpinned vertices
  for (const pv of physicsVertices) {
    if (pv.pinned) continue;

    // Reuse temp vectors to avoid allocations
    this.tempVelocity.copy(pv.position).sub(pv.previousPosition);
    pv.position.add(this.tempVelocity.multiplyScalar(damping));
    this.tempVec1.copy(this.gravity).multiplyScalar(dt * dt);
    pv.position.add(this.tempVec1);
  }

  // Solve distance constraints (1 iteration for mobile performance)
  this.solveConstraints();
  this.syncGeometryFromPhysics();
}
```

### Pinning Strategy

- **First cell**: Pin first 2 vertices (one edge)
- **Subsequent cells**: Unpin all, then pin only matched vertices
- **Effect**: Newest connection follows cursor, everything else dangles

### Camera-Relative Gravity

```typescript
setGravityFromCamera(camera: THREE.Camera): void {
  const down = new THREE.Vector3(0, -1, 0);
  down.applyQuaternion(camera.quaternion);
  const towardsPlayer = new THREE.Vector3(0, 0, -1);
  towardsPlayer.applyQuaternion(camera.quaternion);

  // Mix: 70% down, 30% towards player
  this.gravity.addScaledVector(down, 0.7);
  this.gravity.addScaledVector(towardsPlayer, 0.3);
  this.gravity.normalize().multiplyScalar(20.0);
}
```

### Victory Orbit Animation

On win, the peel strip enters orbit mode - floating around the mandarin with tumbling effect.

---

## Input System

**File:** `src/input.ts`

### Optimizations Implemented

1. **Cached `getBoundingClientRect()`**: Avoids layout reflow on every touch event
   ```typescript
   private cachedRect: DOMRect | null = null;

   private getRect(): DOMRect {
     if (!this.cachedRect) {
       this.cachedRect = this.canvas.getBoundingClientRect();
     }
     return this.cachedRect;
   }
   ```

2. **Pre-bound event handlers**: Proper listener removal
   ```typescript
   // Bind once in constructor
   this.boundHandleDown = this.handleDown.bind(this);

   // Use same reference for add/remove
   canvas.addEventListener('mousedown', this.boundHandleDown);
   canvas.removeEventListener('mousedown', this.boundHandleDown);
   ```

---

## Rendering & Performance

### WebGL Configuration

```typescript
this.renderer = new THREE.WebGLRenderer({
  antialias: window.devicePixelRatio < 2,  // Disable AA on high-DPI
  alpha: true,
  powerPreference: 'high-performance',
});

// Cap pixel ratio for mobile performance
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
this.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(devicePixelRatio, 1.5));
```

### Lighting Setup

Strategic lighting to highlight cell edges for path planning:

```typescript
// Low ambient for more contrast between cells
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

// Strong side light to create shadows between cells
// Attached to camera so lighting is consistent across rotations
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(2, 1, 0.5);  // More from the side
this.camera.add(directionalLight);

// Subtle fill light to prevent harsh shadows
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight2.position.set(-1, -0.5, 1);
this.camera.add(directionalLight2);
```

- **Side lighting** creates visible shadows at cell boundaries
- **Camera-attached lights** maintain consistent lighting as mandarin rotates
- **Low ambient + strong directional** increases contrast for edge visibility
- Helps players see cell shapes and plan their peeling path

### Performance Optimizations

1. **Reusable objects** to avoid GC pressure:
   ```typescript
   private tempEuler = new THREE.Euler();
   private tempQuat = new THREE.Quaternion();
   private tempVec3 = new THREE.Vector3();
   ```

2. **Debounced resize handler** (100ms) to avoid geometry thrashing

3. **Cached unpeeled meshes** for raycasting:
   ```typescript
   if (this.meshCacheDirty) {
     this.unpeeledMeshCache = currentSide.cells
       .filter(c => !c.peeled)
       .map(c => c.mesh);
     this.meshCacheDirty = false;
   }
   ```

4. **Conditional normal computation** - only when topology changes:
   ```typescript
   if (this.needsNormalUpdate) {
     this.geometry.computeVertexNormals();
     this.needsNormalUpdate = false;
   }
   ```

5. **Shared materials** for juice particles (victory particles use cloned materials for color variation)

6. **Proper geometry disposal** to prevent memory leaks

### Particle System

- Regular juice: 4-6 particles per cell, shared material
- Victory burst: 40-60 particles with individual geometries (disposed on death)

---

## Visual Design

### Textures (Procedural)

**File:** `src/textures.ts`

- **Peel texture**: Fractal Brownian Motion (FBM) for organic orange pattern
- **Peel normal map**: Computed from height map with cellular noise for pores
- **Body texture**: Lighter orange for exposed fruit flesh
- **Caching**: Textures created once and reused

### Edge Indicators

Screen-edge bars that show valid exit directions:
- Orange bars at screen edges for unpeeled adjacent sides
- Path validation: only shows exits that lead to completable game states
- Brief blink animation on side transition

### Camera Tilt Effect

Subtle tilt towards touch position during gameplay:
```typescript
const tiltX = -normalizedPosition.y * 0.08;  // ~4.5 degrees max
const tiltY = normalizedPosition.x * 0.08;
this.currentTilt.slerp(this.targetTilt, 0.12);
```

### Stem Falling

When TOP side is peeled, the stem detaches with physics:
- Initial upward pop
- Gravity + tumbling rotation
- Removed when fallen off screen

---

## Platform Integration

### Telegram Mini App

```typescript
// telegram.ts
- User authentication (no login needed)
- Haptic feedback
- Native share via inline query with image
- CloudStorage for progress
- Stars payment for donations
- Leaderboard API
```

### LINE Mini App

```typescript
// line.ts
- LIFF SDK initialization
- User profile access
- Share via LINE message
- Separate leaderboard
```

### Leaderboard API

Backend on Cloudflare Workers (`worker/` directory):
- Time-based global leaderboard
- Platform-specific filtering (Telegram/LINE/Web)
- Cell count variants support

---

## Game Configuration

```typescript
const CELLS_PER_SIDE = 5;           // Fixed for current mode
const ROTATION_DURATION = 300;       // ms for side transition
const MATCH_TOLERANCE = 0.15;        // Vertex matching distance
const ROUNDNESS = 0.9;               // Cube-to-sphere blend
const RADIUS = 1.0;                  // Mandarin radius
```

---

## Future Considerations

### Roguelike Mode (Planned)

Debuffs applied after each side:
- Fog of War, Sticky Fingers, Shrinking Cells
- Mirrored Controls, Blindfold, Slippery
- Progressive difficulty: 0 → 1 → 2 → 3 debuffs

### Monetization

- Telegram Stars for donations
- Cosmetic skins (blood orange, lemon, Christmas ornament)
- Ad-free premium option
