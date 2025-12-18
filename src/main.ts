import { Game } from './game';
import { yandex } from './yandex';
import { ChristmasEmojiBackground } from './christmasEmoji';

// Initialize Yandex SDK before starting game
yandex.init().then(() => {
  // Create background with floating Christmas emojis (reduced for mobile perf)
  new ChristmasEmojiBackground(10);

  const game = new Game();
  game.start();
});
