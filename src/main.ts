import { Game } from './game';
import { yandex } from './yandex';
import { ChristmasEmojiBackground } from './christmasEmoji';
import { setLanguageFromYandex } from './i18n';

// Prevent context menu and text selection on mobile (Yandex Games requirement 1.6.2.7)
const preventEvent = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

// Block all context menu triggers
document.addEventListener('contextmenu', preventEvent, { capture: true });
document.addEventListener('selectstart', preventEvent, { capture: true });
document.addEventListener('dragstart', preventEvent, { capture: true });
document.addEventListener('copy', preventEvent, { capture: true });
document.addEventListener('cut', preventEvent, { capture: true });

// Block long-press on touch devices
let touchTimer: ReturnType<typeof setTimeout> | null = null;

document.addEventListener('touchstart', (e) => {
  // Clear any existing timer
  if (touchTimer) clearTimeout(touchTimer);

  // Prevent default to stop long-press menu
  e.preventDefault();

  // Set a timer to cancel if user holds too long (backup prevention)
  touchTimer = setTimeout(() => {
    touchTimer = null;
  }, 400);
}, { passive: false, capture: true });

document.addEventListener('touchend', () => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
}, { passive: true, capture: true });

document.addEventListener('touchcancel', () => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
}, { passive: true, capture: true });

document.addEventListener('touchmove', () => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
}, { passive: true, capture: true });

// Initialize Yandex SDK before starting game
yandex.init().then(() => {
  // Set language from Yandex SDK BEFORE creating game UI
  if (yandex.isAvailable) {
    setLanguageFromYandex(yandex.language);
  }

  // Create background with floating Christmas emojis (reduced for mobile perf)
  new ChristmasEmojiBackground(10);

  const game = new Game();
  game.start();
});
