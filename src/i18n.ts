// Internationalization module with auto language detection

export type Language =
  | 'en' | 'ru' | 'ko' | 'ja' | 'th'
  | 'zh-Hans' | 'zh-Hant'
  | 'es' | 'pt' | 'fr' | 'de' | 'it'
  | 'tr' | 'ar' | 'id' | 'vi' | 'pl' | 'nl'
  | 'kk' | 'uz';

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
  wins: string;
  streak: string;
  statsFormat: string;
  peeled: string;
  time: string;

  // Game over reasons
  liftedFinger: string;
  mustPeelConnected: string;
  endedOnCenter: string;
  noValidExit: string;
  sideAlreadyPeeled: string;

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
  totalPeeled: string;

  // Cells count
  cellsCount: string;

  // Leaderboard empty state
  noScoresYet: string;

  // Video recording
  saveClip: string;
  savingClip: string;

  // Game store descriptions
  gameName: string;
  seoDescription: string;
  gameDescription: string;
  howToPlay: string;
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

  donateStars: 'Donate Stars ⭐',

  share: 'Send 🍊 to a friend',
  shareText: '🍊✨ I PEELED IT FOR YOU in {time}s! Can you beat my time? 🎄🎁',

  totalPeeled: 'Total mandarins peeled: {count}',

  cellsCount: '{count} cells',

  noScoresYet: 'No scores yet',

  saveClip: '📹 Save Clip',
  savingClip: '⏳ Saving...',

  gameName: 'Mandarin',
  seoDescription: 'Peel the 3D mandarin in one touch! A festive casual challenge — swipe your finger across all segments without lifting. Compete for the best time.',
  gameDescription: 'A festive casual game! Peel the mandarin in one continuous finger motion. Go through all 6 sides of the mandarin without lifting your finger from the screen. Each side is divided into segments — peel them in order, moving to the edge. If you lift your finger or go into a dead end — start over! Compete for the best time on the leaderboard.',
  howToPlay: '1. Press on the screen and don\'t release your finger until the end of the game\n2. Move your finger across the mandarin segments to peel the skin\n3. Peel only adjacent segments — don\'t jump around\n4. Finish each side on an edge segment to move to the next\n5. Peel all 6 sides of the mandarin without lifting your finger\n6. If you lift your finger or get stuck in a dead end — the game is over\n\nTip: follow the orange hints on the edges of the screen — they show available directions.',
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

  pageTitle: 'Мандарин',

  leaderboard: 'Таблица лидеров',
  bestTime: 'Лучшее: {time}с',
  rank: 'Место: #{rank}',
  newRecord: 'Новый рекорд!',

  donateStars: 'Задонатить звёзды ⭐',

  share: 'Отправить 🍊 другу',
  shareText: '🍊✨ Я ПОЧИСТИЛ ЕГО ДЛЯ ТЕБЯ за {time}с! Сможешь быстрее? 🎄🎁',

  totalPeeled: 'Всего мандаринов очищено: {count}',

  cellsCount: '{count} долек',

  noScoresYet: 'Пока нет результатов',

  saveClip: '📹 Сохранить видео',
  savingClip: '⏳ Сохранение...',

  gameName: 'Мандарин',
  seoDescription: 'Очисти 3D-мандарин одним касанием! Новогодний казуальный челлендж — проведи пальцем по всем долькам, не отрывая руку. Соревнуйся за лучшее время.',
  gameDescription: 'Новогодняя казуальная игра! Очисти мандарин одним непрерывным движением пальца. Проведи по всем 6 сторонам мандарина, не отрывая палец от экрана. Каждая сторона разделена на дольки — чисти их по порядку, двигаясь к краю. Если оторвёшь палец или зайдёшь в тупик — начинай сначала! Соревнуйся за лучшее время в таблице лидеров.',
  howToPlay: '1. Нажми на экран и не отпускай палец до конца игры\n2. Води пальцем по долькам мандарина, чтобы снять кожуру\n3. Чисти только соседние дольки — нельзя перепрыгивать\n4. Заканчивай каждую сторону на крайней дольке, чтобы перейти на следующую\n5. Очисти все 6 сторон мандарина, не отрывая палец\n6. Если оторвал палец или зашёл в тупик — игра окончена\n\nСовет: следи за оранжевыми подсказками на краях экрана — они показывают доступные направления.',
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

  noScoresYet: '아직 기록이 없습니다',

  saveClip: '📹 클립 저장',
  savingClip: '⏳ 저장 중...',

  gameName: '귤',
  seoDescription: '한 번의 터치로 3D 귤 껍질 벗기기! 축제 캐주얼 챌린지 — 손가락을 떼지 않고 모든 조각을 스와이프하세요. 최고 기록에 도전하세요.',
  gameDescription: '축제 캐주얼 게임! 손가락을 한 번도 떼지 않고 귤 껍질을 벗기세요. 화면에서 손가락을 떼지 않고 귤의 6면을 모두 통과하세요. 각 면은 조각으로 나뉘어 있습니다 — 가장자리로 이동하면서 순서대로 벗기세요. 손가락을 떼거나 막다른 골목에 가면 — 다시 시작하세요! 리더보드에서 최고 기록에 도전하세요.',
  howToPlay: '1. 화면을 누르고 게임이 끝날 때까지 손가락을 떼지 마세요\n2. 귤 조각을 가로질러 손가락을 움직여 껍질을 벗기세요\n3. 인접한 조각만 벗기세요 — 뛰어넘지 마세요\n4. 다음으로 이동하려면 각 면을 가장자리 조각에서 끝내세요\n5. 손가락을 떼지 않고 귤의 6면을 모두 벗기세요\n6. 손가락을 떼거나 막다른 골목에 갇히면 — 게임 오버\n\n팁: 화면 가장자리의 주황색 힌트를 따라가세요 — 사용 가능한 방향을 표시합니다.',
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

  noScoresYet: 'まだスコアがありません',

  saveClip: '📹 クリップを保存',
  savingClip: '⏳ 保存中...',

  gameName: 'みかん',
  seoDescription: '一回のタッチで3Dみかんの皮をむこう！祝祭的なカジュアルチャレンジ — 指を離さずに全ての房をスワイプ。最速タイムを競おう。',
  gameDescription: '祝祭的なカジュアルゲーム！一筆書きでみかんの皮をむきます。画面から指を離さずに、みかんの6面すべてを通過しましょう。各面は房に分かれています — 端に向かって順番にむいていきます。指を離したり行き止まりに入ったら — やり直し！リーダーボードで最速タイムを競おう。',
  howToPlay: '1. 画面を押して、ゲーム終了まで指を離さないでください\n2. みかんの房の上で指を動かして皮をむきます\n3. 隣接する房だけをむいてください — 飛び越えないように\n4. 次の面に移るには、各面を端の房で終わらせてください\n5. 指を離さずにみかんの6面すべてをむきます\n6. 指を離したり行き止まりに入ったら — ゲームオーバー\n\nヒント: 画面の端にあるオレンジ色のヒントに従ってください — 利用可能な方向を示しています。',
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

  noScoresYet: 'ยังไม่มีคะแนน',

  saveClip: '📹 บันทึกคลิป',
  savingClip: '⏳ กำลังบันทึก...',

  gameName: 'ส้ม',
  seoDescription: 'ปอกส้ม 3D ด้วยการแตะครั้งเดียว! ความท้าทายสบายๆในเทศกาล — ปัดนิ้วข้ามทุกชิ้นโดยไม่ยกนิ้ว แข่งขันเพื่อเวลาที่ดีที่สุด',
  gameDescription: 'เกมสบายๆในเทศกาล! ปอกส้มด้วยการเลื่อนนิ้วอย่างต่อเนื่อง ผ่านทั้ง 6 ด้านของส้มโดยไม่ยกนิ้วจากหน้าจอ แต่ละด้านแบ่งออกเป็นชิ้นส่วน — ปอกตามลำดับไปที่ขอบ หากคุณยกนิ้วหรือเข้าตรอกตัน — เริ่มใหม่! แข่งขันเพื่อเวลาที่ดีที่สุดในกระดานผู้นำ',
  howToPlay: '1. กดที่หน้าจอและอย่ายกนิ้วจนจบเกม\n2. เลื่อนนิ้วข้ามชิ้นส้มเพื่อปอกเปลือก\n3. ปอกเฉพาะชิ้นที่ติดกันเท่านั้น — อย่าข้าม\n4. จบแต่ละด้านที่ชิ้นขอบเพื่อไปด้านถัดไป\n5. ปอกทั้ง 6 ด้านของส้มโดยไม่ยกนิ้ว\n6. หากคุณยกนิ้วหรือติดอยู่ในตรอกตัน — เกมจบ\n\nเคล็ดลับ: ติดตามคำแนะนำสีส้มที่ขอบหน้าจอ — แสดงทิศทางที่ใช้ได้',
};

