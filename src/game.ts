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
import { GameRecorder } from './recorder';
import { i18n } from './i18n';
import { yandex } from './yandex';

// Game settings (code-level configuration)
const GAME_SETTINGS = {
  /** Set to false to disable video clip recording */
  enableClipRecording: false,
};

// Juice particle for spray effect
interface JuiceParticle {
  mesh: THREE.Mesh;
  geometry?: THREE.BufferGeometry; // For victory particles with custom geometry
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
  private totalTries: number = 0;
  private totalWins: number = 0;

  // Fixed cells per side
  private readonly CELLS_PER_SIDE = 7;

  // Streak HUD element
  private streakHUD: HTMLDivElement | null = null;

  // Stem falling animation
  private stem: THREE.Group | null = null;
  private stemFalling: boolean = false;
  private stemVelocity: THREE.Vector3 = new THREE.Vector3();
  private stemRotationVelocity: THREE.Vector3 = new THREE.Vector3();

  // Showcase rotation (after win/lose)
  private showcaseRotating: boolean = false;
  private showcaseTime: number = 0;

  // Reusable objects to avoid allocations in hot paths
  private tempEuler = new THREE.Euler();
  private identityQuat = new THREE.Quaternion();
  private tempQuat = new THREE.Quaternion();
  private tempVec3 = new THREE.Vector3();

  // Debounced resize handling
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  // Cached unpeeled meshes for raycasting
  private unpeeledMeshCache: THREE.Mesh[] = [];
  private meshCacheDirty = true;

  // Video recording
  private recorder: GameRecorder | null = null;
  private lastRecordedBlob: Blob | null = null;

  constructor() {
    // Initialize Three.js
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent to show HTML background

    // Add lights for MeshStandardMaterial
    // Lower ambient for more contrast between cells
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5.5;

    // Add directional lights as children of camera so they rotate with it
    // Strong side light to create shadows between cells
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(2, 1, 0.5); // More from the side to highlight cell edges
    this.camera.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-1, -0.5, 1); // Subtle fill light
    this.camera.add(directionalLight2);

    this.scene.add(this.camera); // Camera must be in scene for its children to render

    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2, // Disable AA on high-DPI (unnecessary)
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio at 1.0 for mobile performance (prevents overheating)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
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

    // Create streak HUD
    this.createStreakHUD();

    // Initialize juice particle system (low-poly for performance)
    this.juiceGeometry = new THREE.SphereGeometry(0.15, 6, 4);
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

