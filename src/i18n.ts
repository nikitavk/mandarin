// Internationalization module with auto language detection

export type Language = 'en' | 'ru';

export interface Translations {
  // Title screen
  title: string;
  subtitle: string;
  tapToStart: string;

  // Game over screen
  gameOver: string;
  tapToTryAgain: string;

  // Win screen
  youWin: string;
  tapToPlayAgain: string;

  // Stats
  wins: string; // "Wins: {wins}/{total}"
  streak: string; // "Streak: {streak}"
  statsFormat: string; // "Wins: {wins}/{total} | Streak: {streak}"
  peeled: string; // "Peeled {count}/{total} cells in {time}s"
  time: string; // "Time: {time}s"

  // Game over reasons
  liftedFinger: string;
  mustPeelConnected: string;
  endedOnCenter: string;
  noValidExit: string;
  sideAlreadyPeeled: string; // "Side {side} already peeled!"

  // Side names
  sides: {
    front: string;
    back: string;
    top: string;
    bottom: string;
    left: string;
    right: string;
  };

  // Page title
  pageTitle: string;
}

const en: Translations = {
  title: 'Mandarin',
  subtitle: 'Peel the mandarin in one touch',
  tapToStart: 'Tap to start',

  gameOver: 'Game Over',
  tapToTryAgain: 'Tap to try again',

  youWin: 'You Win!',
  tapToPlayAgain: 'Tap to play again',

  wins: 'Wins',
  streak: 'Streak',
  statsFormat: 'Wins: {wins}/{total} | Streak: {streak}',
  peeled: 'Peeled {count}/{total} cells in {time}s',
  time: 'Time: {time}s',

  liftedFinger: 'You lifted your finger!',
  mustPeelConnected: 'Must peel connected cells!',
  endedOnCenter: 'Ended on center cell!',
  noValidExit: 'No valid exit - all adjacent sides peeled!',
  sideAlreadyPeeled: 'Side {side} already peeled!',

  sides: {
    front: 'Front',
    back: 'Back',
    top: 'Top',
    bottom: 'Bottom',
    left: 'Left',
    right: 'Right',
  },

  pageTitle: 'Mandarin Peeling Game',
};

const ru: Translations = {
  title: 'Мандарин',
  subtitle: 'Очисти мандарин одним касанием',
  tapToStart: 'Нажми, чтобы начать',

  gameOver: 'Игра окончена',
  tapToTryAgain: 'Нажми, чтобы попробовать снова',

  youWin: 'Победа!',
  tapToPlayAgain: 'Нажми, чтобы играть снова',

  wins: 'Побед',
  streak: 'Серия',
  statsFormat: 'Побед: {wins}/{total} | Серия: {streak}',
  peeled: 'Очищено {count}/{total} долек за {time}с',
  time: 'Время: {time}с',

  liftedFinger: 'Ты оторвал палец!',
  mustPeelConnected: 'Нужно чистить соседние дольки!',
  endedOnCenter: 'Закончил на центральной дольке!',
  noValidExit: 'Нет выхода - все соседние стороны очищены!',
  sideAlreadyPeeled: 'Сторона {side} уже очищена!',

  sides: {
    front: 'Передняя',
    back: 'Задняя',
    top: 'Верхняя',
    bottom: 'Нижняя',
    left: 'Левая',
    right: 'Правая',
  },

  pageTitle: 'Игра: Чистим мандарин',
};

const translations: Record<Language, Translations> = { en, ru };

// Detect language from browser/system settings
function detectLanguage(): Language {
  // Check localStorage for user preference first
  try {
    const saved = localStorage.getItem('mandarin-language');
    if (saved === 'en' || saved === 'ru') {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }

  // Get browser language
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const lang = browserLang.toLowerCase().split('-')[0];

  // Return Russian for ru, otherwise default to English
  return lang === 'ru' ? 'ru' : 'en';
}

class I18n {
  private currentLang: Language;
  private t: Translations;

  constructor() {
    this.currentLang = detectLanguage();
    this.t = translations[this.currentLang];
    this.updatePageTitle();
  }

  get lang(): Language {
    return this.currentLang;
  }

  setLanguage(lang: Language): void {
    this.currentLang = lang;
    this.t = translations[lang];
    try {
      localStorage.setItem('mandarin-language', lang);
    } catch {
      // Ignore localStorage errors
    }
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    document.title = this.t.pageTitle;
  }

  get translations(): Translations {
    return this.t;
  }

  // Helper method to format strings with placeholders
  format(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) =>
      String(values[key] ?? `{${key}}`)
    );
  }

  // Convenience getters for common strings
  get title(): string { return this.t.title; }
  get subtitle(): string { return this.t.subtitle; }
  get tapToStart(): string { return this.t.tapToStart; }
  get gameOver(): string { return this.t.gameOver; }
  get tapToTryAgain(): string { return this.t.tapToTryAgain; }
  get youWin(): string { return this.t.youWin; }
  get tapToPlayAgain(): string { return this.t.tapToPlayAgain; }
  get liftedFinger(): string { return this.t.liftedFinger; }
  get mustPeelConnected(): string { return this.t.mustPeelConnected; }
  get endedOnCenter(): string { return this.t.endedOnCenter; }
  get noValidExit(): string { return this.t.noValidExit; }

  formatStats(wins: number, total: number, streak: number): string {
    return this.format(this.t.statsFormat, { wins, total, streak });
  }

  formatPeeled(count: number, total: number, time: string): string {
    return this.format(this.t.peeled, { count, total, time });
  }

  formatTime(time: string): string {
    return this.format(this.t.time, { time });
  }

  formatSideAlreadyPeeled(sideName: string): string {
    return this.format(this.t.sideAlreadyPeeled, { side: sideName });
  }

  getSideName(sideIndex: number): string {
    const sideKeys: (keyof Translations['sides'])[] = ['front', 'back', 'top', 'bottom', 'left', 'right'];
    return this.t.sides[sideKeys[sideIndex]] ?? `Side ${sideIndex}`;
  }
}

// Singleton instance
export const i18n = new I18n();