// Chinese Simplified
const zhHans: Translations = {
  title: '橘子',
  subtitle: '一次触摸剥完橘子',
  tapToStart: '点击开始',

  gameOver: '游戏结束',
  tapToTryAgain: '点击重试',

  youWin: '你赢了！',
  tapToPlayAgain: '点击再玩一次',

  wins: '胜利',
  streak: '连胜',
  statsFormat: '胜利: {wins}/{total} | 连胜: {streak}',
  peeled: '{time}秒内剥了{count}/{total}块',
  time: '时间: {time}秒',

  liftedFinger: '你抬起了手指！',
  mustPeelConnected: '必须剥相邻的块！',
  endedOnCenter: '在中心块结束了！',
  noValidExit: '没有出路 - 所有相邻面都已剥完！',
  sideAlreadyPeeled: '{side}面已经剥完了！',

  sides: {
    front: '前面',
    back: '后面',
    top: '上面',
    bottom: '下面',
    left: '左面',
    right: '右面',
  },

  pageTitle: '橘子',

  leaderboard: '排行榜',
  bestTime: '最佳: {time}秒',
  rank: '排名: #{rank}',
  newRecord: '新纪录！',

  donateStars: '捐赠星星 ⭐',

  share: '发送 🍊 给朋友',
  shareText: '🍊✨ 我用{time}秒剥完了！你能比我快吗？🎄🎁',

  totalPeeled: '共剥橘子: {count}个',

  cellsCount: '{count}块',

  noScoresYet: '暂无记录',

  saveClip: '📹 保存视频',
  savingClip: '⏳ 保存中...',

  gameName: '橘子',
  seoDescription: '一次触摸剥完3D橘子！这是一款充满节日气氛的圣诞新年主题休闲挑战游戏。玩家需要用手指在3D橘子表面连续滑动，剥掉所有6个面上的果皮碎片。游戏规则简单却极具挑战性：整个过程中不能抬起手指，必须按照相邻的顺序剥皮，不能走进死胡同。每个面由多个沃罗诺伊图案构成的果皮块组成，你需要从边缘块进入和离开每一面，如果在中心块结束则游戏失败。游戏考验你的空间感、路径规划能力和操作精准度。完成挑战后可以与好友比拼最佳时间，看谁能最快剥完橘子！快来体验这个独特的3D触控益智游戏，在欢乐的节日氛围中挑战自己的极限！',
  gameDescription: '节日休闲游戏！用一次连续的手指动作剥橘子。在不抬起手指的情况下通过橘子的全部6个面。每个面都分成橘瓣 — 按顺序剥，移向边缘。如果抬起手指或走入死胡同 — 重新开始！在排行榜上竞争最佳时间。',
  howToPlay: '1. 按住屏幕，在游戏结束前不要松开手指\n2. 移动手指划过橘瓣来剥皮\n3. 只剥相邻的橘瓣 — 不要跳跃\n4. 在边缘橘瓣结束每个面才能移到下一个\n5. 不抬起手指剥完橘子的全部6个面\n6. 如果抬起手指或陷入死胡同 — 游戏结束\n\n提示：跟随屏幕边缘的橙色提示 — 它们显示可用的方向。',
};

// Chinese Traditional
const zhHant: Translations = {
  title: '橘子',
  subtitle: '一次觸摸剝完橘子',
  tapToStart: '點擊開始',

  gameOver: '遊戲結束',
  tapToTryAgain: '點擊重試',

  youWin: '你贏了！',
  tapToPlayAgain: '點擊再玩一次',

  wins: '勝利',
  streak: '連勝',
  statsFormat: '勝利: {wins}/{total} | 連勝: {streak}',
  peeled: '{time}秒內剝了{count}/{total}塊',
  time: '時間: {time}秒',

  liftedFinger: '你抬起了手指！',
  mustPeelConnected: '必須剝相鄰的塊！',
  endedOnCenter: '在中心塊結束了！',
  noValidExit: '沒有出路 - 所有相鄰面都已剝完！',
  sideAlreadyPeeled: '{side}面已經剝完了！',

  sides: {
    front: '前面',
    back: '後面',
    top: '上面',
    bottom: '下面',
    left: '左面',
    right: '右面',
  },

  pageTitle: '橘子',

  leaderboard: '排行榜',
  bestTime: '最佳: {time}秒',
  rank: '排名: #{rank}',
  newRecord: '新紀錄！',

  donateStars: '捐贈星星 ⭐',

  share: '發送 🍊 給朋友',
  shareText: '🍊✨ 我用{time}秒剝完了！你能比我快嗎？🎄🎁',

  totalPeeled: '共剝橘子: {count}個',

  cellsCount: '{count}塊',

  noScoresYet: '暫無記錄',

  saveClip: '📹 保存影片',
  savingClip: '⏳ 保存中...',

  gameName: '橘子',
  seoDescription: '一次觸摸剝完3D橘子！這是一款充滿節日氣氛的聖誕新年主題休閒挑戰遊戲。玩家需要用手指在3D橘子表面連續滑動，剝掉所有6個面上的果皮碎片。遊戲規則簡單卻極具挑戰性：整個過程中不能抬起手指，必須按照相鄰的順序剝皮，不能走進死胡同。每個面由多個沃羅諾伊圖案構成的果皮塊組成，你需要從邊緣塊進入和離開每一面，如果在中心塊結束則遊戲失敗。遊戲考驗你的空間感、路徑規劃能力和操作精準度。完成挑戰後可以與好友比拚最佳時間，看誰能最快剝完橘子！快來體驗這個獨特的3D觸控益智遊戲，在歡樂的節日氛圍中挑戰自己的極限！',
  gameDescription: '節日休閒遊戲！用一次連續的手指動作剝橘子。在不抬起手指的情況下通過橘子的全部6個面。每個面都分成橘瓣 — 按順序剝，移向邊緣。如果抬起手指或走入死胡同 — 重新開始！在排行榜上競爭最佳時間。',
  howToPlay: '1. 按住螢幕，在遊戲結束前不要鬆開手指\n2. 移動手指劃過橘瓣來剝皮\n3. 只剝相鄰的橘瓣 — 不要跳躍\n4. 在邊緣橘瓣結束每個面才能移到下一個\n5. 不抬起手指剝完橘子的全部6個面\n6. 如果抬起手指或陷入死胡同 — 遊戲結束\n\n提示：跟隨螢幕邊緣的橙色提示 — 它們顯示可用的方向。',
};

