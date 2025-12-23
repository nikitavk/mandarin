// Internationalization module - EN/RU only for Yandex Games

export type Language = 'en' | 'ru';

export interface Translations {
  title: string;
  subtitle: string;
  tapToStart: string;
  gameOver: string;
  tapToTryAgain: string;
  youWin: string;
  tapToPlayAgain: string;
  wins: string;
  streak: string;
  statsFormat: string;
  peeled: string;
  time: string;
  liftedFinger: string;
  mustPeelConnected: string;
  endedOnCenter: string;
  noValidExit: string;
  sideAlreadyPeeled: string;
  sides: {
    front: string;
    back: string;
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  pageTitle: string;
  leaderboard: string;
  bestTime: string;
  rank: string;
  newRecord: string;
  donateStars: string;
  share: string;
  shareText: string;
  totalPeeled: string;
  cellsCount: string;
  noScoresYet: string;
  saveClip: string;
  savingClip: string;
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
  pageTitle: 'Mandarin',
  leaderboard: 'Leaderboard',
  bestTime: 'Best: {time}s',
  rank: 'Rank: #{rank}',
  newRecord: 'New Record!',
  donateStars: 'Donate Stars',
  share: 'Send to a friend',
  shareText: 'I PEELED IT FOR YOU in {time}s! Can you beat my time?',
  totalPeeled: 'Total mandarins peeled: {count}',
  cellsCount: '{count} cells',
  noScoresYet: 'No scores yet',
  saveClip: 'Save Clip',
  savingClip: 'Saving...',
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
  pageTitle: 'Мандарин',
  leaderboard: 'Таблица лидеров',
  bestTime: 'Лучшее: {time}с',
  rank: 'Место: #{rank}',
  newRecord: 'Новый рекорд!',
  donateStars: 'Задонатить звёзды',
  share: 'Отправить другу',
  shareText: 'Я ПОЧИСТИЛ ЕГО ДЛЯ ТЕБЯ за {time}с! Сможешь быстрее?',
  totalPeeled: 'Всего мандаринов очищено: {count}',
  cellsCount: '{count} долек',
  noScoresYet: 'Пока нет результатов',
  saveClip: 'Сохранить видео',
  savingClip: 'Сохранение...',
};

const translations: Record<Language, Translations> = { en, ru };

function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem('mandarin-language');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch {}

  const browserLang = navigator.language?.toLowerCase().split('-')[0] || 'ru';
  return browserLang === 'en' ? 'en' : 'ru';
}

class I18n {
  private currentLang: Language;
  private t: Translations;

  constructor() {
    this.currentLang = detectLanguage();
    this.t = translations[this.currentLang];
    this.updatePageTitle();
  }

  get lang(): Language { return this.currentLang; }

  setLanguage(lang: Language): void {
    this.currentLang = lang;
    this.t = translations[lang];
    try { localStorage.setItem('mandarin-language', lang); } catch {}
    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    document.title = this.t.pageTitle;
  }

  get translations(): Translations { return this.t; }

  format(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
  }

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
  get leaderboard(): string { return this.t.leaderboard; }
  get newRecord(): string { return this.t.newRecord; }
  get donateStars(): string { return this.t.donateStars; }
  get share(): string { return this.t.share; }
  get noScoresYet(): string { return this.t.noScoresYet; }
  get saveClip(): string { return this.t.saveClip; }
  get savingClip(): string { return this.t.savingClip; }

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

  formatBestTime(time: string): string {
    return this.format(this.t.bestTime, { time });
  }

  formatRank(rank: number): string {
    return this.format(this.t.rank, { rank });
  }

  formatShareText(time: string): string {
    return this.format(this.t.shareText, { time });
  }

  formatTotalPeeled(count: number): string {
    return this.format(this.t.totalPeeled, { count });
  }

  formatCellsCount(count: number): string {
    return this.format(this.t.cellsCount, { count });
  }
}

export const i18n = new I18n();

export function setLanguageFromYandex(yandexLang: string): void {
  const lang = yandexLang.toLowerCase().split('-')[0];
  i18n.setLanguage(lang === 'en' ? 'en' : 'ru');
}
