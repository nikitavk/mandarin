import { Game } from './game';
import { yandex } from './yandex';
import { ChristmasEmojiBackground } from './christmasEmoji';

// Prevent context menu and text selection on mobile (Yandex Games requirement 1.6.2.7)
document.addEventListener('contextmenu', (e) => e.preventDefault(), { capture: true });
document.addEventListener('selectstart', (e) => e.preventDefault(), { capture: true });
document.addEventListener('dragstart', (e) => e.preventDefault(), { capture: true });

// Extra prevention for long-press context menu on mobile
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
document.addEventListener('touchstart', () => {
  longPressTimer = setTimeout(() => {
    // Do nothing - just prevent default long-press behavior
  }, 500);
}, { passive: true });
document.addEventListener('touchend', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}, { passive: true });
document.addEventListener('touchmove', () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}, { passive: true });

// Initialize Yandex SDK before starting game
yandex.init().then(() => {
  // Create background with floating Christmas emojis (reduced for mobile perf)
  new ChristmasEmojiBackground(10);

  const game = new Game();
  game.start();
});