// Spanish
const es: Translations = {
  title: 'Mandarina',
  subtitle: 'Pela la mandarina con un solo toque',
  tapToStart: 'Toca para empezar',

  gameOver: 'Fin del juego',
  tapToTryAgain: 'Toca para intentar de nuevo',

  youWin: '¡Ganaste!',
  tapToPlayAgain: 'Toca para jugar de nuevo',

  wins: 'Victorias',
  streak: 'Racha',
  statsFormat: 'Victorias: {wins}/{total} | Racha: {streak}',
  peeled: 'Pelaste {count}/{total} trozos en {time}s',
  time: 'Tiempo: {time}s',

  liftedFinger: '¡Levantaste el dedo!',
  mustPeelConnected: '¡Debes pelar trozos conectados!',
  endedOnCenter: '¡Terminaste en el trozo central!',
  noValidExit: '¡Sin salida - todos los lados adyacentes pelados!',
  sideAlreadyPeeled: '¡El lado {side} ya está pelado!',

  sides: {
    front: 'Frente',
    back: 'Atrás',
    top: 'Arriba',
    bottom: 'Abajo',
    left: 'Izquierda',
    right: 'Derecha',
  },

  pageTitle: 'Mandarina',

  leaderboard: 'Clasificación',
  bestTime: 'Mejor: {time}s',
  rank: 'Puesto: #{rank}',
  newRecord: '¡Nuevo récord!',

  donateStars: 'Donar estrellas ⭐',

  share: 'Enviar 🍊 a un amigo',
  shareText: '🍊✨ ¡La pelé en {time}s! ¿Puedes superarme? 🎄🎁',

  totalPeeled: 'Total de mandarinas peladas: {count}',

  cellsCount: '{count} trozos',

  noScoresYet: 'Sin puntuaciones aún',

  saveClip: '📹 Guardar clip',
  savingClip: '⏳ Guardando...',

  gameName: 'Mandarina',
  seoDescription: '¡Pela la mandarina 3D con un solo toque! Un desafío casual festivo — desliza tu dedo por todos los gajos sin levantarlo. Compite por el mejor tiempo.',
  gameDescription: '¡Un juego casual festivo! Pela la mandarina con un movimiento continuo del dedo. Pasa por los 6 lados de la mandarina sin levantar el dedo de la pantalla. Cada lado está dividido en gajos — pélalos en orden, moviéndote hacia el borde. Si levantas el dedo o llegas a un callejón sin salida — ¡empieza de nuevo! Compite por el mejor tiempo en la clasificación.',
  howToPlay: '1. Presiona la pantalla y no sueltes el dedo hasta el final del juego\n2. Mueve tu dedo por los gajos de la mandarina para pelar la piel\n3. Pela solo gajos adyacentes — no saltes\n4. Termina cada lado en un gajo del borde para pasar al siguiente\n5. Pela los 6 lados de la mandarina sin levantar el dedo\n6. Si levantas el dedo o te quedas atascado en un callejón sin salida — fin del juego\n\nConsejo: sigue las pistas naranjas en los bordes de la pantalla — muestran las direcciones disponibles.',
};

// Portuguese
const pt: Translations = {
  title: 'Tangerina',
  subtitle: 'Descasque a tangerina com um toque',
  tapToStart: 'Toque para começar',

  gameOver: 'Fim de jogo',
  tapToTryAgain: 'Toque para tentar novamente',

  youWin: 'Você venceu!',
  tapToPlayAgain: 'Toque para jogar novamente',

  wins: 'Vitórias',
  streak: 'Sequência',
  statsFormat: 'Vitórias: {wins}/{total} | Sequência: {streak}',
  peeled: 'Descascou {count}/{total} pedaços em {time}s',
  time: 'Tempo: {time}s',

  liftedFinger: 'Você levantou o dedo!',
  mustPeelConnected: 'Deve descascar pedaços conectados!',
  endedOnCenter: 'Terminou no pedaço central!',
  noValidExit: 'Sem saída - todos os lados adjacentes descascados!',
  sideAlreadyPeeled: 'O lado {side} já foi descascado!',

  sides: {
    front: 'Frente',
    back: 'Trás',
    top: 'Cima',
    bottom: 'Baixo',
    left: 'Esquerda',
    right: 'Direita',
  },

  pageTitle: 'Tangerina',

  leaderboard: 'Classificação',
  bestTime: 'Melhor: {time}s',
  rank: 'Posição: #{rank}',
  newRecord: 'Novo recorde!',

  donateStars: 'Doar estrelas ⭐',

  share: 'Enviar 🍊 para um amigo',
  shareText: '🍊✨ Descasquei em {time}s! Consegue me superar? 🎄🎁',

  totalPeeled: 'Total de tangerinas descascadas: {count}',

  cellsCount: '{count} pedaços',

  noScoresYet: 'Sem pontuações ainda',

  saveClip: '📹 Salvar clipe',
  savingClip: '⏳ Salvando...',

  gameName: 'Tangerina',
  seoDescription: 'Descasque a tangerina 3D com um toque! Um desafio casual festivo — deslize o dedo por todos os gomos sem levantar. Compita pelo melhor tempo.',
  gameDescription: 'Um jogo casual festivo! Descasque a tangerina com um movimento contínuo do dedo. Passe pelos 6 lados da tangerina sem levantar o dedo da tela. Cada lado está dividido em gomos — descasque-os em ordem, movendo-se para a borda. Se levantar o dedo ou chegar a um beco sem saída — comece de novo! Compita pelo melhor tempo na classificação.',
  howToPlay: '1. Pressione a tela e não solte o dedo até o final do jogo\n2. Mova o dedo pelos gomos da tangerina para descascar a casca\n3. Descasque apenas gomos adjacentes — não pule\n4. Termine cada lado em um gomo da borda para passar ao próximo\n5. Descasque os 6 lados da tangerina sem levantar o dedo\n6. Se levantar o dedo ou ficar preso em um beco sem saída — fim de jogo\n\nDica: siga as dicas laranjas nas bordas da tela — elas mostram as direções disponíveis.',
};

