const CHRISTMAS_EMOJI = ['🎄', '⭐', '🎁', '❄️', '🔔', '🎅', '🦌', '🕯️', '✨', '🍪', '🍊'];

interface FloatingEmoji {
  element: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  floatOffset: number;
  floatSpeed: number;
  size: number;
  // Dance properties
  dancePhase: number;
  danceSpeed: number;
  rotationSpeed: number;
  scalePhase: number;
}

export class ChristmasEmojiBackground {
  private emojis: FloatingEmoji[] = [];
  private container: HTMLDivElement;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private baseCount: number;
  private speedMultiplier: number = 1;

  constructor(count: number = 20) {
    this.baseCount = count;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
      background: #0d2818;
    `;
    document.body.insertBefore(this.container, document.body.firstChild);

    this.createEmojis(count);
    this.startAnimation();
  }

  private createEmoji(): FloatingEmoji {
    const emoji = CHRISTMAS_EMOJI[Math.floor(Math.random() * CHRISTMAS_EMOJI.length)];

    const element = document.createElement('div');
    const size = 16 + Math.random() * 64; // 16-80px
    element.textContent = emoji;
    element.style.cssText = `
      position: absolute;
      font-size: ${size}px;
      opacity: 0.5;
      user-select: none;
      filter: blur(${Math.random() > 0.7 ? 1 : 0}px);
      transition: transform 0.1s ease-out;
    `;

    const x = Math.random() * 100;
    const y = Math.random() * 100;

    element.style.left = `${x}%`;
    element.style.top = `${y}%`;

    this.container.appendChild(element);

    return {
      element,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: 3 + Math.random() * 5,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
      size,
      dancePhase: Math.random() * Math.PI * 2,
      danceSpeed: 2 + Math.random() * 3,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scalePhase: Math.random() * Math.PI * 2,
    };
  }

  private createEmojis(count: number): void {
    for (let i = 0; i < count; i++) {
      this.emojis.push(this.createEmoji());
    }
  }

  // Add or remove emojis and adjust speed for level changes
  setLevel(level: number): void {
    const targetCount = this.baseCount + level * 5; // +5 emojis per level

    // Add emojis if needed
    while (this.emojis.length < targetCount) {
      this.emojis.push(this.createEmoji());
    }

    // Remove excess emojis if level decreased
    while (this.emojis.length > targetCount) {
      const emoji = this.emojis.pop();
      if (emoji) {
        emoji.element.remove();
      }
    }

    // Speed up with each level: 1x, 1.2x, 1.4x, 1.6x, etc.
    this.speedMultiplier = 1 + level * 0.2;
  }

  private startAnimation(): void {
    this.lastTime = performance.now();

    const animate = (now: number) => {
      const deltaTime = (now - this.lastTime) / 1000;
      this.lastTime = now;

      const time = now / 1000;

      for (const emoji of this.emojis) {
        // Apply speed multiplier to time-based calculations
        const speed = this.speedMultiplier;

        // Floating motion
        const floatX = Math.sin(time * emoji.floatSpeed * speed + emoji.floatOffset) * 0.5;

        // Update position (faster fall and drift with higher levels)
        emoji.x += (emoji.vx + floatX) * deltaTime * speed;
        emoji.y += emoji.vy * deltaTime * speed;

        // Wrap around
        if (emoji.y > 105) {
          emoji.y = -5;
          emoji.x = Math.random() * 100;
        }
        if (emoji.x < -5) emoji.x = 105;
        if (emoji.x > 105) emoji.x = -5;

        emoji.element.style.left = `${emoji.x}%`;
        emoji.element.style.top = `${emoji.y}%`;

        // Dancing transforms - pulsate, rotate, and scale (faster with higher levels)
        const danceTime = time * speed;
        const danceRotation = Math.sin(danceTime * emoji.danceSpeed + emoji.dancePhase) * 15;
        const danceScale = 1 + Math.sin(danceTime * emoji.danceSpeed * 1.5 + emoji.scalePhase) * 0.15;
        const danceX = Math.sin(danceTime * emoji.danceSpeed * 0.7 + emoji.dancePhase) * 5;
        const danceY = Math.cos(danceTime * emoji.danceSpeed * 0.9 + emoji.dancePhase) * 3;

        emoji.element.style.transform = `
          translate(${danceX}px, ${danceY}px)
          rotate(${danceRotation}deg)
          scale(${danceScale})
        `;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.container.remove();
    this.emojis = [];
  }
}
