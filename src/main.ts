import { Game } from './game';
import { lineInitPromise } from './line';
import { ChristmasEmojiBackground } from './christmasEmoji';

// Wait for LINE SDK to initialize before starting game
// This ensures line.isInClient is accurate when UI is created
lineInitPromise.then(() => {
  // Create background with floating Christmas emojis (reduced for mobile perf)
  new ChristmasEmojiBackground(10);

  const game = new Game();
  game.start();
});
