// GameRecorder - Records gameplay clips using MediaRecorder API
// Captures the WebGL canvas stream and produces a video blob
// Uses a compositing canvas to add background color without affecting the game display

export class GameRecorder {
  private sourceCanvas: HTMLCanvasElement;
  private compositeCanvas: HTMLCanvasElement;
  private compositeCtx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  // Recording state
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;

  // Configuration
  private readonly frameRate: number = 30;
  private readonly videoBitsPerSecond: number = 2500000; // 2.5 Mbps for good quality
  private readonly backgroundColor: string = '#14321e'; // Festive dark green

  constructor(canvas: HTMLCanvasElement) {
    this.sourceCanvas = canvas;

    // Create offscreen composite canvas
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = canvas.width;
    this.compositeCanvas.height = canvas.height;
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;
  }

  // Check if recording is supported in this browser
  static isSupported(): boolean {
    return !!(
      typeof MediaRecorder !== 'undefined' &&
      HTMLCanvasElement.prototype.captureStream
    );
  }

  // Get the best supported MIME type for recording
  private getSupportedMimeType(): string {
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return 'video/webm'; // Fallback
  }

  // Composite frame: draw background + source canvas
  private compositeFrame(): void {
    // Update composite canvas size if source changed
    if (this.compositeCanvas.width !== this.sourceCanvas.width ||
        this.compositeCanvas.height !== this.sourceCanvas.height) {
      this.compositeCanvas.width = this.sourceCanvas.width;
      this.compositeCanvas.height = this.sourceCanvas.height;
    }

    // Draw green background
    this.compositeCtx.fillStyle = this.backgroundColor;
    this.compositeCtx.fillRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);

    // Draw source canvas (WebGL) on top
    this.compositeCtx.drawImage(this.sourceCanvas, 0, 0);
  }

  // Animation loop to continuously composite frames
  private startCompositing(): void {
    const loop = () => {
      if (!this.isRecording) return;
      this.compositeFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopCompositing(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Start recording the canvas
  start(): boolean {
    if (this.isRecording) {
      console.warn('[Recorder] Already recording');
      return false;
    }

    if (!GameRecorder.isSupported()) {
      console.warn('[Recorder] MediaRecorder not supported');
      return false;
    }

    try {
      // Initial composite to set up canvas
      this.compositeFrame();

      // Capture stream from composite canvas (not source)
      this.stream = this.compositeCanvas.captureStream(this.frameRate);

      const mimeType = this.getSupportedMimeType();
      console.log('[Recorder] Using MIME type:', mimeType);

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: this.videoBitsPerSecond,
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('[Recorder] Error:', event);
      };

      // Request data every second for safety
      this.mediaRecorder.start(1000);
      this.isRecording = true;
      this.recordingStartTime = performance.now();

      // Start compositing loop
      this.startCompositing();

      console.log('[Recorder] Started recording');
      return true;
    } catch (error) {
      console.error('[Recorder] Failed to start:', error);
      return false;
    }
  }

  // Stop recording and return the video blob
  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        console.warn('[Recorder] Not recording');
        resolve(null);
        return;
      }

      const duration = performance.now() - this.recordingStartTime;
      console.log('[Recorder] Stopping after', (duration / 1000).toFixed(1), 'seconds');

      // Stop compositing loop
      this.stopCompositing();

      this.mediaRecorder.onstop = () => {
        const mimeType = this.getSupportedMimeType();
        const blob = new Blob(this.recordedChunks, { type: mimeType });

        console.log('[Recorder] Created blob:', blob.size, 'bytes');

        // Cleanup
        this.cleanup();

        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  // Cancel recording without producing output
  cancel(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    console.log('[Recorder] Cancelled');

    // Stop compositing loop
    this.stopCompositing();

    try {
      this.mediaRecorder.stop();
    } catch {
      // Ignore errors when cancelling
    }

    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;
    this.recordedChunks = [];

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
  }

  // Check if currently recording
  getIsRecording(): boolean {
    return this.isRecording;
  }

  // Get recording duration in seconds
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return (performance.now() - this.recordingStartTime) / 1000;
  }

  // Convert blob to data URL for sharing
  static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Download the video blob as a file
  static downloadBlob(blob: Blob, filename: string = 'mandarin-peel.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Create a shareable URL (for platforms that support it)
  static async createShareableFile(blob: Blob, filename: string = 'mandarin-peel.webm'): Promise<File> {
    return new File([blob], filename, { type: blob.type });
  }
}