// French
const fr: Translations = {
  title: 'Mandarine',
  subtitle: "Épluchez la mandarine d'un seul geste",
  tapToStart: 'Appuyez pour commencer',

  gameOver: 'Partie terminée',
  tapToTryAgain: 'Appuyez pour réessayer',

  youWin: 'Victoire !',
  tapToPlayAgain: 'Appuyez pour rejouer',

  wins: 'Victoires',
  streak: 'Série',
  statsFormat: 'Victoires : {wins}/{total} | Série : {streak}',
  peeled: 'Épluché {count}/{total} morceaux en {time}s',
  time: 'Temps : {time}s',

  liftedFinger: 'Vous avez levé le doigt !',
  mustPeelConnected: 'Épluchez les morceaux connectés !',
  endedOnCenter: 'Terminé sur le morceau central !',
  noValidExit: 'Pas de sortie - tous les côtés adjacents épluchés !',
  sideAlreadyPeeled: 'Le côté {side} est déjà épluché !',

  sides: {
    front: 'Avant',
    back: 'Arrière',
    top: 'Haut',
    bottom: 'Bas',
    left: 'Gauche',
    right: 'Droite',
  },

  pageTitle: 'Mandarine',

  leaderboard: 'Classement',
  bestTime: 'Meilleur : {time}s',
  rank: 'Rang : #{rank}',
  newRecord: 'Nouveau record !',

  donateStars: 'Donner des étoiles ⭐',

  share: 'Envoyer 🍊 à un ami',
  shareText: "🍊✨ Je l'ai épluchée en {time}s ! Tu peux faire mieux ? 🎄🎁",

  totalPeeled: 'Total de mandarines épluchées : {count}',

  cellsCount: '{count} morceaux',

  noScoresYet: 'Pas encore de scores',

  saveClip: '📹 Sauvegarder le clip',
  savingClip: '⏳ Sauvegarde...',

  gameName: 'Mandarine',
  seoDescription: 'Jeu festif : épluchez la mandarine 3D d\'un geste continu ! Glissez sans lever le doigt sur tous les quartiers. Défi rapide et amusant.',
  gameDescription: 'Un jeu décontracté festif ! Épluchez la mandarine d\'un seul mouvement continu du doigt. Parcourez les 6 faces de la mandarine sans lever le doigt de l\'écran. Chaque face est divisée en quartiers — épluchez-les dans l\'ordre, en vous déplaçant vers le bord. Si vous levez le doigt ou arrivez dans une impasse — recommencez ! Rivalisez pour le meilleur temps dans le classement.',
  howToPlay: '1. Appuyez sur l\'écran et ne relâchez pas votre doigt jusqu\'à la fin du jeu\n2. Déplacez votre doigt sur les quartiers de la mandarine pour éplucher la peau\n3. Épluchez uniquement les quartiers adjacents — ne sautez pas\n4. Terminez chaque face sur un quartier de bord pour passer à la suivante\n5. Épluchez les 6 faces de la mandarine sans lever le doigt\n6. Si vous levez le doigt ou vous retrouvez dans une impasse — partie terminée\n\nAstuce : suivez les indices oranges sur les bords de l\'écran — ils indiquent les directions disponibles.',
};

// German
const de: Translations = {
  title: 'Mandarine',
  subtitle: 'Schäle die Mandarine mit einer Berührung',
  tapToStart: 'Tippen zum Starten',

  gameOver: 'Spiel vorbei',
  tapToTryAgain: 'Tippen zum erneut versuchen',

  youWin: 'Du hast gewonnen!',
  tapToPlayAgain: 'Tippen zum erneut spielen',

  wins: 'Siege',
  streak: 'Serie',
  statsFormat: 'Siege: {wins}/{total} | Serie: {streak}',
  peeled: '{count}/{total} Stücke in {time}s geschält',
  time: 'Zeit: {time}s',

  liftedFinger: 'Du hast den Finger gehoben!',
  mustPeelConnected: 'Verbundene Stücke schälen!',
  endedOnCenter: 'Auf dem mittleren Stück beendet!',
  noValidExit: 'Kein Ausgang - alle angrenzenden Seiten geschält!',
  sideAlreadyPeeled: 'Seite {side} ist bereits geschält!',

  sides: {
    front: 'Vorne',
    back: 'Hinten',
    top: 'Oben',
    bottom: 'Unten',
    left: 'Links',
    right: 'Rechts',
  },

  pageTitle: 'Mandarine',

  leaderboard: 'Bestenliste',
  bestTime: 'Beste: {time}s',
  rank: 'Rang: #{rank}',
  newRecord: 'Neuer Rekord!',

  donateStars: 'Sterne spenden ⭐',

  share: '🍊 an Freund senden',
  shareText: '🍊✨ Ich habe sie in {time}s geschält! Kannst du das schlagen? 🎄🎁',

  totalPeeled: 'Insgesamt geschälte Mandarinen: {count}',

  cellsCount: '{count} Stücke',

  noScoresYet: 'Noch keine Punkte',

  saveClip: '📹 Clip speichern',
  savingClip: '⏳ Speichern...',

  gameName: 'Mandarine',
  seoDescription: 'Schäle die 3D-Mandarine mit einem Wisch! Festliches Casual-Game — Finger über alle Stücke führen ohne abzuheben. Um die Bestzeit kämpfen!',
  gameDescription: 'Ein festliches Casual-Spiel! Schäle die Mandarine mit einer durchgehenden Fingerbewegung. Gehe durch alle 6 Seiten der Mandarine, ohne den Finger vom Bildschirm zu heben. Jede Seite ist in Stücke unterteilt — schäle sie der Reihe nach und bewege dich zum Rand. Wenn du den Finger hebst oder in eine Sackgasse gerätst — fang von vorne an! Kämpfe um die beste Zeit in der Bestenliste.',
  howToPlay: '1. Drücke auf den Bildschirm und hebe den Finger bis zum Ende des Spiels nicht\n2. Bewege deinen Finger über die Mandarinenstücke, um die Schale zu entfernen\n3. Schäle nur angrenzende Stücke — springe nicht\n4. Beende jede Seite an einem Randstück, um zur nächsten zu gelangen\n5. Schäle alle 6 Seiten der Mandarine, ohne den Finger zu heben\n6. Wenn du den Finger hebst oder in einer Sackgasse steckst — Spiel vorbei\n\nTipp: Folge den orangefarbenen Hinweisen an den Bildschirmrändern — sie zeigen verfügbare Richtungen an.',
};

// Italian
const it: Translations = {
  title: 'Mandarino',
  subtitle: 'Sbuccia il mandarino con un tocco',
  tapToStart: 'Tocca per iniziare',

  gameOver: 'Game Over',
  tapToTryAgain: 'Tocca per riprovare',

  youWin: 'Hai vinto!',
  tapToPlayAgain: 'Tocca per giocare ancora',

  wins: 'Vittorie',
  streak: 'Serie',
  statsFormat: 'Vittorie: {wins}/{total} | Serie: {streak}',
  peeled: 'Sbucciato {count}/{total} pezzi in {time}s',
  time: 'Tempo: {time}s',

  liftedFinger: 'Hai alzato il dito!',
  mustPeelConnected: 'Devi sbucciare pezzi connessi!',
  endedOnCenter: 'Finito sul pezzo centrale!',
  noValidExit: 'Nessuna uscita - tutti i lati adiacenti sbucciati!',
  sideAlreadyPeeled: 'Il lato {side} è già sbucciato!',

  sides: {
    front: 'Davanti',
    back: 'Dietro',
    top: 'Sopra',
    bottom: 'Sotto',
    left: 'Sinistra',
    right: 'Destra',
  },

  pageTitle: 'Mandarino',

  leaderboard: 'Classifica',
  bestTime: 'Migliore: {time}s',
  rank: 'Posizione: #{rank}',
  newRecord: 'Nuovo record!',

  donateStars: 'Dona stelle ⭐',

  share: 'Invia 🍊 a un amico',
  shareText: '🍊✨ L\'ho sbucciato in {time}s! Riesci a battermi? 🎄🎁',

  totalPeeled: 'Totale mandarini sbucciati: {count}',

  cellsCount: '{count} pezzi',

  noScoresYet: 'Nessun punteggio ancora',

  saveClip: '📹 Salva clip',
  savingClip: '⏳ Salvataggio...',

  gameName: 'Mandarino',
  seoDescription: 'Sbuccia il mandarino 3D con un tocco! Una sfida casual festiva — scorri il dito su tutti gli spicchi senza sollevarlo. Compete per il miglior tempo.',
  gameDescription: 'Un gioco casual festivo! Sbuccia il mandarino con un movimento continuo del dito. Passa attraverso tutti i 6 lati del mandarino senza sollevare il dito dallo schermo. Ogni lato è diviso in spicchi — sbucciali in ordine, muovendoti verso il bordo. Se sollevi il dito o arrivi in un vicolo cieco — ricomincia! Compete per il miglior tempo nella classifica.',
  howToPlay: '1. Premi sullo schermo e non rilasciare il dito fino alla fine del gioco\n2. Muovi il dito sugli spicchi del mandarino per sbucciare la buccia\n3. Sbuccia solo spicchi adiacenti — non saltare\n4. Termina ogni lato su uno spicchio del bordo per passare al successivo\n5. Sbuccia tutti i 6 lati del mandarino senza sollevare il dito\n6. Se sollevi il dito o rimani bloccato in un vicolo cieco — game over\n\nSuggerimento: segui i suggerimenti arancioni sui bordi dello schermo — mostrano le direzioni disponibili.',
};

