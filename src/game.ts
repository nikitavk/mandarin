import * as THREE from 'three';
import {
  GameState,
  GameStatus,
  MandarinSide,
  PeelCell,
  EdgeType,
  SIDE_ROTATIONS,
  initSideRotations,
} from './types';
import { createMandarin, isSideComplete } from './mandarin';
import { updateCellVisual } from './voronoi';
import { InputManager, InputState } from './input';
import { PeelStrip } from './peelStrip';
import { i18n } from './i18n';

// Juice particle for spray effect
interface JuiceParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private input: InputManager;
  private raycaster: THREE.Raycaster;

  private state: GameState;
  private mandarinGroup: THREE.Group | null = null;

  // Animation
  private isRotating: boolean = false;
  private rotationDuration: number = 300; // ms

  // Juice particles
  private juiceParticles: JuiceParticle[] = [];
  private juiceGeometry: THREE.SphereGeometry;
  private juiceMaterial: THREE.MeshBasicMaterial;

  // Visual tilt effect
  private targetTilt: THREE.Quaternion = new THREE.Quaternion();
  private currentTilt: THREE.Quaternion = new THREE.Quaternion();
  private baseCameraRotation: THREE.Quaternion = new THREE.Quaternion();
  private tiltAmount: number = 0.08; // Max tilt in radians (~4.5 degrees)

  // Edge indicators
  private edgeIndicators: {
    top: THREE.Mesh;
    bottom: THREE.Mesh;
    left: THREE.Mesh;
    right: THREE.Mesh;
  } | null = null;
  private edgeIndicatorGroup: THREE.Group | null = null;
  private currentEntryAngle: number = 0; // Track rotation to map indicators correctly
  private hintBlinkTimeout: ReturnType<typeof setTimeout> | null = null;

  // Connectivity tracking
  private lastPeeledCellId: number | null = null;

  // Peel strip
  private peelStrip: PeelStrip | null = null;

  // UI elements
  private uiContainer: HTMLDivElement;
  private titleScreen: HTMLDivElement;
  private gameOverScreen: HTMLDivElement;
  private winScreen: HTMLDivElement;

  // Stats tracking
  private streak: number = 0;
  private totalTries: number = 0;
  private totalWins: number = 0;

  constructor() {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a3a2a);

    // Add lights for MeshStandardMaterial
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, 5);
    this.scene.add(directionalLight2);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5.5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    this.input = new InputManager(this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();

    // Initialize side rotations
    initSideRotations();

    // Initialize game state
    this.state = this.createInitialState();

    // Create UI
    this.uiContainer = this.createUIContainer();
    this.titleScreen = this.createTitleScreen();
    this.gameOverScreen = this.createGameOverScreen();
    this.winScreen = this.createWinScreen();

    // Setup input handlers
    this.setupInput();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));

    // Create edge indicators
    this.createEdgeIndicators();

    // Initialize juice particle system
    this.juiceGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    this.juiceMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1.0,
    });

    // Load saved stats
    this.loadStats();

    // Show title screen
    this.showScreen('title');
  }

  private createEdgeIndicators(): void {
    this.edgeIndicatorGroup = new THREE.Group();
    this.edgeIndicatorGroup.name = 'edge-indicators';

    // Horizontal bar for top/bottom
    const horzGeometry = new THREE.BoxGeometry(1.2, 0.12, 0.02);
    // Vertical bar for left/right
    const vertGeometry = new THREE.BoxGeometry(0.12, 1.2, 0.02);

    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8833,
      transparent: true,
      opacity: 0, // Hidden by default, shown briefly on side change
    });

    // Position indicators in local space relative to camera
    // In camera's local space: -Z is forward, +Y is up, +X is right
    const distance = 1.1; // Distance from center on screen
    const zOffset = -2.5; // In front of camera (negative Z = forward in camera space)

    // Top indicator (player swipes up to go to top side)
    const topIndicator = new THREE.Mesh(horzGeometry, indicatorMaterial.clone());
    topIndicator.position.set(0, distance, zOffset);
    topIndicator.name = 'indicator-top';

    // Bottom indicator (player swipes down to go to bottom side)
    const bottomIndicator = new THREE.Mesh(horzGeometry, indicatorMaterial.clone());
    bottomIndicator.position.set(0, -distance, zOffset);
    bottomIndicator.name = 'indicator-bottom';

    // Left indicator (player swipes left to go to left side)
    const leftIndicator = new THREE.Mesh(vertGeometry, indicatorMaterial.clone());
    leftIndicator.position.set(-distance, 0, zOffset);
    leftIndicator.name = 'indicator-left';

    // Right indicator (player swipes right to go to right side)
    const rightIndicator = new THREE.Mesh(vertGeometry, indicatorMaterial.clone());
    rightIndicator.position.set(distance, 0, zOffset);
    rightIndicator.name = 'indicator-right';

    this.edgeIndicatorGroup.add(topIndicator, bottomIndicator, leftIndicator, rightIndicator);
    this.scene.add(this.edgeIndicatorGroup);

    this.edgeIndicators = {
      top: topIndicator,
      bottom: bottomIndicator,
      left: leftIndicator,
      right: rightIndicator,
    };
  }

  private updateEdgeIndicators(): void {
    if (!this.edgeIndicators || this.state.status !== 'playing') return;

    const currentSide = this.state.sides[this.state.currentSide];
    if (!currentSide) return;

    type DirectionEdge = 'top' | 'bottom' | 'left' | 'right';
    const screenEdges: DirectionEdge[] = ['top', 'bottom', 'left', 'right'];

    // Map screen edges to logical edges based on current rotation
    // Entry angle rotates the view, so we need to reverse-map
    const getLogicalEdge = (screenEdge: DirectionEdge): DirectionEdge => {
      // Normalize angle to 0, 90, 180, 270
      const normalizedAngle = ((this.currentEntryAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const steps = Math.round(normalizedAngle / (Math.PI / 2)) % 4;

      // Rotation maps: 0=none, 1=90° CW, 2=180°, 3=270° CW (90° CCW)
      const rotationMap: Record<number, Record<DirectionEdge, DirectionEdge>> = {
        0: { top: 'top', bottom: 'bottom', left: 'left', right: 'right' },
        1: { top: 'left', bottom: 'right', left: 'bottom', right: 'top' },
        2: { top: 'bottom', bottom: 'top', left: 'right', right: 'left' },
        3: { top: 'right', bottom: 'left', left: 'top', right: 'bottom' },
      };

      return rotationMap[steps][screenEdge];
    };

    // Update each indicator - mark available ones green, hide unavailable completely
    for (const screenEdge of screenEdges) {
      const indicator = this.edgeIndicators[screenEdge];
      const material = indicator.material as THREE.MeshBasicMaterial;
      const logicalEdge = getLogicalEdge(screenEdge);
      const adjacentSideId = currentSide.adjacent[logicalEdge];
      const isAvailable = !this.state.sides[adjacentSideId].peeled;

      // Only orange for available, unavailable stays hidden
      material.color.setHex(0xff8833);
      indicator.visible = isAvailable;
      material.opacity = 0;
    }
  }

  private blinkHints(): void {
    if (!this.edgeIndicators) return;

    // Clear any existing blink timeout
    if (this.hintBlinkTimeout) {
      clearTimeout(this.hintBlinkTimeout);
    }

    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

    // Show hints (only visible/available ones)
    for (const edge of edges) {
      const indicator = this.edgeIndicators[edge];
      const material = indicator.material as THREE.MeshBasicMaterial;
      if (indicator.visible) {
        material.opacity = 0.8;
      }
    }

    // Fade out after delay
    const blinkDuration = 800; // ms to show hints
    const fadeSteps = 10;
    const fadeInterval = 200; // total fade duration = 200ms

    this.hintBlinkTimeout = setTimeout(() => {
      let step = 0;
      const fadeOut = () => {
        step++;
        const opacity = 0.8 * (1 - step / fadeSteps);
        for (const edge of edges) {
          const material = this.edgeIndicators![edge].material as THREE.MeshBasicMaterial;
          material.opacity = Math.max(0, opacity);
        }
        if (step < fadeSteps) {
          setTimeout(fadeOut, fadeInterval / fadeSteps);
        }
      };
      fadeOut();
    }, blinkDuration);
  }

  private positionEdgeIndicatorsToCamera(): void {
    if (!this.edgeIndicatorGroup) return;

    // Position indicators in front of camera
    this.edgeIndicatorGroup.position.copy(this.camera.position);
    this.edgeIndicatorGroup.quaternion.copy(this.camera.quaternion);
  }

  private updateTiltFromInput(normalizedPosition: THREE.Vector2): void {
    if (this.isRotating || this.state.status !== 'playing') return;

    // Calculate target tilt based on touch position
    // Tilt towards where the player is touching
    const tiltX = -normalizedPosition.y * this.tiltAmount; // Pitch (up/down)
    const tiltY = normalizedPosition.x * this.tiltAmount;  // Yaw (left/right)

    this.targetTilt.setFromEuler(new THREE.Euler(tiltX, tiltY, 0));
  }

  private updateTilt(): void {
    // Only apply tilt effect during gameplay
    if (this.state.status !== 'playing' || this.isRotating) {
      return;
    }

    // Check if tilt is negligible (nearly identity)
    const isNearIdentity = Math.abs(1 - this.currentTilt.w) < 0.001;

    if (this.state.touchActive) {
      // Smoothly interpolate towards target tilt
      this.currentTilt.slerp(this.targetTilt, 0.12);
      // Apply tilt to camera rotation (tilt is in camera's local space)
      const finalRotation = this.baseCameraRotation.clone().multiply(this.currentTilt);
      this.camera.quaternion.copy(finalRotation);
    } else if (!isNearIdentity) {
      // Return to neutral when not touching
      this.currentTilt.slerp(new THREE.Quaternion(), 0.15);
      const finalRotation = this.baseCameraRotation.clone().multiply(this.currentTilt);
      this.camera.quaternion.copy(finalRotation);
    }
  }

  private saveBaseCameraRotation(): void {
    this.baseCameraRotation.copy(this.camera.quaternion);
  }

  private hideEdgeIndicators(): void {
    if (!this.edgeIndicators) return;
    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
    for (const edge of edges) {
      const material = this.edgeIndicators[edge].material as THREE.MeshBasicMaterial;
      material.opacity = 0;
    }
  }

  private spawnJuiceParticles(position: THREE.Vector3, normal: THREE.Vector3): void {
    const particleCount = 8 + Math.floor(Math.random() * 5); // 8-12 particles

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(this.juiceGeometry, this.juiceMaterial.clone());
      mesh.position.copy(position);

      // Random velocity spraying outward from the surface
      const spread = 0.8;
      const velocity = new THREE.Vector3(
        normal.x + (Math.random() - 0.5) * spread,
        normal.y + (Math.random() - 0.5) * spread,
        normal.z + (Math.random() - 0.5) * spread
      );
      velocity.normalize().multiplyScalar(1.5 + Math.random() * 2);

      const particle: JuiceParticle = {
        mesh,
        velocity,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3, // 0.4-0.7 seconds
      };

      this.juiceParticles.push(particle);
      this.scene.add(mesh);
    }
  }

  private updateJuiceParticles(deltaTime: number): void {
    for (let i = this.juiceParticles.length - 1; i >= 0; i--) {
      const particle = this.juiceParticles[i];
      particle.life += deltaTime;

      // Update position
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

      // Apply gravity
      particle.velocity.y -= 5 * deltaTime;

      // Fade out
      const lifeRatio = particle.life / particle.maxLife;
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 1.0 * (1 - lifeRatio * 0.7);

      // Shrink slightly
      const scale = 1 - lifeRatio * 0.3;
      particle.mesh.scale.setScalar(scale);

      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        this.scene.remove(particle.mesh);
        material.dispose();
        this.juiceParticles.splice(i, 1);
      }
    }
  }

  private clearJuiceParticles(): void {
    for (const particle of this.juiceParticles) {
      this.scene.remove(particle.mesh);
      (particle.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.juiceParticles = [];
  }

  private createInitialState(): GameState {
    return {
      status: 'title',
      currentSide: 0,
      sides: [],
      touchActive: false,
      startTime: 0,
      lastPeeledEdge: null,
      peeledCount: 0,
      totalCells: 0,
    };
  }

  private loadStats(): void {
    try {
      const saved = localStorage.getItem('mandarin-stats');
      if (saved) {
        const stats = JSON.parse(saved);
        this.streak = stats.streak ?? 0;
        this.totalTries = stats.totalTries ?? 0;
        this.totalWins = stats.totalWins ?? 0;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem('mandarin-stats', JSON.stringify({
        streak: this.streak,
        totalTries: this.totalTries,
        totalWins: this.totalWins,
      }));
    } catch {
      // Ignore localStorage errors
    }
  }

  private createUIContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'ui-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    document.body.appendChild(container);
    return container;
  }

  private createTitleScreen(): HTMLDivElement {
    const screen = document.createElement('div');
    screen.id = 'title-screen';
    screen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(26, 26, 46, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #ff8833;">${i18n.title}</h1>
      <p style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 2rem;">${i18n.subtitle}</p>
      <p id="title-stats" style="font-size: 1rem; color: #aaa; margin-bottom: 1rem;"></p>
      <p style="font-size: 1rem; color: #888;">${i18n.tapToStart}</p>
    `;
    screen.addEventListener('click', () => this.startGame());
    screen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startGame();
    });
    this.uiContainer.appendChild(screen);
    return screen;
  }

  private createGameOverScreen(): HTMLDivElement {
    const screen = document.createElement('div');
    screen.id = 'game-over-screen';
    screen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(26, 26, 46, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #ff4444;">${i18n.gameOver}</h1>
      <p id="game-over-reason" style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 1rem;"></p>
      <p id="game-over-stats" style="font-size: 1rem; color: #888; margin-bottom: 1rem;"></p>
      <p id="game-over-streak" style="font-size: 1rem; color: #aaa; margin-bottom: 2rem;"></p>
      <p style="font-size: 1rem; color: #888;">${i18n.tapToTryAgain}</p>
    `;
    screen.addEventListener('click', () => this.returnToTitle());
    screen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.returnToTitle();
    });
    this.uiContainer.appendChild(screen);
    return screen;
  }

  private createWinScreen(): HTMLDivElement {
    const screen = document.createElement('div');
    screen.id = 'win-screen';
    screen.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(26, 26, 46, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #44ff44;">${i18n.youWin}</h1>
      <p id="win-stats" style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 1rem;"></p>
      <p id="win-streak" style="font-size: 1rem; color: #aaa; margin-bottom: 2rem;"></p>
      <p style="font-size: 1rem; color: #888;">${i18n.tapToPlayAgain}</p>
    `;
    screen.addEventListener('click', () => this.returnToTitle());
    screen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.returnToTitle();
    });
    this.uiContainer.appendChild(screen);
    return screen;
  }

  private showScreen(screen: GameStatus): void {
    this.titleScreen.style.display = screen === 'title' ? 'flex' : 'none';
    this.gameOverScreen.style.display = screen === 'game_over' ? 'flex' : 'none';
    this.winScreen.style.display = screen === 'win' ? 'flex' : 'none';

    // Update title screen stats when shown
    if (screen === 'title') {
      const statsEl = this.titleScreen.querySelector('#title-stats') as HTMLElement;
      if (this.totalTries > 0) {
        statsEl.textContent = i18n.formatStats(this.totalWins, this.totalTries, this.streak);
      } else {
        statsEl.textContent = '';
      }
    }
  }

  private setupInput(): void {
    this.input.setOnDown((state) => {
      if (this.state.status === 'playing' && !this.isRotating) {
        this.state.touchActive = true;
        this.updateTiltFromInput(state.normalizedPosition);
        this.handleTouch(state);
      }
    });

    this.input.setOnMove((state) => {
      if (this.state.status === 'playing' && this.state.touchActive && !this.isRotating) {
        this.updateTiltFromInput(state.normalizedPosition);
        this.handleTouch(state);
      }
    });

    this.input.setOnUp(() => {
      if (this.state.status === 'playing' && this.state.touchActive) {
        this.gameOver(i18n.liftedFinger);
      }
    });
  }

  private handleTouch(inputState: InputState): void {
    // Raycast to find which cell was touched
    this.raycaster.setFromCamera(inputState.normalizedPosition, this.camera);

    const currentSide = this.state.sides[this.state.currentSide];
    if (!currentSide) return;

    // Get intersections with current side's UNPEELED cells only
    const unpeeledCells = currentSide.cells.filter((c) => !c.peeled);
    const meshes = unpeeledCells.map((c) => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const cell = unpeeledCells.find((c) => c.mesh === hitMesh);

      if (cell) {
        // Check if cell is connected to already-peeled cells
        if (this.canPeelCell(cell, currentSide)) {
          this.peelCell(cell, currentSide);
        } else {
          // Cell is not connected to peeled area
          this.gameOver(i18n.mustPeelConnected);
        }
      }

      // Update peel strip position to follow touch
      if (this.peelStrip) {
        this.peelStrip.updatePeelPosition(intersects[0].point);
      }
    } else {
      // No intersection with unpeeled cells - check if touching peeled area
      // Still update strip position if dragging over mandarin
      const allMeshes = currentSide.cells.map((c) => c.mesh);
      const anyIntersects = this.raycaster.intersectObjects(allMeshes);
      if (anyIntersects.length > 0 && this.peelStrip) {
        this.peelStrip.updatePeelPosition(anyIntersects[0].point);
      }
    }
  }

  // Check if a cell can be peeled (must be neighbor of last peeled cell, or first cell on side)
  private canPeelCell(cell: PeelCell, _side: MandarinSide): boolean {
    // If no last peeled cell on this side, any cell is valid (first cell)
    if (this.lastPeeledCellId === null) {
      return true;
    }

    // Cell must be a neighbor of the last peeled cell
    const isNeighborOfLast = cell.neighborIds.includes(this.lastPeeledCellId);

    return isNeighborOfLast;
  }

  private peelCell(cell: PeelCell, side: MandarinSide): void {
    cell.peeled = true;
    this.state.peeledCount++;
    this.state.lastPeeledEdge = cell.edge;
    this.lastPeeledCellId = cell.id;
    updateCellVisual(cell);

    // Spawn juice particles from the cell's center
    // Force world matrix update to get correct position
    cell.mesh.updateWorldMatrix(true, false);
    const cellWorldPos = new THREE.Vector3();
    cell.mesh.getWorldPosition(cellWorldPos);

    // If position is still zero, compute from cell center (2D) projected to 3D
    if (cellWorldPos.lengthSq() < 0.001) {
      // Fallback: use geometry bounding sphere center
      cell.mesh.geometry.computeBoundingSphere();
      const center = cell.mesh.geometry.boundingSphere?.center;
      if (center) {
        cellWorldPos.copy(center);
      }
    }

    const normal = cellWorldPos.clone().normalize(); // Normal points outward from sphere center
    this.spawnJuiceParticles(cellWorldPos, normal);

    // Add cell mesh to peel strip (the actual peeled piece becomes part of the strip)
    if (this.peelStrip) {
      this.peelStrip.addSegment(cell, cell.mesh, cellWorldPos);
    }

    // Check if side is complete
    if (isSideComplete(side)) {
      side.peeled = true;

      // Check if game won
      if (this.state.sides.every((s) => s.peeled)) {
        this.win();
        return;
      }

      // Check for center cell game over
      if (cell.edge === 'center') {
        this.gameOver(i18n.endedOnCenter);
        return;
      }

      // Transition to next side - favor player by checking all edges cell touches
      const validEdge = this.findValidTransitionEdge(cell, side);
      if (validEdge) {
        this.transitionToNextSide(validEdge);
      } else {
        // All adjacent sides from this cell are already peeled
        this.gameOver(i18n.noValidExit);
      }
    }
  }

  // Find a valid edge to transition to, favoring unpeeled sides
  private findValidTransitionEdge(cell: PeelCell, side: MandarinSide): EdgeType | null {
    // Filter out 'center' from edges
    const exitEdges = cell.edges.filter((e): e is Exclude<EdgeType, 'center'> => e !== 'center');

    if (exitEdges.length === 0) {
      return null;
    }

    // If only one edge, use it (will be validated in transitionToNextSide)
    if (exitEdges.length === 1) {
      return exitEdges[0];
    }

    // Multiple edges (corner cell) - find one that leads to unpeeled side
    for (const edge of exitEdges) {
      const adjacentSideId = side.adjacent[edge];
      if (!this.state.sides[adjacentSideId].peeled) {
        console.log(`Corner cell: choosing ${edge} (leads to unpeeled ${i18n.getSideName(adjacentSideId)})`);
        return edge;
      }
    }

    // All adjacent sides are peeled - return first edge (will trigger game over)
    return exitEdges[0];
  }

  private transitionToNextSide(edge: EdgeType): void {
    const currentSide = this.state.sides[this.state.currentSide];
    const nextSideId = currentSide.adjacent[edge as keyof typeof currentSide.adjacent];

    // Check if next side is already peeled
    if (this.state.sides[nextSideId].peeled) {
      this.gameOver(i18n.formatSideAlreadyPeeled(i18n.getSideName(nextSideId)));
      return;
    }

    console.log(`Transitioning from ${i18n.getSideName(this.state.currentSide)} to ${i18n.getSideName(nextSideId)} via ${edge}`);

    this.state.currentSide = nextSideId;
    this.lastPeeledCellId = null; // Reset for new side - first cell is free choice

    // Note: gravity is updated after camera animation completes in animateCamera()
    this.startRotationAnimation(nextSideId, edge);
  }

  // Get the Z-axis rotation needed so the entry edge aligns with finger position
  // When exiting via 'bottom', finger is at bottom, so new side's 'top' should be at bottom (180°)
  private getEntryRotation(exitEdge: EdgeType): number {
    switch (exitEdge) {
      case 'top':
        // Exited via top, finger at top of screen
        // New side should have 'bottom' edge at top → rotate 180°
        return Math.PI;
      case 'bottom':
        // Exited via bottom, finger at bottom of screen
        // New side should have 'top' edge at bottom → rotate 180°
        return Math.PI;
      case 'left':
        // Exited via left, finger at left of screen
        // New side should have 'right' edge at left → rotate -90°
        return -Math.PI / 2;
      case 'right':
        // Exited via right, finger at right of screen
        // New side should have 'left' edge at right → rotate +90°
        return Math.PI / 2;
      default:
        return 0;
    }
  }

  private startRotationAnimation(targetSide: number, exitEdge: EdgeType): void {
    this.isRotating = true;

    // Get base rotation for viewing this side
    const baseRotation = SIDE_ROTATIONS[targetSide].clone().invert();

    // Apply entry rotation so the correct edge faces the finger position
    const entryAngle = this.getEntryRotation(exitEdge);
    this.currentEntryAngle = entryAngle; // Track for edge indicator mapping
    const entryRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, entryAngle)
    );

    // Position camera at correct distance facing the side
    const distance = 5.5;
    const targetPosition = new THREE.Vector3(0, 0, distance);
    targetPosition.applyQuaternion(baseRotation.clone().invert());

    // Animate position and rotation with entry adjustment
    this.animateCamera(targetPosition, entryRotation);
  }

  private animateCamera(targetPosition: THREE.Vector3, entryRotation: THREE.Quaternion): void {
    const startPosition = this.camera.position.clone();
    const startRotation = this.camera.quaternion.clone();
    const startTime = performance.now();

    // Calculate final camera orientation: look at center, then apply entry rotation
    const tempCamera = this.camera.clone();
    tempCamera.position.copy(targetPosition);
    tempCamera.lookAt(0, 0, 0);
    const targetRotation = tempCamera.quaternion.clone().multiply(entryRotation);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / this.rotationDuration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate position
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);

      // Interpolate rotation
      this.camera.quaternion.slerpQuaternions(startRotation, targetRotation, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isRotating = false;
        this.currentTilt.identity();
        this.saveBaseCameraRotation();
        this.updateEdgeIndicators();
        this.blinkHints();

        // Update peel strip gravity based on final camera orientation
        if (this.peelStrip) {
          this.peelStrip.setGravityFromCamera(this.camera);
        }
      }
    };

    animate();
  }

  private startGame(): void {
    // Clear old mandarin
    if (this.mandarinGroup) {
      this.scene.remove(this.mandarinGroup);
    }

    // Clear any leftover juice particles
    this.clearJuiceParticles();

    // Reset peel strip
    if (this.peelStrip) {
      this.peelStrip.reset();
    }
    this.peelStrip = new PeelStrip(this.scene);
    this.peelStrip.setCamera(this.camera);
    this.peelStrip.setGravityFromCamera(this.camera);  // Set gravity based on initial camera

    // Create new mandarin
    const { sides, group, totalCells } = createMandarin(8);
    this.mandarinGroup = group;
    this.scene.add(group);

    // Reset state
    this.state = {
      status: 'playing',
      currentSide: 0,
      sides,
      touchActive: false,
      startTime: Date.now(),
      lastPeeledEdge: null,
      peeledCount: 0,
      totalCells,
    };

    // Reset camera
    this.camera.position.set(0, 0, 5.5);
    this.camera.lookAt(0, 0, 0);
    this.currentEntryAngle = 0; // Reset rotation mapping
    this.lastPeeledCellId = null; // Reset connectivity tracking

    // Reset tilt state
    this.currentTilt.identity();
    this.targetTilt.identity();
    this.saveBaseCameraRotation();

    this.showScreen('playing');
    this.updateEdgeIndicators();
  }

  private gameOver(reason: string): void {
    this.state.status = 'game_over';
    this.state.touchActive = false;
    this.hideEdgeIndicators();

    // Update stats
    this.totalTries++;
    this.streak = 0;
    this.saveStats();

    const elapsed = ((Date.now() - this.state.startTime) / 1000).toFixed(1);
    const reasonEl = this.gameOverScreen.querySelector('#game-over-reason') as HTMLElement;
    const statsEl = this.gameOverScreen.querySelector('#game-over-stats') as HTMLElement;
    const streakEl = this.gameOverScreen.querySelector('#game-over-streak') as HTMLElement;

    reasonEl.textContent = reason;
    statsEl.textContent = i18n.formatPeeled(this.state.peeledCount, this.state.totalCells, elapsed);
    streakEl.textContent = i18n.formatStats(this.totalWins, this.totalTries, 0);

    this.showScreen('game_over');
  }

  private win(): void {
    this.state.status = 'win';
    this.state.touchActive = false;
    this.hideEdgeIndicators();

    // Update stats
    this.totalTries++;
    this.totalWins++;
    this.streak++;
    this.saveStats();

    const elapsed = ((Date.now() - this.state.startTime) / 1000).toFixed(1);
    const statsEl = this.winScreen.querySelector('#win-stats') as HTMLElement;
    const streakEl = this.winScreen.querySelector('#win-streak') as HTMLElement;
    statsEl.textContent = i18n.formatTime(elapsed);
    streakEl.textContent = i18n.formatStats(this.totalWins, this.totalTries, this.streak);

    this.showScreen('win');
  }

  private returnToTitle(): void {
    this.state.status = 'title';
    this.showScreen('title');
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start(): void {
    let lastTime = performance.now();

    const animate = () => {
      requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      this.updateTilt();
      this.updateJuiceParticles(deltaTime);
      this.peelStrip?.update(deltaTime);
      this.positionEdgeIndicatorsToCamera();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
