// Internationalization module with auto language detection

export type Language = 'en' | 'ru' | 'ko' | 'ja' | 'th';

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

  // Leaderboard
  leaderboard: string;
  bestTime: string;
  rank: string;
  newRecord: string;

  // Donate
  donateStars: string;

  // Share
  share: string;
  shareText: string;

  // Total stats
  totalPeeled: string; // "Total mandarins peeled: {count}"

  // Cells count
  cellsCount: string; // "{count} cells"
}

const en: Translations = {
  title: 'MANDARIN',
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

  pageTitle: 'MANDARIN',

  leaderboard: 'Leaderboard',
  bestTime: 'Best: {time}s',
  rank: 'Rank: #{rank}',
  newRecord: 'New Record!',

  donateStars: 'Donate Stars ⭐',

  share: 'Send 🍊 to a friend',
  shareText: '🍊✨ I PEELED IT FOR YOU in {time}s! Can you beat my time? 🎄🎁',

  totalPeeled: 'Total mandarins peeled: {count}',

  cellsCount: '{count} cells',
};

const ru: Translations = {
  title: 'МАНДАРИН',
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
  mustPeelConnected: 'Нужно чистить соседние шкурки!',
  endedOnCenter: 'Закончил на центральной шкурке!',
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

  pageTitle: 'МАНДАРИН',

  leaderboard: 'Таблица лидеров',
  bestTime: 'Лучшее: {time}с',
  rank: 'Место: #{rank}',
  newRecord: 'Новый рекорд!',

  donateStars: 'Задонатить звёзды ⭐',

  share: 'Отправить 🍊 другу',
  shareText: '🍊✨ Я ПОЧИСТИЛ ЕГО ДЛЯ ТЕБЯ за {time}с! Сможешь быстрее? 🎄🎁',

  totalPeeled: 'Всего мандаринов очищено: {count}',

  cellsCount: '{count} долек',
};

const ko: Translations = {
  title: '귤',
  subtitle: '한 번의 터치로 귤 껍질 벗기기',
  tapToStart: '탭하여 시작',

  gameOver: '게임 오버',
  tapToTryAgain: '탭하여 다시 시도',

  youWin: '승리!',
  tapToPlayAgain: '탭하여 다시 플레이',

  wins: '승리',
  streak: '연속',
  statsFormat: '승리: {wins}/{total} | 연속: {streak}',
  peeled: '{time}초 만에 {count}/{total} 조각 벗김',
  time: '시간: {time}초',

  liftedFinger: '손가락을 떼셨습니다!',
  mustPeelConnected: '연결된 조각을 벗겨야 합니다!',
  endedOnCenter: '중앙 조각에서 끝났습니다!',
  noValidExit: '출구 없음 - 인접한 모든 면이 벗겨졌습니다!',
  sideAlreadyPeeled: '{side} 면은 이미 벗겨졌습니다!',

  sides: {
    front: '앞면',
    back: '뒷면',
    top: '윗면',
    bottom: '아랫면',
    left: '왼쪽',
    right: '오른쪽',
  },

  pageTitle: '귤',

  leaderboard: '리더보드',
  bestTime: '최고: {time}초',
  rank: '순위: #{rank}',
  newRecord: '신기록!',

  donateStars: '별 기부 ⭐',

  share: '친구에게 🍊 보내기',
  shareText: '🍊✨ {time}초 만에 껍질을 벗겼어요! 내 기록을 이길 수 있나요? 🎄🎁',

  totalPeeled: '총 껍질 벗긴 귤: {count}개',

  cellsCount: '{count}조각',
};