// Turkish
const tr: Translations = {
  title: 'Mandalina',
  subtitle: 'Mandalinayı tek dokunuşla soy',
  tapToStart: 'Başlamak için dokun',

  gameOver: 'Oyun Bitti',
  tapToTryAgain: 'Tekrar denemek için dokun',

  youWin: 'Kazandın!',
  tapToPlayAgain: 'Tekrar oynamak için dokun',

  wins: 'Galibiyet',
  streak: 'Seri',
  statsFormat: 'Galibiyet: {wins}/{total} | Seri: {streak}',
  peeled: '{time}s içinde {count}/{total} parça soyuldu',
  time: 'Süre: {time}s',

  liftedFinger: 'Parmağını kaldırdın!',
  mustPeelConnected: 'Bağlı parçaları soymalısın!',
  endedOnCenter: 'Orta parçada bitti!',
  noValidExit: 'Çıkış yok - tüm komşu taraflar soyuldu!',
  sideAlreadyPeeled: '{side} tarafı zaten soyuldu!',

  sides: {
    front: 'Ön',
    back: 'Arka',
    top: 'Üst',
    bottom: 'Alt',
    left: 'Sol',
    right: 'Sağ',
  },

  pageTitle: 'Mandalina',

  leaderboard: 'Skor Tablosu',
  bestTime: 'En iyi: {time}s',
  rank: 'Sıra: #{rank}',
  newRecord: 'Yeni rekor!',

  donateStars: 'Yıldız bağışla ⭐',

  share: 'Arkadaşına 🍊 gönder',
  shareText: '🍊✨ {time}s\'de soydum! Beni geçebilir misin? 🎄🎁',

  totalPeeled: 'Toplam soyulan mandalina: {count}',

  cellsCount: '{count} parça',

  noScoresYet: 'Henüz skor yok',

  saveClip: '📹 Klibi kaydet',
  savingClip: '⏳ Kaydediliyor...',

  gameName: 'Mandalina',
  seoDescription: 'Mandalinayı tek dokunuşla soy! Şenlikli rahat bir meydan okuma — parmağını kaldırmadan tüm dilimleri kaydır. En iyi süre için yarış.',
  gameDescription: 'Şenlikli rahat bir oyun! Mandalinayı tek sürekli parmak hareketiyle soy. Parmağını ekrandan kaldırmadan mandalinayın 6 yüzünden geç. Her yüz dilimlere bölünmüş — sırayla soy, kenara doğru hareket et. Parmağını kaldırırsan veya çıkmaz sokağa girersen — baştan başla! Skor tablosunda en iyi süre için yarış.',
  howToPlay: '1. Ekrana bas ve oyun bitene kadar parmağını kaldırma\n2. Parmağını mandalina dilimlerinin üzerinde hareket ettirerek kabuğu soy\n3. Sadece bitişik dilimleri soy — atlama\n4. Bir sonrakine geçmek için her yüzü kenar dilimde bitir\n5. Parmağını kaldırmadan mandalinayın 6 yüzünü de soy\n6. Parmağını kaldırırsan veya çıkmaz sokakta sıkışırsan — oyun bitti\n\nİpucu: ekranın kenarlarındaki turuncu ipuçlarını takip et — kullanılabilir yönleri gösterirler.',
};

// Arabic
const ar: Translations = {
  title: 'يوسفي',
  subtitle: 'قشّر اليوسفي بلمسة واحدة',
  tapToStart: 'اضغط للبدء',

  gameOver: 'انتهت اللعبة',
  tapToTryAgain: 'اضغط للمحاولة مرة أخرى',

  youWin: 'فزت!',
  tapToPlayAgain: 'اضغط للعب مرة أخرى',

  wins: 'انتصارات',
  streak: 'سلسلة',
  statsFormat: 'انتصارات: {wins}/{total} | سلسلة: {streak}',
  peeled: 'قشّرت {count}/{total} قطعة في {time} ثانية',
  time: 'الوقت: {time} ثانية',

  liftedFinger: 'رفعت إصبعك!',
  mustPeelConnected: 'يجب تقشير القطع المتصلة!',
  endedOnCenter: 'انتهيت على القطعة المركزية!',
  noValidExit: 'لا مخرج - كل الجوانب المجاورة مقشّرة!',
  sideAlreadyPeeled: 'الجانب {side} مقشّر بالفعل!',

  sides: {
    front: 'الأمام',
    back: 'الخلف',
    top: 'الأعلى',
    bottom: 'الأسفل',
    left: 'اليسار',
    right: 'اليمين',
  },

  pageTitle: 'يوسفي',

  leaderboard: 'لوحة المتصدرين',
  bestTime: 'الأفضل: {time} ثانية',
  rank: 'الترتيب: #{rank}',
  newRecord: 'رقم قياسي جديد!',

  donateStars: 'تبرّع بالنجوم ⭐',

  share: 'أرسل 🍊 لصديق',
  shareText: '🍊✨ قشّرتها في {time} ثانية! هل يمكنك التفوق عليّ؟ 🎄🎁',

  totalPeeled: 'إجمالي اليوسفي المقشّر: {count}',

  cellsCount: '{count} قطعة',

  noScoresYet: 'لا نتائج بعد',

  saveClip: '📹 حفظ المقطع',
  savingClip: '⏳ جاري الحفظ...',

  gameName: 'يوسفي',
  seoDescription: 'قشّر اليوسفي ثلاثي الأبعاد بلمسة واحدة! تحدٍ عرضي احتفالي — اسحب إصبعك على جميع القطع دون رفعه. تنافس على أفضل وقت.',
  gameDescription: 'لعبة عرضية احتفالية! قشّر اليوسفي بحركة إصبع واحدة مستمرة. مر عبر جميع الوجوه الستة لليوسفي دون رفع إصبعك عن الشاشة. كل وجه مقسم إلى قطع — قشّرها بالترتيب، متحركاً نحو الحافة. إذا رفعت إصبعك أو وصلت إلى طريق مسدود — ابدأ من جديد! تنافس على أفضل وقت في لوحة المتصدرين.',
  howToPlay: '1. اضغط على الشاشة ولا ترفع إصبعك حتى نهاية اللعبة\n2. حرّك إصبعك عبر قطع اليوسفي لتقشير القشرة\n3. قشّر القطع المتجاورة فقط — لا تقفز\n4. أنهِ كل وجه على قطعة حافة للانتقال إلى التالي\n5. قشّر جميع الوجوه الستة لليوسفي دون رفع إصبعك\n6. إذا رفعت إصبعك أو علقت في طريق مسدود — انتهت اللعبة\n\nنصيحة: تابع التلميحات البرتقالية على حواف الشاشة — تُظهر الاتجاهات المتاحة.',
};