    // Placeholder geometries - will be resized in updateEdgeIndicatorPositions
    const horzGeometry = new THREE.BoxGeometry(1, 0.08, 0.02);
    const vertGeometry = new THREE.BoxGeometry(0.08, 1, 0.02);

    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8833,
      transparent: true,
      opacity: 0, // Hidden by default, shown briefly on side change
    });

    // Top indicator (player swipes up to go to top side)
    const topIndicator = new THREE.Mesh(horzGeometry, indicatorMaterial.clone());
    topIndicator.name = 'indicator-top';

    // Bottom indicator (player swipes down to go to bottom side)
    const bottomIndicator = new THREE.Mesh(horzGeometry.clone(), indicatorMaterial.clone());
    bottomIndicator.name = 'indicator-bottom';

    // Left indicator (player swipes left to go to left side)
    const leftIndicator = new THREE.Mesh(vertGeometry, indicatorMaterial.clone());
    leftIndicator.name = 'indicator-left';

    // Right indicator (player swipes right to go to right side)
    const rightIndicator = new THREE.Mesh(vertGeometry.clone(), indicatorMaterial.clone());
    rightIndicator.name = 'indicator-right';

    this.edgeIndicatorGroup.add(topIndicator, bottomIndicator, leftIndicator, rightIndicator);
    this.scene.add(this.edgeIndicatorGroup);

    this.edgeIndicators = {
      top: topIndicator,
      bottom: bottomIndicator,
      left: leftIndicator,
      right: rightIndicator,
    };

    // Position and size indicators based on current aspect ratio
    this.updateEdgeIndicatorPositions();
  }

  private createStreakHUD(): void {
    this.streakHUD = document.createElement('div');
    this.streakHUD.id = 'streak-hud';
    this.streakHUD.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffcc00;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 100;
    `;
    document.body.appendChild(this.streakHUD);
  }

  private updateStreakHUD(): void {
    if (!this.streakHUD) return;

    // Hide HUD during gameplay - only mandarin visible
    this.streakHUD.style.opacity = '0';
  }

  private updateEdgeIndicatorPositions(): void {
    if (!this.edgeIndicators) return;

    const zOffset = -2.5; // In front of camera
    const aspect = this.camera.aspect;
    const fov = this.camera.fov * (Math.PI / 180);

    // Calculate visible height/width at zOffset distance
    const visibleHeight = 2 * Math.tan(fov / 2) * Math.abs(zOffset);
    const visibleWidth = visibleHeight * aspect;

    const barThickness = 0.08; // Thin bars at screen edges

    // Dispose old geometries and create new ones sized to screen
    // Top/bottom bars: full width
    const horzGeometry = new THREE.BoxGeometry(visibleWidth, barThickness, 0.02);
    // Left/right bars: full height
    const vertGeometry = new THREE.BoxGeometry(barThickness, visibleHeight, 0.02);

    // Update geometries
    this.edgeIndicators.top.geometry.dispose();
    this.edgeIndicators.top.geometry = horzGeometry;
    this.edgeIndicators.bottom.geometry.dispose();
    this.edgeIndicators.bottom.geometry = horzGeometry.clone();
    this.edgeIndicators.left.geometry.dispose();
    this.edgeIndicators.left.geometry = vertGeometry;
    this.edgeIndicators.right.geometry.dispose();
    this.edgeIndicators.right.geometry = vertGeometry.clone();

    // Position at actual screen edges
    const verticalEdge = visibleHeight / 2 - barThickness / 2;
    const horizontalEdge = visibleWidth / 2 - barThickness / 2;

    this.edgeIndicators.top.position.set(0, verticalEdge, zOffset);
    this.edgeIndicators.bottom.position.set(0, -verticalEdge, zOffset);
    this.edgeIndicators.left.position.set(-horizontalEdge, 0, zOffset);
    this.edgeIndicators.right.position.set(horizontalEdge, 0, zOffset);
  }

  // Check if going to a specific side leaves a viable path to complete the game
  // Uses DFS to find a Hamiltonian path through all remaining unpeeled sides
  private canCompleteFromSide(startSideId: number, alreadyPeeled: Set<number>): boolean {
    const unpeeledSides = new Set<number>();
    for (let i = 0; i < 6; i++) {
      if (!alreadyPeeled.has(i)) {
        unpeeledSides.add(i);
      }
    }

    // If no unpeeled sides, we're done
    if (unpeeledSides.size === 0) return true;

    // If start side is already peeled, invalid
    if (alreadyPeeled.has(startSideId)) return false;

    // DFS to find a Hamiltonian path - we need to visit ALL unpeeled sides
    // in some order without backtracking through peeled sides
    const findPath = (current: number, visited: Set<number>): boolean => {
      visited.add(current);

      // If we've visited all unpeeled sides, success!
      if (visited.size === unpeeledSides.size) {
        return true;
      }

      const side = this.state.sides[current];

      // Try each adjacent unpeeled side
      for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
        const adjacentId = side.adjacent[edge];
        if (!visited.has(adjacentId) && unpeeledSides.has(adjacentId)) {
          if (findPath(adjacentId, visited)) {
            return true;
          }
        }
      }

      // Backtrack
      visited.delete(current);
      return false;
    };

    return findPath(startSideId, new Set());
  }

  // Check if a path through a specific edge leads to a completable game state
  private isPathViable(fromSideId: number, toSideId: number): boolean {
    // Create set of sides that would be peeled after this transition
    const wouldBePeeled = new Set<number>();
    for (const side of this.state.sides) {
      if (side.peeled) {
        wouldBePeeled.add(side.id);
      }
    }
    // Current side will be peeled when we transition
    wouldBePeeled.add(fromSideId);

    // Check if we can complete the game starting from toSideId
    return this.canCompleteFromSide(toSideId, wouldBePeeled);
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

    // Update each indicator
    for (const screenEdge of screenEdges) {
      const indicator = this.edgeIndicators[screenEdge];
      const material = indicator.material as THREE.MeshBasicMaterial;
      const logicalEdge = getLogicalEdge(screenEdge);
      const adjacentSideId = currentSide.adjacent[logicalEdge];
      const isUnpeeled = !this.state.sides[adjacentSideId].peeled;

      // Check if the path is viable (won't create a dead end)
      const isViable = isUnpeeled && this.isPathViable(currentSide.id, adjacentSideId);

      // Orange for viable paths, hide non-viable/already peeled
      material.color.setHex(0xff8833);
      indicator.visible = isViable;
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

    // Reuse tempEuler instead of allocating new Euler
    this.tempEuler.set(tiltX, tiltY, 0);
    this.targetTilt.setFromEuler(this.tempEuler);
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
      // Reuse tempQuat instead of cloning
      this.tempQuat.copy(this.baseCameraRotation).multiply(this.currentTilt);
      this.camera.quaternion.copy(this.tempQuat);
    } else if (!isNearIdentity) {
      // Return to neutral when not touching - use identityQuat instead of new Quaternion()
      this.currentTilt.slerp(this.identityQuat, 0.15);
      this.tempQuat.copy(this.baseCameraRotation).multiply(this.currentTilt);
      this.camera.quaternion.copy(this.tempQuat);
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
    const particleCount = 4 + Math.floor(Math.random() * 3); // 4-6 particles (optimized)

    for (let i = 0; i < particleCount; i++) {
      // Share material instead of cloning - all particles same color
      const mesh = new THREE.Mesh(this.juiceGeometry, this.juiceMaterial);
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

      // Update position - reuse tempVec3 instead of cloning
      this.tempVec3.copy(particle.velocity).multiplyScalar(deltaTime);
      particle.mesh.position.add(this.tempVec3);

      // Apply gravity
      particle.velocity.y -= 5 * deltaTime;

      // Fade out - only for victory particles with custom materials
      const lifeRatio = particle.life / particle.maxLife;
      if (particle.geometry) {
        // Victory particle has its own cloned material
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 1.0 * (1 - lifeRatio * 0.7);
      }

      // Shrink slightly
      const scale = 1 - lifeRatio * 0.3;
      particle.mesh.scale.setScalar(scale);

      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        this.scene.remove(particle.mesh);
        // Dispose custom geometry and material for victory particles
        if (particle.geometry) {
          particle.geometry.dispose();
          (particle.mesh.material as THREE.MeshBasicMaterial).dispose();
        }
        this.juiceParticles.splice(i, 1);
      }
    }
  }

  private clearJuiceParticles(): void {
    for (const particle of this.juiceParticles) {
      this.scene.remove(particle.mesh);
      // Dispose custom geometry and material for victory particles
      if (particle.geometry) {
        particle.geometry.dispose();
        (particle.mesh.material as THREE.MeshBasicMaterial).dispose();
      }
    }
    this.juiceParticles = [];
  }

  private startStemFalling(): void {
    if (!this.stem || this.stemFalling) return;

    this.stemFalling = true;
    // Initial velocity - pop up and outward
    this.stemVelocity.set(
      (Math.random() - 0.5) * 2,
      3 + Math.random() * 2,  // Pop upward
      (Math.random() - 0.5) * 2
    );
  }

  private updateStemFalling(deltaTime: number): void {
    if (!this.stem || !this.stemFalling) return;

    // Apply gravity
    this.stemVelocity.y -= 15 * deltaTime;

    // Update position
    this.stem.position.add(this.stemVelocity.clone().multiplyScalar(deltaTime));

    // Update rotation (tumbling)
    this.stem.rotation.x += this.stemRotationVelocity.x * deltaTime;
    this.stem.rotation.y += this.stemRotationVelocity.y * deltaTime;
    this.stem.rotation.z += this.stemRotationVelocity.z * deltaTime;

    // Remove when fallen far enough
    if (this.stem.position.y < -5) {
      this.mandarinGroup?.remove(this.stem);
      this.stem = null;
      this.stemFalling = false;
    }
  }

  private startShowcaseRotation(): void {
    this.showcaseRotating = true;
    this.showcaseTime = 0;
  }

  private stopShowcaseRotation(): void {
    this.showcaseRotating = false;
    if (this.mandarinGroup) {
      this.mandarinGroup.rotation.set(0, 0, 0);
    }
  }

  private updateShowcaseRotation(deltaTime: number): void {
    if (!this.showcaseRotating || !this.mandarinGroup) return;

    this.showcaseTime += deltaTime;

    // Rotate slowly around Y axis (horizontal spin)
    // Plus gentle wobble on X axis to show top/bottom
    const ySpeed = 0.3; // Rotations per ~20 seconds for full view
    const xWobbleSpeed = 0.15;
    const xWobbleAmount = 0.4; // ~23 degrees

    this.mandarinGroup.rotation.y = this.showcaseTime * Math.PI * ySpeed;
    this.mandarinGroup.rotation.x = Math.sin(this.showcaseTime * Math.PI * xWobbleSpeed) * xWobbleAmount;
  }

  private spawnVictoryJuiceBurst(): void {
    const particleCount = 40 + Math.floor(Math.random() * 20); // 40-60 particles (optimized)

    // Direction towards camera
    const toCamera = this.camera.position.clone().normalize();

    for (let i = 0; i < particleCount; i++) {
      // Larger particles for victory burst
      const size = 0.12 + Math.random() * 0.28; // Slightly larger to compensate for fewer
      const geometry = new THREE.SphereGeometry(size, 6, 4); // Low-poly
      const material = this.juiceMaterial.clone();

      // Vary colors between orange and yellow
      const hue = 0.08 + Math.random() * 0.05; // Orange to yellow-orange
      material.color.setHSL(hue, 1.0, 0.5 + Math.random() * 0.2);

      const mesh = new THREE.Mesh(geometry, material);

      // Start from random position on the mandarin surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const startPos = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).multiplyScalar(1.1); // Slightly outside mandarin

      mesh.position.copy(startPos);

      // Velocity primarily towards camera with spread
      const spread = 1.2;
      const velocity = new THREE.Vector3(
        toCamera.x + (Math.random() - 0.5) * spread,
        toCamera.y + (Math.random() - 0.5) * spread + 0.3, // Slight upward bias
        toCamera.z + (Math.random() - 0.5) * spread
      );
      velocity.normalize().multiplyScalar(4 + Math.random() * 6); // Fast burst

      const particle: JuiceParticle = {
        mesh,
        geometry, // Store reference for proper disposal
        velocity,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0, // Longer life for dramatic effect
      };

      this.juiceParticles.push(particle);
      this.scene.add(mesh);
    }
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
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
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
      background: rgba(20, 50, 30, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: #ff8833;">${i18n.title}</h1>
      <p style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 1.5rem;">${i18n.subtitle}</p>
      <div id="title-leaderboard" style="margin-bottom: 1.5rem; display: none;">
        <h3 style="font-size: 1rem; color: #ffdd44; margin-bottom: 0.5rem;">${i18n.leaderboard} (${i18n.formatCellsCount(this.CELLS_PER_SIDE)})</h3>
        <div id="leaderboard-tabs" style="display: flex; gap: 0.25rem; margin-bottom: 0.5rem; flex-wrap: wrap; justify-content: center;">
        </div>
        <table id="leaderboard-table" style="border-collapse: collapse; font-size: 0.85rem; width: 100%;">
        </table>
      </div>
      <p id="title-stats" style="font-size: 1rem; color: #88cc88; margin-bottom: 1rem;"></p>
      <p style="font-size: 1rem; color: #66aa66; margin-bottom: 1.5rem;">${i18n.tapToStart}</p>
      <div id="donate-container" style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="position: relative;">
          <select id="donate-amount" style="
            padding: 0.8rem 2.5rem 0.8rem 1rem;
            font-size: 1.1rem;
            background: #1a3d24;
            border: 2px solid #ff8800;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            min-width: 120px;
            -webkit-appearance: none;
            appearance: none;
          ">
            <option value="1">1 ⭐</option>
            <option value="5">5 ⭐</option>
            <option value="10">10 ⭐</option>
            <option value="50" selected>50 ⭐</option>
            <option value="100">100 ⭐</option>
            <option value="500">500 ⭐</option>
            <option value="1000">1000 ⭐</option>
            <option value="5000">5000 ⭐</option>
            <option value="10000">10000 ⭐</option>
            <option value="100000">100000 ⭐</option>
          </select>
          <span style="
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            color: #ff8800;
            font-size: 0.8rem;
          ">▼</span>
        </div>
        <button id="donate-btn" style="
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          background: linear-gradient(135deg, #ffaa00, #ff8800);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(255, 136, 0, 0.4);
        ">${i18n.donateStars}</button>
      </div>
    `;

    // Handle tap to start (but not on donate controls or links)
    const startGame = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'donate-btn' || target.id === 'donate-amount' || target.tagName === 'A') return;
      this.startGame();
    };
    screen.addEventListener('click', startGame);
    screen.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'donate-btn' || target.id === 'donate-amount' || target.tagName === 'A') return;
      e.preventDefault();
      this.startGame();
    });

    // Hide donate button (not available on Yandex)
    const donateContainer = screen.querySelector('#donate-container') as HTMLElement;
    if (donateContainer) {
      donateContainer.style.display = 'none';
    }


    // Debug: log platform detection
    console.log('[Platform]', {
      yandexAvailable: yandex.isAvailable,
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
      background: rgba(20, 50, 30, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 id="game-over-title" style="font-size: 3rem; margin-bottom: 1rem; color: #ff6633;">${i18n.gameOver}</h1>
      <p id="game-over-reason" style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 1rem;"></p>
      <p id="game-over-stats" style="font-size: 1rem; color: #88cc88; margin-bottom: 1rem;"></p>
      <p id="game-over-streak" style="font-size: 1rem; color: #ffaa66; margin-bottom: 2rem;"></p>
      <p id="game-over-tap" style="font-size: 1rem; color: #66aa66;">${i18n.tapToTryAgain}</p>
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
      background: rgba(20, 50, 30, 0.9);
      color: white;
      pointer-events: auto;
      cursor: pointer;
    `;
    screen.innerHTML = `
      <h1 id="win-title" style="font-size: 3rem; margin-bottom: 1rem; color: #66dd66;">${i18n.youWin}</h1>
      <p id="win-stats" style="font-size: 1.2rem; color: #ffcc88; margin-bottom: 1rem;"></p>
      <p id="win-leaderboard" style="font-size: 1rem; color: #ffdd44; margin-bottom: 0.5rem; display: none;"></p>
      <p id="win-streak" style="font-size: 1rem; color: #ffaa66; margin-bottom: 1.5rem;"></p>
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
        <button id="share-btn" style="
          padding: 0.8rem 1.5rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #66dd66, #44bb44);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(68, 187, 68, 0.4);
          display: none;
        ">${i18n.share}</button>
        <button id="download-clip-btn" style="
          padding: 0.8rem 1.5rem;
          font-size: 1.1rem;
          background: linear-gradient(135deg, #ff8833, #ff6600);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(255, 102, 0, 0.4);
          display: none;
        ">📹 ${i18n.saveClip}</button>
      </div>
      <p id="win-tap" style="font-size: 1rem; color: #66aa66;">${i18n.tapToPlayAgain}</p>
    `;

    // Handle share button
    const shareBtn = screen.querySelector('#share-btn') as HTMLButtonElement;
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleShare();
      });
      shareBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    }

    // Handle download clip button
    const downloadClipBtn = screen.querySelector('#download-clip-btn') as HTMLButtonElement;
    if (downloadClipBtn) {
      downloadClipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadLastClip();
      });
      downloadClipBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    }

    // Handle tap to return (but not on share/download buttons)
    const returnToTitle = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.id === 'share-btn' || target.id === 'download-clip-btn') return;
      this.returnToTitle();
    };
    screen.addEventListener('click', returnToTitle);
    screen.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'share-btn' || target.id === 'download-clip-btn') return;
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

    // Update title screen when shown
    if (screen === 'title') {
      // Update all translatable text
      const titleEl = this.titleScreen.querySelector('h1') as HTMLElement;
      const subtitleEl = this.titleScreen.querySelector('p') as HTMLElement;
      const leaderboardTitle = this.titleScreen.querySelector('#title-leaderboard h3') as HTMLElement;
      const tapToStartEl = this.titleScreen.querySelectorAll('p')[2] as HTMLElement;

      if (titleEl) titleEl.textContent = i18n.title;
      if (subtitleEl) subtitleEl.textContent = i18n.subtitle;
      if (leaderboardTitle) leaderboardTitle.textContent = `${i18n.leaderboard} (${i18n.formatCellsCount(this.CELLS_PER_SIDE)})`;
      if (tapToStartEl) tapToStartEl.textContent = i18n.tapToStart;

      const statsEl = this.titleScreen.querySelector('#title-stats') as HTMLElement;
      if (this.totalWins > 0) {
        statsEl.textContent = i18n.formatTotalPeeled(this.totalWins);
      } else {
        statsEl.textContent = '';
      }
      // Load leaderboard
      this.loadLeaderboard();
    }

    // Update game over screen texts (for language changes)
    if (screen === 'game_over') {
      const titleEl = this.gameOverScreen.querySelector('#game-over-title') as HTMLElement;
      const tapEl = this.gameOverScreen.querySelector('#game-over-tap') as HTMLElement;
      if (titleEl) titleEl.textContent = i18n.gameOver;
      if (tapEl) tapEl.textContent = i18n.tapToTryAgain;
    }

    // Update win screen texts (for language changes)
    if (screen === 'win') {
      const titleEl = this.winScreen.querySelector('#win-title') as HTMLElement;
      const tapEl = this.winScreen.querySelector('#win-tap') as HTMLElement;
      const shareBtn = this.winScreen.querySelector('#share-btn') as HTMLElement;
      if (titleEl) titleEl.textContent = i18n.youWin;
      if (tapEl) tapEl.textContent = i18n.tapToPlayAgain;
      if (shareBtn) shareBtn.textContent = i18n.share;
    }
  }

  private async loadLeaderboard(): Promise<void> {
    const container = this.titleScreen.querySelector('#title-leaderboard') as HTMLElement;
    const tabsContainer = this.titleScreen.querySelector('#leaderboard-tabs') as HTMLElement;
    const table = this.titleScreen.querySelector('#leaderboard-table') as HTMLTableElement;
    if (!container || !table || !tabsContainer) return;

    // Hide tabs - no tabs needed
    tabsContainer.style.display = 'none';

    // Use native Yandex leaderboard
    console.log('[Leaderboard] Fetching from Yandex SDK');
    const entries = await yandex.getYandexLeaderboard();
    console.log('[Leaderboard] Response:', entries);

    if (entries.length === 0) {
      table.innerHTML = `<tr><td style="color: #666; padding: 0.5rem;">${i18n.noScoresYet}</td></tr>`;
      container.style.display = 'block';
      return;
    }

    // Time leaderboard: show rank, name, time
    table.innerHTML = entries.map((entry) => {
      return `
        <tr>
          <td style="padding: 0.15rem 0.3rem; color: #ffaa66;">#${entry.rank}</td>
          <td style="padding: 0.15rem 0.3rem; color: #cccccc; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(entry.name)}</td>
          <td style="padding: 0.15rem 0.3rem; color: #88cc88;">${(entry.timeMs / 1000).toFixed(2)}s</td>
        </tr>
      `;
    }).join('');

    container.style.display = 'block';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

    // Use cached unpeeled meshes to avoid array allocations every frame
    if (this.meshCacheDirty) {
      const unpeeledCells = currentSide.cells.filter((c) => !c.peeled);
      this.unpeeledMeshCache = unpeeledCells.map((c) => c.mesh);
      this.meshCacheDirty = false;
    }
    const intersects = this.raycaster.intersectObjects(this.unpeeledMeshCache);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const cell = currentSide.cells.find((c) => c.mesh === hitMesh && !c.peeled);

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
    this.meshCacheDirty = true; // Invalidate cache when cell is peeled
    updateCellVisual(cell);

    // Make stem fall off when peeling TOP side (side 2)
    if (side.id === 2 && !this.stemFalling) {
      this.startStemFalling();
    }

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
      const peeledSides = this.state.sides.filter((s) => s.peeled).map((s) => s.id);
      console.log(`Side ${side.id} complete. Peeled sides: [${peeledSides.join(', ')}] (${peeledSides.length}/6)`);
      console.log(`Side ${side.id} cells:`, side.cells.map(c => `id=${c.id} peeled=${c.peeled} edges=[${c.edges.join(',')}]`).join(' | '));
      if (this.state.sides.every((s) => s.peeled)) {
        this.win();
        return;
      }

      // Transition to next side - only if LAST PEELED CELL touches an available side
      const validEdge = this.findValidTransitionEdge(cell, side);
      if (validEdge) {
        this.transitionToNextSide(validEdge);
      } else {
        // Last cell doesn't touch any unpeeled side - game over
        const cellEdges = cell.edges.filter(e => e !== 'center');
        console.log(`Last cell (id=${cell.id}, edges=[${cellEdges.join(',')}]) doesn't touch any unpeeled side`);
        this.gameOver(i18n.noValidExit);
      }
    }
  }

  // Find any edge from the last peeled cell that leads to an unpeeled side
  private findValidTransitionEdge(cell: PeelCell, side: MandarinSide): EdgeType | null {
    // Use cell.edges (pre-computed at cell creation) instead of recomputing
    // This ensures consistency with the edges the cell was classified with
    for (const edge of cell.edges) {
      if (edge === 'center') continue;
      const adjacentSideId = side.adjacent[edge];
      if (!this.state.sides[adjacentSideId].peeled) {
        return edge;
      }
    }

    return null;
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
    this.meshCacheDirty = true; // Invalidate cache for new side

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
    const { sides, group, totalCells } = createMandarin(this.CELLS_PER_SIDE);
    this.mandarinGroup = group;
    this.scene.add(group);

    // Get reference to stem for falling animation
    this.stem = group.getObjectByName('stem') as THREE.Group | null;
    this.stemFalling = false;
    this.stemVelocity.set(0, 0, 0);
    this.stemRotationVelocity.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    );

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

    // Start recording gameplay
    this.startRecording();

    // Reset camera
    this.camera.position.set(0, 0, 5.5);
    this.camera.lookAt(0, 0, 0);
    this.currentEntryAngle = 0; // Reset rotation mapping
    this.lastPeeledCellId = null; // Reset connectivity tracking
    this.meshCacheDirty = true; // Reset mesh cache for new game

    // Reset tilt state
    this.currentTilt.identity();
    this.targetTilt.identity();
    this.saveBaseCameraRotation();

    this.showScreen('playing');
    this.updateEdgeIndicators();
    this.updateStreakHUD();
  }

  private gameOver(reason: string): void {
    this.state.status = 'game_over';
    this.state.touchActive = false;
    this.hideEdgeIndicators();
    this.updateStreakHUD(); // Hide HUD
    this.startShowcaseRotation(); // Start rotating mandarin to show peeling

    // Stop recording (discard on game over)
    if (this.recorder) {
      this.recorder.cancel();
      this.recorder = null;
    }

    // Update stats
    this.totalTries++;
    this.saveStats();

    const elapsed = ((Date.now() - this.state.startTime) / 1000).toFixed(1);
    const reasonEl = this.gameOverScreen.querySelector('#game-over-reason') as HTMLElement;
    const statsEl = this.gameOverScreen.querySelector('#game-over-stats') as HTMLElement;
    const streakEl = this.gameOverScreen.querySelector('#game-over-streak') as HTMLElement;

    reasonEl.textContent = reason;
    statsEl.textContent = i18n.formatPeeled(this.state.peeledCount, this.state.totalCells, elapsed);
    streakEl.textContent = '';

    this.showScreen('game_over');
  }

  private async win(): Promise<void> {
    this.state.status = 'win';
    this.state.touchActive = false;
    this.hideEdgeIndicators();
    this.updateStreakHUD(); // Hide HUD
    this.startShowcaseRotation(); // Start rotating mandarin to show peeling

    // Calculate elapsed time
    const elapsedNum = (Date.now() - this.state.startTime) / 1000;
    const elapsed = elapsedNum.toFixed(1);

    // Update stats
    this.totalTries++;
    this.totalWins++;
    this.saveStats();

    const statsEl = this.winScreen.querySelector('#win-stats') as HTMLElement;
    const streakEl = this.winScreen.querySelector('#win-streak') as HTMLElement;
    const leaderboardEl = this.winScreen.querySelector('#win-leaderboard') as HTMLElement;
    const shareBtn = this.winScreen.querySelector('#share-btn') as HTMLButtonElement;

    statsEl.textContent = i18n.formatTime(elapsed);
    streakEl.textContent = i18n.formatTotalPeeled(this.totalWins);

    // Hide share button on Yandex (no native share API)
    if (shareBtn) {
      shareBtn.style.display = 'none';
    }

    // Show download clip button with loading state while recording finalizes
    const downloadClipBtn = this.winScreen.querySelector('#download-clip-btn') as HTMLButtonElement;
    if (downloadClipBtn && this.recorder) {
      downloadClipBtn.style.display = 'block';
      downloadClipBtn.disabled = true;
      downloadClipBtn.textContent = `⏳ ${i18n.savingClip}`;

      // Delay stopping recording to capture final peel animation and juice burst
      this.finalizeRecording().then(() => {
        downloadClipBtn.disabled = false;
        downloadClipBtn.textContent = `📹 ${i18n.saveClip}`;
      });
    } else if (downloadClipBtn) {
      downloadClipBtn.style.display = this.lastRecordedBlob ? 'block' : 'none';
    }

    // Submit score to Yandex leaderboard
    const elapsedMs = Math.round(elapsedNum * 1000);
    console.log('[Score] Submitting to Yandex:', { timeMs: elapsedMs });
    await yandex.submitToYandexLeaderboard(elapsedMs);

    // Hide leaderboard info on win screen (shown on title screen instead)
    if (leaderboardEl) {
      leaderboardEl.style.display = 'none';
    }

    // Start orbit animation for the peel strip
    if (this.peelStrip) {
      this.peelStrip.startOrbit();
    }

    // Spray juice towards the player's face!
    this.spawnVictoryJuiceBurst();

    this.showScreen('win');
  }

  private async returnToTitle(): Promise<void> {
    this.state.status = 'title';
    this.stopShowcaseRotation();

    // Show interstitial ad between sessions
    await yandex.showInterstitialAd();

    this.showScreen('title');
  }

  private async handleShare(): Promise<void> {
    // Share not available on Yandex - button is hidden
    this.returnToTitle();
  }

  // ============================================================================
  // Video Recording
  // ============================================================================

  private startRecording(): void {
    if (!GAME_SETTINGS.enableClipRecording) return;

    // Cancel any previous recording
    this.recorder?.cancel();

    if (!GameRecorder.isSupported()) {
      console.log('[Game] Recording not supported in this browser');
      return;
    }

    this.recorder = new GameRecorder(this.renderer.domElement);
    this.recorder.start();
  }

  private async stopRecording(): Promise<Blob | null> {
    if (!this.recorder) {
      return null;
    }

    const blob = await this.recorder.stop();
    this.lastRecordedBlob = blob;
    this.recorder = null;

    return blob;
  }

  // Finalize recording with delay to capture final animations
  private async finalizeRecording(): Promise<void> {
    // Wait for peel strip to complete orbit around mandarin (~3 seconds for full circle)
    await new Promise(resolve => setTimeout(resolve, 4000));
    await this.stopRecording();
  }

  // Get the last recorded video blob (for sharing)
  getLastRecordedBlob(): Blob | null {
    return this.lastRecordedBlob;
  }

  // Download the last recorded clip
  downloadLastClip(): void {
    if (this.lastRecordedBlob) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      GameRecorder.downloadBlob(this.lastRecordedBlob, `mandarin-${timestamp}.webm`);
    }
  }

  private handleResize(): void {
    // Debounce resize to avoid geometry thrashing
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Update camera and renderer immediately for smooth resizing
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Debounce geometry recreation (expensive operation)
    this.resizeTimeout = setTimeout(() => {
      this.updateEdgeIndicatorPositions();
    }, 100);
  }

  // Refresh UI after language change
  refreshUI(): void {
    this.showScreen(this.state.status);
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
      this.updateStemFalling(deltaTime);
      this.updateShowcaseRotation(deltaTime);
      this.peelStrip?.update(deltaTime);
      this.positionEdgeIndicatorsToCamera();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
