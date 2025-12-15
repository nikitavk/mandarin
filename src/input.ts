import * as THREE from 'three';

export interface InputState {
  isDown: boolean;
  position: THREE.Vector2;
  normalizedPosition: THREE.Vector2; // -1 to 1
}

export type InputCallback = (state: InputState) => void;

export class InputManager {
  private canvas: HTMLCanvasElement;
  private state: InputState;
  private onDown: InputCallback | null = null;
  private onMove: InputCallback | null = null;
  private onUp: InputCallback | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.state = {
      isDown: false,
      position: new THREE.Vector2(),
      normalizedPosition: new THREE.Vector2(),
    };

    this.setupListeners();
  }

  private setupListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleUp.bind(this));

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private updatePosition(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.state.position.set(clientX - rect.left, clientY - rect.top);

    // Normalize to -1 to 1
    this.state.normalizedPosition.set(
      (this.state.position.x / rect.width) * 2 - 1,
      -(this.state.position.y / rect.height) * 2 + 1
    );
  }

  private handleDown(e: MouseEvent): void {
    e.preventDefault();
    this.state.isDown = true;
    this.updatePosition(e.clientX, e.clientY);
    this.onDown?.(this.state);
  }

  private handleMove(e: MouseEvent): void {
    this.updatePosition(e.clientX, e.clientY);
    if (this.state.isDown) {
      this.onMove?.(this.state);
    }
  }

  private handleUp(_e: MouseEvent | TouchEvent): void {
    if (this.state.isDown) {
      this.state.isDown = false;
      this.onUp?.(this.state);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.state.isDown = true;
      this.updatePosition(touch.clientX, touch.clientY);
      this.onDown?.(this.state);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.state.isDown) {
      const touch = e.touches[0];
      this.updatePosition(touch.clientX, touch.clientY);
      this.onMove?.(this.state);
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0 && this.state.isDown) {
      this.state.isDown = false;
      this.onUp?.(this.state);
    }
  }

  setOnDown(callback: InputCallback): void {
    this.onDown = callback;
  }

  setOnMove(callback: InputCallback): void {
    this.onMove = callback;
  }

  setOnUp(callback: InputCallback): void {
    this.onUp = callback;
  }

  getState(): InputState {
    return this.state;
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleUp.bind(this));
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
  }
}
