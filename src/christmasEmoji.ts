const CHRISTMAS_EMOJI = ['🎄', '⭐', '🎁', '❄️', '🔔', '🎅', '🦌', '🕯️', '✨', '🍪', '🍊'];

// CSS-only animated Christmas emoji background (GPU-accelerated, no JS animation loop)
export class ChristmasEmojiBackground {
  private container: HTMLDivElement;
  private styleSheet: HTMLStyleElement;

  constructor(count: number = 10) {
    // Inject CSS keyframes once
    this.styleSheet = document.createElement('style');
    this.styleSheet.textContent = `
      @keyframes emoji-fall {
        from { transform: translateY(-10vh); }
        to { transform: translateY(110vh); }
      }
      @keyframes emoji-sway {
        0%, 100% { margin-left: 0; }
        50% { margin-left: 20px; }
      }
      @keyframes emoji-dance {
        0%, 100% {
          transform: rotate(-10deg) scale(1);
        }
        25% {
          transform: rotate(10deg) scale(1.1);
        }
        50% {
          transform: rotate(-5deg) scale(0.95);
        }
        75% {
          transform: rotate(8deg) scale(1.05);
        }
      }
      .falling-emoji {
        position: absolute;
        opacity: 0.5;
        user-select: none;
        will-change: transform, margin-left;
        animation:
          emoji-fall var(--fall-duration) linear infinite,
          emoji-sway var(--sway-duration) ease-in-out infinite;
      }
      .falling-emoji span {
        display: inline-block;
        animation: emoji-dance var(--dance-duration) ease-in-out infinite;
      }
    `;
    document.head.appendChild(this.styleSheet);

    // Create container
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

    // Create emojis with randomized CSS animations
    this.createEmojis(count);
  }

  private createEmojis(count: number): void {
    for (let i = 0; i < count; i++) {
      const emoji = CHRISTMAS_EMOJI[Math.floor(Math.random() * CHRISTMAS_EMOJI.length)];
      const size = 20 + Math.random() * 50; // 20-70px

      const element = document.createElement('div');
      element.className = 'falling-emoji';
      element.innerHTML = `<span>${emoji}</span>`;

      // Randomize animation parameters via CSS variables
      const fallDuration = 15 + Math.random() * 20; // 15-35s
      const swayDuration = 3 + Math.random() * 4; // 3-7s
      const danceDuration = 2 + Math.random() * 3; // 2-5s
      const startDelay = -Math.random() * fallDuration; // Start at random point in animation

      element.style.cssText += `
        left: ${Math.random() * 100}%;
        font-size: ${size}px;
        --fall-duration: ${fallDuration}s;
        --sway-duration: ${swayDuration}s;
        --dance-duration: ${danceDuration}s;
        animation-delay: ${startDelay}s, ${-Math.random() * swayDuration}s;
        filter: blur(${Math.random() > 0.7 ? 1 : 0}px);
      `;

      // Randomize dance animation delay for the inner span
      const span = element.querySelector('span') as HTMLSpanElement;
      span.style.animationDelay = `${-Math.random() * danceDuration}s`;

      this.container.appendChild(element);
    }
  }

  dispose(): void {
    this.container.remove();
    this.styleSheet.remove();
  }
}