const ja: Translations = {
  title: 'みかん',
  subtitle: 'ワンタッチでみかんの皮をむく',
  tapToStart: 'タップしてスタート',

  gameOver: 'ゲームオーバー',
  tapToTryAgain: 'タップしてリトライ',

  youWin: '勝利！',
  tapToPlayAgain: 'タップしてもう一度',

  wins: '勝利',
  streak: '連続',
  statsFormat: '勝利: {wins}/{total} | 連続: {streak}',
  peeled: '{time}秒で{count}/{total}片をむいた',
  time: '時間: {time}秒',

  liftedFinger: '指を離しました！',
  mustPeelConnected: '隣接する皮をむいてください！',
  endedOnCenter: '中央で終了しました！',
  noValidExit: '出口なし - 隣接する全ての面がむかれています！',
  sideAlreadyPeeled: '{side}面はすでにむかれています！',

  sides: {
    front: '前面',
    back: '背面',
    top: '上面',
    bottom: '下面',
    left: '左面',
    right: '右面',
  },

  pageTitle: 'みかん',

  leaderboard: 'リーダーボード',
  bestTime: '最高: {time}秒',
  rank: 'ランク: #{rank}',
  newRecord: '新記録！',

  donateStars: 'スターを寄付 ⭐',

  share: '友達に🍊を送る',
  shareText: '🍊✨ {time}秒でむきました！私の記録を超えられますか？ 🎄🎁',

  totalPeeled: 'むいたみかんの合計: {count}個',

  cellsCount: '{count}片',
};

const th: Translations = {
  title: 'ส้ม',
  subtitle: 'ปอกส้มด้วยนิ้วเดียวโดยไม่ยกนิ้ว',
  tapToStart: 'แตะเพื่อเริ่ม',

  gameOver: 'จบเกม',
  tapToTryAgain: 'แตะเพื่อลองใหม่',

  youWin: 'ชนะแล้ว!',
  tapToPlayAgain: 'แตะเพื่อเล่นอีกครั้ง',

  wins: 'ชนะ',
  streak: 'ต่อเนื่อง',
  statsFormat: 'ชนะ: {wins}/{total} | ต่อเนื่อง: {streak}',
  peeled: 'ปอกได้ {count}/{total} ชิ้น ใน {time} วินาที',
  time: 'เวลา: {time} วินาที',

  liftedFinger: 'คุณยกนิ้วขึ้น!',
  mustPeelConnected: 'ต้องปอกชิ้นที่ติดกัน!',
  endedOnCenter: 'จบที่ชิ้นตรงกลาง!',
  noValidExit: 'ไม่มีทางออก - ด้านที่อยู่ติดกันถูกปอกหมดแล้ว!',
  sideAlreadyPeeled: 'ด้าน{side}ถูกปอกไปแล้ว!',

  sides: {
    front: 'หน้า',
    back: 'หลัง',
    top: 'บน',
    bottom: 'ล่าง',
    left: 'ซ้าย',
    right: 'ขวา',
  },

  pageTitle: 'ส้ม',

  leaderboard: 'กระดานผู้นำ',
  bestTime: 'ดีที่สุด: {time} วินาที',
  rank: 'อันดับ: #{rank}',
  newRecord: 'สถิติใหม่!',

  donateStars: 'บริจาคดาว ⭐',

  share: 'ส่ง 🍊 ให้เพื่อน',
  shareText: '🍊✨ ฉันปอกส้มได้ใน {time} วินาที! คุณทำได้เร็วกว่านี้ไหม? 🎄🎁',

  totalPeeled: 'ปอกส้มไปแล้วทั้งหมด: {count} ลูก',

  cellsCount: '{count} ชิ้น',
};

const translations: Record<Language, Translations> = { en, ru, ko, ja, th };

// Detect language from browser/system settings
function detectLanguage(): Language {
  // Check localStorage for user preference first
  try {
    const saved = localStorage.getItem('mandarin-language');
    if (saved === 'en' || saved === 'ru' || saved === 'ko' || saved === 'ja' || saved === 'th') {
      return saved;
    }
  } catch {
    // Ignore localStorage errors
  }

  // Get browser language
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const lang = browserLang.toLowerCase().split('-')[0];

  // Return appropriate language or default to English
  if (lang === 'ru') return 'ru';
  if (lang === 'ko') return 'ko';
  if (lang === 'ja') return 'ja';
  if (lang === 'th') return 'th';
  return 'en';
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

  get leaderboard(): string { return this.t.leaderboard; }
  get newRecord(): string { return this.t.newRecord; }

  formatBestTime(time: string): string {
    return this.format(this.t.bestTime, { time });
  }

  formatRank(rank: number): string {
    return this.format(this.t.rank, { rank });
  }

  get donateStars(): string { return this.t.donateStars; }

  get share(): string { return this.t.share; }

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

// Singleton instance
export const i18n = new I18n();