// Indonesian
const id: Translations = {
  title: 'Jeruk',
  subtitle: 'Kupas jeruk dengan satu sentuhan',
  tapToStart: 'Ketuk untuk mulai',

  gameOver: 'Permainan Selesai',
  tapToTryAgain: 'Ketuk untuk coba lagi',

  youWin: 'Kamu Menang!',
  tapToPlayAgain: 'Ketuk untuk main lagi',

  wins: 'Menang',
  streak: 'Beruntun',
  statsFormat: 'Menang: {wins}/{total} | Beruntun: {streak}',
  peeled: 'Mengupas {count}/{total} bagian dalam {time}s',
  time: 'Waktu: {time}s',

  liftedFinger: 'Kamu mengangkat jari!',
  mustPeelConnected: 'Harus mengupas bagian yang terhubung!',
  endedOnCenter: 'Berakhir di bagian tengah!',
  noValidExit: 'Tidak ada jalan keluar - semua sisi yang berdekatan sudah dikupas!',
  sideAlreadyPeeled: 'Sisi {side} sudah dikupas!',

  sides: {
    front: 'Depan',
    back: 'Belakang',
    top: 'Atas',
    bottom: 'Bawah',
    left: 'Kiri',
    right: 'Kanan',
  },

  pageTitle: 'Jeruk',

  leaderboard: 'Papan Peringkat',
  bestTime: 'Terbaik: {time}s',
  rank: 'Peringkat: #{rank}',
  newRecord: 'Rekor baru!',

  donateStars: 'Donasi bintang ⭐',

  share: 'Kirim 🍊 ke teman',
  shareText: '🍊✨ Aku mengupasnya dalam {time}s! Bisakah kamu mengalahkanku? 🎄🎁',

  totalPeeled: 'Total jeruk dikupas: {count}',

  cellsCount: '{count} bagian',

  noScoresYet: 'Belum ada skor',

  saveClip: '📹 Simpan klip',
  savingClip: '⏳ Menyimpan...',

  gameName: 'Jeruk',
  seoDescription: 'Kupas jeruk 3D dengan satu sentuhan! Tantangan santai yang meriah — geser jari Anda di semua bagian tanpa mengangkat. Bersaing untuk waktu terbaik.',
  gameDescription: 'Permainan santai yang meriah! Kupas jeruk dengan satu gerakan jari yang berkelanjutan. Lewati semua 6 sisi jeruk tanpa mengangkat jari dari layar. Setiap sisi dibagi menjadi bagian — kupas secara berurutan, bergerak ke tepi. Jika Anda mengangkat jari atau masuk jalan buntu — mulai lagi! Bersaing untuk waktu terbaik di papan peringkat.',
  howToPlay: '1. Tekan layar dan jangan angkat jari sampai akhir permainan\n2. Gerakkan jari Anda melintasi bagian jeruk untuk mengupas kulitnya\n3. Kupas hanya bagian yang berdekatan — jangan melompat\n4. Selesaikan setiap sisi di bagian tepi untuk pindah ke berikutnya\n5. Kupas semua 6 sisi jeruk tanpa mengangkat jari\n6. Jika Anda mengangkat jari atau terjebak di jalan buntu — permainan selesai\n\nTip: ikuti petunjuk oranye di tepi layar — mereka menunjukkan arah yang tersedia.',
};

// Vietnamese
const vi: Translations = {
  title: 'Quýt',
  subtitle: 'Bóc quýt bằng một chạm',
  tapToStart: 'Chạm để bắt đầu',

  gameOver: 'Trò chơi kết thúc',
  tapToTryAgain: 'Chạm để thử lại',

  youWin: 'Bạn thắng!',
  tapToPlayAgain: 'Chạm để chơi lại',

  wins: 'Thắng',
  streak: 'Chuỗi',
  statsFormat: 'Thắng: {wins}/{total} | Chuỗi: {streak}',
  peeled: 'Bóc {count}/{total} miếng trong {time}s',
  time: 'Thời gian: {time}s',

  liftedFinger: 'Bạn đã nhấc ngón tay!',
  mustPeelConnected: 'Phải bóc các miếng liền kề!',
  endedOnCenter: 'Kết thúc ở miếng trung tâm!',
  noValidExit: 'Không có lối thoát - tất cả các mặt liền kề đã bóc!',
  sideAlreadyPeeled: 'Mặt {side} đã được bóc!',

  sides: {
    front: 'Trước',
    back: 'Sau',
    top: 'Trên',
    bottom: 'Dưới',
    left: 'Trái',
    right: 'Phải',
  },

  pageTitle: 'Quýt',

  leaderboard: 'Bảng xếp hạng',
  bestTime: 'Tốt nhất: {time}s',
  rank: 'Hạng: #{rank}',
  newRecord: 'Kỷ lục mới!',

  donateStars: 'Tặng sao ⭐',

  share: 'Gửi 🍊 cho bạn bè',
  shareText: '🍊✨ Tôi bóc trong {time}s! Bạn có thể đánh bại tôi không? 🎄🎁',

  totalPeeled: 'Tổng số quýt đã bóc: {count}',

  cellsCount: '{count} miếng',

  noScoresYet: 'Chưa có điểm',

  saveClip: '📹 Lưu clip',
  savingClip: '⏳ Đang lưu...',

  gameName: 'Quýt',
  seoDescription: 'Bóc quýt 3D bằng một chạm! Thử thách giải trí lễ hội — vuốt ngón tay qua tất cả các miếng mà không nhấc lên. Tranh tài về thời gian tốt nhất.',
  gameDescription: 'Trò chơi giải trí lễ hội! Bóc quýt bằng một cử động ngón tay liên tục. Đi qua tất cả 6 mặt của quả quýt mà không nhấc ngón tay khỏi màn hình. Mỗi mặt được chia thành các miếng — bóc theo thứ tự, di chuyển về phía rìa. Nếu bạn nhấc ngón tay hoặc đi vào ngõ cụt — bắt đầu lại! Tranh tài về thời gian tốt nhất trên bảng xếp hạng.',
  howToPlay: '1. Nhấn vào màn hình và không nhấc ngón tay cho đến khi kết thúc trò chơi\n2. Di chuyển ngón tay qua các miếng quýt để bóc vỏ\n3. Chỉ bóc các miếng liền kề — không được nhảy\n4. Kết thúc mỗi mặt ở miếng rìa để chuyển sang mặt tiếp theo\n5. Bóc tất cả 6 mặt của quả quýt mà không nhấc ngón tay\n6. Nếu bạn nhấc ngón tay hoặc bị mắc kẹt trong ngõ cụt — trò chơi kết thúc\n\nMẹo: theo dõi các gợi ý màu cam ở rìa màn hình — chúng hiển thị các hướng có sẵn.',
};

