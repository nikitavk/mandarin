# Mandarin Peeling Game - Design Document

## Theme
**Christmas / New Year seasonal game.** Mandarins are a traditional holiday symbol in many cultures - associated with Christmas stockings, New Year celebrations, and winter festivities. The game captures the cozy, satisfying ritual of peeling a mandarin during the holiday season.

## Concept
A single-screen casual game where the player peels a mandarin by swiping across its surface. The mandarin is divided into 6 sides (cube-mapped sphere), each containing Voronoi-pattern peel pieces. The player must peel all pieces in one continuous touch - lifting the finger ends the game.

## Core Loop
1. Game starts with finger down on first piece
2. Drag across pieces to peel them
3. Peel all pieces on current side
4. Last piece touched determines next side (based on edge location)
5. Camera rotates to next side automatically
6. Repeat until all 6 sides peeled → WIN
7. Lift finger at any point → GAME OVER

---

## Mechanics

### Touch System
- Single continuous touch required for entire game
- Touch position mapped to current side's surface
- Piece peels when touch enters its area
- No multi-touch
- Start anywhere on first side (no designated starting zone)

### Voronoi Cells
- Each side divided into 5-8 Voronoi cells
- Cells generated procedurally per session
- Each cell has an edge classification: `top | bottom | left | right | center`
- Edge cells determine rotation direction when side is complete
- **Center cell rule**: If last peeled cell is `center` (not on edge) → GAME OVER

### Side Transitions
- Triggered when all cells on current side are peeled
- Direction based on last peeled cell's edge position
- Smooth rotation animation (~0.3s)

#### Entry Edge Alignment
When transitioning to a new side, the camera rotation must account for where the player's finger currently is on screen. The new side should be oriented so the player can continue peeling seamlessly from their current finger position.

**The rule:** The entry edge (opposite of exit edge) should appear where the finger is.

| Exit Edge | Finger Position | New Side Orientation |
|-----------|-----------------|---------------------|
| top       | top of screen   | rotated 180° (bottom edge at top) |
| bottom    | bottom of screen| rotated 180° (top edge at bottom) |
| left      | left of screen  | rotated -90° (right edge at left) |
| right     | right of screen | rotated +90° (left edge at right) |

This is applied as an additional Z-axis rotation on top of the base side-facing rotation.

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

## Visual Design

### Phase 1: Flat/Prototype
- Solid orange color for peel
- Lighter orange for peeled (exposed fruit)
- No outlines - cells distinguished by subtle color variation or gaps
- Simple camera: orthographic, centered on current side
- **Edge hints**: Light glows through edges leading to unpeeled sides
  - Warm light visible at valid exit edges (like light peeking through cracks)
  - Dead ends (already-peeled sides) appear dark/sealed - no light
  - Creates natural visual hierarchy: "go towards the light"
  - Light intensity could pulse subtly to draw attention

### Phase 2: Polished (Future)
- Realistic mandarin texture
- **Continuous peel strip**: As player peels cells, a single connected ribbon forms
  - Each peeled cell adds to the strip length
  - Strip attached at first peeled cell, dangles with physics
  - Soft body / rope physics (verlet integration or cannon.js)
  - Curls naturally under 
  - Persists across side transitions (ribbon wraps around mandarin)
  - **Visibility handling**: Strip fades to semi-transparent when near active side, or auto-tucks behind mandarin to avoid obscuring gameplay
  - **Score metric**: Strip length tracked as secondary score ("Longest Peel" leaderboard)
- Juice particle effects
- Ambient occlusion on cell edges

### UI Elements
- Sides remaining indicator (6 dots or mandarin icon)
- Timer (optional: for scoring)
- "Game Over" overlay
- "You Win" overlay with stats

---

## Game States

```
TITLE
  ↓ (tap to start)
PLAYING
  ↓ (finger lifted)     ↓ (all sides peeled)
GAME_OVER               WIN
  ↓ (tap)               ↓ (tap)
TITLE                   TITLE
```

---

## Data Structures

