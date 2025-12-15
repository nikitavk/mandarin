import * as THREE from 'three';

// Abstract organic texture generation for mandarin

// Simple noise function for texture generation
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// Smooth noise with interpolation
function smoothNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  const v00 = noise2D(x0, y0);
  const v10 = noise2D(x0 + 1, y0);
  const v01 = noise2D(x0, y0 + 1);
  const v11 = noise2D(x0 + 1, y0 + 1);

  // Smooth interpolation
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  return v00 * (1 - sx) * (1 - sy) +
         v10 * sx * (1 - sy) +
         v01 * (1 - sx) * sy +
         v11 * sx * sy;
}

// Fractal Brownian Motion for organic patterns
function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// Voronoi-like cellular pattern
function cellularNoise(x: number, y: number, scale: number = 1): number {
  const sx = x * scale;
  const sy = y * scale;
  const cellX = Math.floor(sx);
  const cellY = Math.floor(sy);

  let minDist = 10;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = cellX + dx;
      const cy = cellY + dy;

      // Random point in cell
      const px = cx + noise2D(cx * 127.1, cy * 311.7);
      const py = cy + noise2D(cx * 269.5, cy * 183.3);

      const dist = Math.sqrt((sx - px) ** 2 + (sy - py) ** 2);
      minDist = Math.min(minDist, dist);
    }
  }

  return minDist;
}

// Create abstract orange peel texture (for the outer peel cells)
export function createPeelTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      // Base orange color - bright vibrant orange for peel
      let r = 255;
      let g = 120;
      let b = 20;

      // Large cellular pattern (pores on orange skin)
      const cell1 = cellularNoise(u * 8 + 0.5, v * 8 + 0.5, 3);
      const pores = Math.pow(cell1, 0.5) * 0.3;

      // Fine grain texture
      const fine = fbm(u * 30, v * 30, 3) * 0.15;

      // Medium organic variation
      const organic = fbm(u * 12 + 100, v * 12, 4) * 0.2;

      // Subtle color variation
      const colorVar = fbm(u * 6, v * 6 + 50, 2);

      // Combine all effects - keep brightness high for vibrant orange
      const brightness = 0.85 + pores * 0.1 + fine * 0.05 + organic * 0.1;

      // Add subtle color shifts
      r = Math.min(255, Math.max(0, r * brightness + colorVar * 15));
      g = Math.min(255, Math.max(0, g * brightness + colorVar * 5));
      b = Math.min(255, Math.max(0, b * brightness));

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  return texture;
}

// Create abstract inner body texture (lighter, more fibrous)
export function createBodyTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      // Light orange for the inner flesh (lighter than peel)
      let r = 255;
      let g = 180;
      let b = 100;

      // Fibrous radial pattern from center
      const cx = u - 0.5;
      const cy = v - 0.5;
      const angle = Math.atan2(cy, cx);
      const dist = Math.sqrt(cx * cx + cy * cy);

      // Radial fibers
      const fibers = Math.sin(angle * 20 + dist * 10) * 0.5 + 0.5;
      const fiberNoise = fbm(angle * 3, dist * 8, 3);

      // Organic membrane texture
      const membrane = fbm(u * 15, v * 15, 4) * 0.25;

      // Subtle pitting
      const pits = cellularNoise(u * 6, v * 6, 4) * 0.15;

      // Combine - keep it bright
      const brightness = 0.85 + fibers * 0.05 + fiberNoise * 0.05 + membrane * 0.05 + pits * 0.05;

      r = Math.min(255, Math.max(0, r * brightness));
      g = Math.min(255, Math.max(0, g * brightness));
      b = Math.min(255, Math.max(0, b * brightness));

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  return texture;
}

// Create a normal map for the peel to add depth
export function createPeelNormalMap(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  // Generate height map first
  const heightMap: number[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      // Pores and bumps
      const cell = cellularNoise(u * 8, v * 8, 3);
      const fine = fbm(u * 25, v * 25, 3);

      heightMap.push(cell * 0.7 + fine * 0.3);
    }
  }

  // Convert height map to normal map
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;

      // Sample neighboring heights
      const left = heightMap[y * size + Math.max(0, x - 1)];
      const right = heightMap[y * size + Math.min(size - 1, x + 1)];
      const up = heightMap[Math.max(0, y - 1) * size + x];
      const down = heightMap[Math.min(size - 1, y + 1) * size + x];

      // Calculate normal
      const dx = (right - left) * 2;
      const dy = (down - up) * 2;

      // Normal in tangent space (z points up)
      let nx = -dx;
      let ny = -dy;
      let nz = 1;

      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      // Convert to 0-255 range
      const pixelIdx = idx * 4;
      data[pixelIdx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[pixelIdx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[pixelIdx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[pixelIdx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  return texture;
}

// Cached textures
let cachedPeelTexture: THREE.CanvasTexture | null = null;
let cachedPeelNormalMap: THREE.CanvasTexture | null = null;
let cachedBodyTexture: THREE.CanvasTexture | null = null;

export function getPeelTexture(): THREE.CanvasTexture {
  if (!cachedPeelTexture) {
    cachedPeelTexture = createPeelTexture(256);
  }
  return cachedPeelTexture;
}

export function getPeelNormalMap(): THREE.CanvasTexture {
  if (!cachedPeelNormalMap) {
    cachedPeelNormalMap = createPeelNormalMap(256);
  }
  return cachedPeelNormalMap;
}

export function getBodyTexture(): THREE.CanvasTexture {
  if (!cachedBodyTexture) {
    cachedBodyTexture = createBodyTexture(256);
  }
  return cachedBodyTexture;
}