// Polish
const pl: Translations = {
  title: 'Mandarynka',
  subtitle: 'Obierz mandarynkę jednym dotknięciem',
  tapToStart: 'Dotknij, aby zacząć',

  gameOver: 'Koniec gry',
  tapToTryAgain: 'Dotknij, aby spróbować ponownie',

  youWin: 'Wygrałeś!',
  tapToPlayAgain: 'Dotknij, aby zagrać ponownie',

  wins: 'Wygrane',
  streak: 'Seria',
  statsFormat: 'Wygrane: {wins}/{total} | Seria: {streak}',
  peeled: 'Obrano {count}/{total} kawałków w {time}s',
  time: 'Czas: {time}s',

  liftedFinger: 'Podniosłeś palec!',
  mustPeelConnected: 'Musisz obierać połączone kawałki!',
  endedOnCenter: 'Skończyłeś na środkowym kawałku!',
  noValidExit: 'Brak wyjścia - wszystkie sąsiednie strony obrane!',
  sideAlreadyPeeled: 'Strona {side} jest już obrana!',

  sides: {
    front: 'Przód',
    back: 'Tył',
    top: 'Góra',
    bottom: 'Dół',
    left: 'Lewo',
    right: 'Prawo',
  },

  pageTitle: 'Mandarynka',

  leaderboard: 'Ranking',
  bestTime: 'Najlepszy: {time}s',
  rank: 'Pozycja: #{rank}',
  newRecord: 'Nowy rekord!',

  donateStars: 'Podaruj gwiazdki ⭐',

  share: 'Wyślij 🍊 znajomemu',
  shareText: '🍊✨ Obrałem w {time}s! Możesz to pobić? 🎄🎁',

  totalPeeled: 'Łącznie obranych mandarynek: {count}',

  cellsCount: '{count} kawałków',

  noScoresYet: 'Brak wyników',

  saveClip: '📹 Zapisz klip',
  savingClip: '⏳ Zapisywanie...',

  gameName: 'Mandarynka',
  seoDescription: 'Obierz mandarynkę 3D jednym dotknięciem! Świąteczne wyzwanie casual — przesuń palec po wszystkich kawałkach bez podnoszenia. Rywalizuj o najlepszy czas.',
  gameDescription: 'Świąteczna gra casual! Obierz mandarynkę jednym ciągłym ruchem palca. Przejdź przez wszystkie 6 stron mandarynki bez podnoszenia palca z ekranu. Każda strona jest podzielona na kawałki — obieraj je po kolei, poruszając się do krawędzi. Jeśli podniesiesz palec lub wejdziesz w ślepą uliczkę — zacznij od nowa! Rywalizuj o najlepszy czas w rankingu.',
  howToPlay: '1. Naciśnij ekran i nie podnoś palca do końca gry\n2. Przesuń palec po kawałkach mandarynki, aby obrać skórkę\n3. Obieraj tylko sąsiednie kawałki — nie przeskakuj\n4. Kończ każdą stronę na kawałku brzegowym, aby przejść do następnej\n5. Obierz wszystkie 6 stron mandarynki bez podnoszenia palca\n6. Jeśli podniesiesz palec lub utkniesz w ślepej uliczce — koniec gry\n\nWskazówka: śledź pomarańczowe podpowiedzi na brzegach ekranu — pokazują dostępne kierunki.',
};

// Dutch
const nl: Translations = {
  title: 'Mandarijn',
  subtitle: 'Pel de mandarijn met één aanraking',
  tapToStart: 'Tik om te starten',

  gameOver: 'Game Over',
  tapToTryAgain: 'Tik om opnieuw te proberen',

  youWin: 'Je hebt gewonnen!',
  tapToPlayAgain: 'Tik om opnieuw te spelen',

  wins: 'Gewonnen',
  streak: 'Reeks',
  statsFormat: 'Gewonnen: {wins}/{total} | Reeks: {streak}',
  peeled: '{count}/{total} stukjes gepeld in {time}s',
  time: 'Tijd: {time}s',

  liftedFinger: 'Je hebt je vinger opgetild!',
  mustPeelConnected: 'Je moet verbonden stukjes pellen!',
  endedOnCenter: 'Geëindigd op het middelste stukje!',
  noValidExit: 'Geen uitweg - alle aangrenzende zijden gepeld!',
  sideAlreadyPeeled: 'Zijde {side} is al gepeld!',

  sides: {
    front: 'Voor',
    back: 'Achter',
    top: 'Boven',
    bottom: 'Onder',
    left: 'Links',
    right: 'Rechts',
  },

  pageTitle: 'Mandarijn',

  leaderboard: 'Scorebord',
  bestTime: 'Beste: {time}s',
  rank: 'Rang: #{rank}',
  newRecord: 'Nieuw record!',

  donateStars: 'Sterren doneren ⭐',

  share: 'Stuur 🍊 naar een vriend',
  shareText: '🍊✨ Ik pelde het in {time}s! Kun jij mij verslaan? 🎄🎁',

  totalPeeled: 'Totaal gepelde mandarijnen: {count}',

  cellsCount: '{count} stukjes',

  noScoresYet: 'Nog geen scores',

  saveClip: '📹 Clip opslaan',
  savingClip: '⏳ Opslaan...',

  gameName: 'Mandarijn',
  seoDescription: 'Pel de 3D-mandarijn met één aanraking! Een feestelijke casual-uitdaging — veeg je vinger over alle stukjes zonder op te tillen. Strijd om de beste tijd.',
  gameDescription: 'Een feestelijk casual-spel! Pel de mandarijn met één doorlopende vingerbeweging. Ga door alle 6 zijden van de mandarijn zonder je vinger van het scherm te halen. Elke zijde is verdeeld in stukjes — pel ze op volgorde, beweeg naar de rand. Als je je vinger optilt of in een doodlopende straat komt — begin opnieuw! Strijd om de beste tijd op het scorebord.',
  howToPlay: '1. Druk op het scherm en til je vinger niet op tot het einde van het spel\n2. Beweeg je vinger over de mandarijnstukjes om de schil te pellen\n3. Pel alleen aangrenzende stukjes — spring niet\n4. Eindig elke zijde op een randstukje om naar de volgende te gaan\n5. Pel alle 6 zijden van de mandarijn zonder je vinger op te tillen\n6. Als je je vinger optilt of vastloopt in een doodlopende straat — game over\n\nTip: volg de oranje hints aan de randen van het scherm — ze tonen beschikbare richtingen.',
};

// Kazakh
const kk: Translations = {
  title: 'Мандарин',
  subtitle: 'Мандаринді бір рет басып тазалаңыз',
  tapToStart: 'Бастау үшін басыңыз',

  gameOver: 'Ойын аяқталды',
  tapToTryAgain: 'Қайта көру үшін басыңыз',

  youWin: 'Жеңдіңіз!',
  tapToPlayAgain: 'Қайта ойнау үшін басыңыз',

  wins: 'Жеңістер',
  streak: 'Серия',
  statsFormat: 'Жеңістер: {wins}/{total} | Серия: {streak}',
  peeled: '{time}с-та {count}/{total} бөлік тазаланды',
  time: 'Уақыт: {time}с',

  liftedFinger: 'Саусағыңызды көтердіңіз!',
  mustPeelConnected: 'Жалғасқан бөліктерді тазалау керек!',
  endedOnCenter: 'Орталық бөлікте аяқталды!',
  noValidExit: 'Шығу жоқ - барлық көрші жақтар тазаланды!',
  sideAlreadyPeeled: '{side} жағы әлдеқашан тазаланды!',

  sides: {
    front: 'Алдыңғы',
    back: 'Артқы',
    top: 'Үстіңгі',
    bottom: 'Астыңғы',
    left: 'Сол жақ',
    right: 'Оң жақ',
  },

  pageTitle: 'Мандарин',

  leaderboard: 'Көшбасшылар тақтасы',
  bestTime: 'Ең жақсы: {time}с',
  rank: 'Орын: #{rank}',
  newRecord: 'Жаңа рекорд!',

  donateStars: 'Жұлдыздар сыйлау ⭐',

  share: 'Досқа 🍊 жіберу',
  shareText: '🍊✨ Мен оны {time}с-та тазаладым! Жеңе аласыз ба? 🎄🎁',

  totalPeeled: 'Барлығы тазаланды: {count}',

  cellsCount: '{count} бөлік',

  noScoresYet: 'Әлі нәтижелер жоқ',

  saveClip: '📹 Клипті сақтау',
  savingClip: '⏳ Сақталуда...',

  gameName: 'Мандарин',
  seoDescription: '3D мандаринді бір рет басып тазалаңыз! Мерекелік қарапайым қиындық — барлық бөліктерден саусағыңызды көтермей өтіңіз. Ең жақсы уақыт үшін бәсекелесіңіз.',
  gameDescription: 'Мерекелік қарапайым ойын! Мандаринді саусақтың бір үздіксіз қимылымен тазалаңыз. Экраннан саусағыңызды көтермей мандариннің барлық 6 жағынан өтіңіз. Әр жақ бөліктерге бөлінген — оларды ретімен тазалаңыз, шетіне қарай жылжыңыз. Егер саусағыңызды көтерсеңіз немесе тұйыққа кірсеңіз — қайта бастаңыз! Көшбасшылар тақтасында ең жақсы уақыт үшін бәсекелесіңіз.',
  howToPlay: '1. Экранды басыңыз және ойын аяқталғанша саусағыңызды көтермеңіз\n2. Қабықты тазалау үшін саусағыңызды мандарин бөліктері арқылы жылжытыңыз\n3. Тек көрші бөліктерді тазалаңыз — секірмеңіз\n4. Келесіге өту үшін әр жақты шеткі бөлікте аяқтаңыз\n5. Саусағыңызды көтермей мандариннің барлық 6 жағын тазалаңыз\n6. Егер саусағыңызды көтерсеңіз немесе тұйыққа түссеңіз — ойын аяқталды\n\nКеңес: экранның шеттеріндегі қызғылт сары кеңестерді қадағалаңыз — олар қолжетімді бағыттарды көрсетеді.',
};