```typescript
type EdgeType = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface PeelCell {
  id: number;
  vertices: THREE.Vector2[];    // Voronoi polygon points
  center: THREE.Vector2;        // Cell center
  mesh: THREE.Mesh;
  peeled: boolean;
  edge: EdgeType;
}

interface MandarinSide {
  id: number;                   // 0-5
  cells: PeelCell[];
  peeled: boolean;              // All cells peeled
  adjacent: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface GameState {
  status: 'title' | 'playing' | 'game_over' | 'win';
  currentSide: number;
  sides: MandarinSide[];
  touchActive: boolean;
  startTime: number;
  lastPeeledEdge: EdgeType | null;
}
```

---

## Technical Implementation

### Voronoi Generation
- Use library: `d3-delaunay` or custom implementation
- Generate N random points within square bounds (N = TBD, needs playtesting)
- Clip polygons to side boundaries
- Classify edge cells by checking if polygon touches boundary

### Coordinate Mapping
- Each side uses local 2D coordinates (-1 to 1)
- Touch screen position → raycaster → local UV
- Camera always faces current side (rotation around mandarin center)

### Rotation Animation
- Use quaternion slerp for smooth rotation
- Duration: 300ms
- Easing: ease-out

---

## Scope

### MVP (Phase 1)
- [ ] 6-sided mandarin with Voronoi cells
- [ ] Touch/mouse input tracking
- [ ] Peel detection and visual feedback
- [ ] Side rotation on completion
- [ ] Win/lose conditions
- [ ] Basic UI (game over, win)

### Polish (Phase 2)
- [ ] Procedural Voronoi per session
- [ ] Sound effects (peel, rotate, win, lose)
- [ ] Improved visuals (textures, particles)
- [ ] Score system (time-based)
- [ ] Haptic feedback (mobile)

### Stretch Goals
- [ ] Multiple mandarin types (different cell counts)
- [ ] Daily challenge mode
- [ ] Leaderboard

### Roguelike Mode (Future)
After each side peeled, a random debuff is applied:

**Debuff Examples:**
- **Fog of War** - cells only revealed when finger is near
- **Sticky Fingers** - must hold on cell for 0.5s to peel it
- **Shrinking Cells** - cells slowly shrink, disappear if not peeled in time
- **Mirrored Controls** - touch position inverted
- **Blindfold** - screen goes dark for 1s intervals
- **Slippery** - finger "slides" in movement direction
- **Decoy Cells** - fake cells that trigger game over if touched
- **Time Pressure** - side must be completed within time limit
- **Fragile Edges** - edge cells crack and break if touched twice
- **Rotating View** - camera slowly rotates during play

**Progression:**
- Side 1: No debuff
- Side 2-3: 1 random debuff
- Side 4-5: 2 stacked debuffs
- Side 6: 3 stacked debuffs (final challenge)

**Meta progression:**
- Unlock new debuffs as you play
- "Seeded runs" for daily challenges
- Debuff difficulty tiers (easy/medium/hard)

---

## Platform

### Telegram Mini App Integration
- Deploy as Telegram Mini App (WebApp)
- Use Telegram WebApp SDK for:
  - User authentication (no login needed)
  - Haptic feedback (`HapticFeedback.impactOccurred`)
  - Native share functionality
  - CloudStorage for saving progress
  - Leaderboard via Telegram Gaming Platform
- Responsive design for mobile-first experience
- Back button handling
- Theme adaptation (dark/light from Telegram)

### Monetization (Telegram)
- **Telegram Stars** - in-app currency for purchases
  - Extra lives / continues
  - Cosmetic fruit skins (blood orange, lemon, grapefruit, Christmas ornament, snowball)
  - Skip difficult levels
- **Ads via Telegram Ad Network**
  - Rewarded ads: watch ad → get continue
  - Interstitial between sessions (optional, not aggressive)
- **Premium features**
  - Ad-free experience
  - Exclusive skins
  - Early access to new content
- **Invite rewards**
  - Bonus Stars for inviting friends
  - Referral tracking via `startParam`
