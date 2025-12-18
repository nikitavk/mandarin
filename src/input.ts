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

  // Cached rect to avoid layout reflow on every touch event
  private cachedRect: DOMRect | null = null;

  // Pre-bound event handlers to allow proper removal
  private boundHandleResize: () => void;
  private boundHandleDown: (e: MouseEvent) => void;
  private boundHandleMove: (e: MouseEvent) => void;
  private boundHandleUp: (e: MouseEvent | TouchEvent) => void;
  private boundHandleTouchStart: (e: TouchEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;
  private boundPreventContextMenu: (e: Event) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.state = {
      isDown: false,
      position: new THREE.Vector2(),
      normalizedPosition: new THREE.Vector2(),
    };

    // Bind all handlers once for proper add/remove
    this.boundHandleResize = this.invalidateRect.bind(this);
    this.boundHandleDown = this.handleDown.bind(this);
    this.boundHandleMove = this.handleMove.bind(this);
    this.boundHandleUp = this.handleUp.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundPreventContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('resize', this.boundHandleResize);
    this.setupListeners();
  }

  private invalidateRect(): void {
    this.cachedRect = null;
  }

  private getRect(): DOMRect {
    if (!this.cachedRect) {
      this.cachedRect = this.canvas.getBoundingClientRect();
    }
    return this.cachedRect;
  }

  private setupListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.boundHandleDown);
    this.canvas.addEventListener('mousemove', this.boundHandleMove);
    this.canvas.addEventListener('mouseup', this.boundHandleUp);
    this.canvas.addEventListener('mouseleave', this.boundHandleUp);

    // Touch events
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.boundHandleTouchEnd);

    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', this.boundPreventContextMenu);
  }

  private updatePosition(clientX: number, clientY: number): void {
    const rect = this.getRect();
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
    window.removeEventListener('resize', this.boundHandleResize);
    this.canvas.removeEventListener('mousedown', this.boundHandleDown);
    this.canvas.removeEventListener('mousemove', this.boundHandleMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleUp);
    this.canvas.removeEventListener('mouseleave', this.boundHandleUp);
    this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    this.canvas.removeEventListener('contextmenu', this.boundPreventContextMenu);
  }
}