// Uzbek
const uz: Translations = {
  title: 'Mandarin',
  subtitle: 'Mandarinni bir marta bosish bilan tozalang',
  tapToStart: 'Boshlash uchun bosing',

  gameOver: 'O\'yin tugadi',
  tapToTryAgain: 'Qayta urinish uchun bosing',

  youWin: 'Yutdingiz!',
  tapToPlayAgain: 'Qayta o\'ynash uchun bosing',

  wins: 'G\'alabalar',
  streak: 'Seriya',
  statsFormat: 'G\'alabalar: {wins}/{total} | Seriya: {streak}',
  peeled: '{time}s ichida {count}/{total} bo\'lak tozalandi',
  time: 'Vaqt: {time}s',

  liftedFinger: 'Barmog\'ingizni ko\'tardingiz!',
  mustPeelConnected: 'Bog\'langan bo\'laklarni tozalash kerak!',
  endedOnCenter: 'Markaziy bo\'lakda tugadi!',
  noValidExit: 'Chiqish yo\'q - barcha qo\'shni tomonlar tozalandi!',
  sideAlreadyPeeled: '{side} tomoni allaqachon tozalangan!',

  sides: {
    front: 'Old',
    back: 'Orqa',
    top: 'Yuqori',
    bottom: 'Pastki',
    left: 'Chap',
    right: 'O\'ng',
  },

  pageTitle: 'Mandarin',

  leaderboard: 'Yetakchilar jadvali',
  bestTime: 'Eng yaxshi: {time}s',
  rank: 'O\'rin: #{rank}',
  newRecord: 'Yangi rekord!',

  donateStars: 'Yulduzlar sovg\'a qilish ⭐',

  share: 'Do\'stga 🍊 yuborish',
  shareText: '🍊✨ Men uni {time}s ichida tozaladim! Yuta olasizmi? 🎄🎁',

  totalPeeled: 'Jami tozalandi: {count}',

  cellsCount: '{count} bo\'lak',

  noScoresYet: 'Hali natijalar yo\'q',

  saveClip: '📹 Klipni saqlash',
  savingClip: '⏳ Saqlanmoqda...',

  gameName: 'Mandarin',
  seoDescription: '3D mandarinni bir bosishda tozalang! Bayramona o\'yin — barmoq ko\'tarmasdan barcha bo\'laklardan o\'ting. Eng yaxshi vaqt uchun kurashing!',
  gameDescription: 'Bayramona oddiy o\'yin! Mandarinni barmoqning bir uzluksiz harakati bilan tozalang. Ekrandan barmoq ko\'tarmasdan mandarinning barcha 6 tomonidan o\'ting. Har bir tomon bo\'laklarga bo\'lingan — ularni tartib bilan tozalang, chekkaga siljing. Agar barmoq ko\'tarsangiz yoki boshi berk ko\'chaga kirsangiz — qaytadan boshlang! Yetakchilar jadvalida eng yaxshi vaqt uchun raqobatlashing.',
  howToPlay: '1. Ekranni bosing va o\'yin tugaguncha barmog\'ingizni ko\'tarmang\n2. Po\'stini tozalash uchun barmog\'ingizni mandarin bo\'laklari orqali harakatlantiring\n3. Faqat qo\'shni bo\'laklarni tozalang — sakramang\n4. Keyingisiga o\'tish uchun har bir tomonni chet bo\'lakda tugatang\n5. Barmog\'ingizni ko\'tarmasdan mandarinning barcha 6 tomonini tozalang\n6. Agar barmog\'ingizni ko\'tarsangiz yoki boshi berk ko\'chaga tushsangiz — o\'yin tugadi\n\nMaslahat: ekran chetlaridagi to\'q sariq maslahatlarni kuzatib boring — ular mavjud yo\'nalishlarni ko\'rsatadi.',
};

// All translations with full support
const translations: Record<Language, Translations> = {
  en,
  ru,
  ko,
  ja,
  th,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  es,
  pt,
  fr,
  de,
  it,
  tr,
  ar,
  id,
  vi,
  pl,
  nl,
  kk,
  uz,
};

// Detect language from localStorage or browser
function detectLanguage(): Language {
  // 1. Check localStorage for user preference
  try {
    const saved = localStorage.getItem('mandarin-language');
    if (saved && saved in translations) {
      return saved as Language;
    }
  } catch {
    // Ignore localStorage errors
  }

  // 2. Get browser language
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const fullLang = browserLang.toLowerCase();
  const lang = fullLang.split('-')[0];

  // Handle Chinese variants (zh-Hans, zh-Hant, zh-CN, zh-TW, zh-HK)
  if (lang === 'zh') {
    if (fullLang.includes('hant') || fullLang.includes('tw') || fullLang.includes('hk')) {
      return 'zh-Hant';
    }
    return 'zh-Hans';
  }

  // Check if we have a direct translation
  if (lang in translations) {
    return lang as Language;
  }

  // Ukrainian and Belarusian fallback to Russian
  if (lang === 'uk' || lang === 'be') {
    return 'ru';
  }

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

  // Re-detect language
  redetect(): void {
    const newLang = detectLanguage();
    if (newLang !== this.currentLang) {
      this.currentLang = newLang;
      this.t = translations[newLang];
      this.updatePageTitle();
      console.log('[i18n] Language changed to:', newLang);
    }
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

// Singleton instance
export const i18n = new I18n();

export function setLanguageFromYandex(yandexLang: string): void {
  const fullLang = yandexLang.toLowerCase();
  const lang = fullLang.split('-')[0];

  // Handle Chinese variants
  if (lang === 'zh') {
    if (fullLang.includes('hant') || fullLang.includes('tw') || fullLang.includes('hk')) {
      i18n.setLanguage('zh-Hant');
    } else {
      i18n.setLanguage('zh-Hans');
    }
    return;
  }

  // Check if we have a direct translation
  if (lang in translations) {
    i18n.setLanguage(lang as Language);
    return;
  }

  // Ukrainian and Belarusian fallback to Russian
  if (lang === 'uk' || lang === 'be') {
    i18n.setLanguage('ru');
    return;
  }

  // Default to English for Yandex (more international audience)
  i18n.setLanguage('en');
}
