import { Game } from './game';
import { lineInitPromise } from './line';

// Wait for LINE SDK to initialize before starting game
// This ensures line.isInClient is accurate when UI is created
lineInitPromise.then(() => {
  const game = new Game();
  game.start();
});
