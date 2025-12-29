// Yandex Games SDK integration

const API_URL = 'https://mandarin-leaderboard.mandarin-game.workers.dev';

interface YandexPlayer {
  getID(): string;
  getName(): string;
  getPhoto(size: 'small' | 'medium' | 'large'): string;
  getUniqueID(): string;
}

interface YandexLeaderboards {
  getLeaderboardEntries(
    leaderboardName: string,
    options?: { quantityTop?: number; quantityAround?: number; includeUser?: boolean }
  ): Promise<{
    leaderboard: { name: string };
    userRank: number;
    entries: Array<{
      rank: number;
      score: number;
      player: { publicName: string; uniqueID: string };
    }>;
  }>;
  getLeaderboardPlayerEntry(leaderboardName: string): Promise<{
    score: number;
    rank: number;
    player: { publicName: string; uniqueID: string };
  }>;
  setLeaderboardScore(leaderboardName: string, score: number): Promise<void>;
}

interface YandexSDK {
  features: {
    LoadingAPI?: {
      ready: () => void;
    };
  };
  adv: {
    showFullscreenAdv: (options: {
      callbacks: {
        onClose?: (wasShown: boolean) => void;
        onError?: (error: Error) => void;
        onOpen?: () => void;
        onOffline?: () => void;
      };
    }) => void;
    showRewardedVideo: (options: {
      callbacks: {
        onClose?: (wasRewarded: boolean) => void;
        onError?: (error: Error) => void;
        onOpen?: () => void;
        onRewarded?: () => void;
      };
    }) => void;
  };
  getPlayer(options?: { signed?: boolean }): Promise<YandexPlayer>;
  getLeaderboards(): Promise<YandexLeaderboards>;
  environment: {
    i18n: {
      lang: string;
      tld: string;
    };
  };
}

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexSDK>;
    };
  }
}

export interface LeaderboardEntry {
  odaUserId: string;
  odaName: string;
  time: number;
  date: number;
}

class YandexManager {
  private sdk: YandexSDK | null = null;
  private player: YandexPlayer | null = null;
  private leaderboards: YandexLeaderboards | null = null;
  private _isAvailable: boolean = false;
  private _isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // SDK will be initialized via init() method
  }

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    if (typeof window === 'undefined' || !window.YaGames) {
      console.log('[Yandex] SDK not available');
      return;
    }

    try {
      this.sdk = await window.YaGames.init();
      this._isAvailable = true;
      this._isInitialized = true;
      console.log('[Yandex] SDK initialized');

      // Signal that game is ready to load
      this.sdk.features.LoadingAPI?.ready();

      // Get player info
      try {
        this.player = await this.sdk.getPlayer({ signed: false });
        console.log('[Yandex] Player loaded:', this.player.getName());
      } catch (e) {
        console.log('[Yandex] Player not authorized');
      }

      // Get leaderboards API
      try {
        this.leaderboards = await this.sdk.getLeaderboards();
        console.log('[Yandex] Leaderboards loaded');
      } catch (e) {
        console.log('[Yandex] Leaderboards not available');
      }
    } catch (error) {
      console.error('[Yandex] Failed to initialize SDK:', error);
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get userId(): string | null {
    return this.player?.getUniqueID() ?? null;
  }

  get userName(): string {
    return this.player?.getName() ?? 'Player';
  }

  get language(): string {
    return this.sdk?.environment.i18n.lang ?? 'en';
  }

  // Show interstitial ad (between game sessions)
  showInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.sdk) {
        resolve(false);
        return;
      }

      this.sdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: (wasShown) => {
            console.log('[Yandex] Interstitial closed, wasShown:', wasShown);
            resolve(wasShown);
          },
          onError: (error) => {
            console.error('[Yandex] Interstitial error:', error);
            resolve(false);
          },
          onOpen: () => {
            console.log('[Yandex] Interstitial opened');
          },
          onOffline: () => {
            console.log('[Yandex] User is offline');
            resolve(false);
          },
        },
      });
    });
  }

  // Show rewarded video ad
  showRewardedAd(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.sdk) {
        resolve(false);
        return;
      }

      let rewarded = false;

      this.sdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => {
            console.log('[Yandex] User rewarded');
            rewarded = true;
          },
          onClose: () => {
            console.log('[Yandex] Rewarded video closed');
            resolve(rewarded);
          },
          onError: (error) => {
            console.error('[Yandex] Rewarded video error:', error);
            resolve(false);
          },
          onOpen: () => {
            console.log('[Yandex] Rewarded video opened');
          },
        },
      });
    });
  }

  // Get player's current best time from Yandex leaderboard
  async getPlayerBestTimeMs(): Promise<number | null> {
    if (!this.leaderboards) return null;

    try {
      const entry = await this.leaderboards.getLeaderboardPlayerEntry('main');
      return entry.score;
    } catch (e) {
      // LEADERBOARD_PLAYER_NOT_PRESENT means player has no entry yet
      console.log('[Yandex] Player has no leaderboard entry yet');
      return null;
    }
  }

  // Submit score to Yandex leaderboard (time type, 3 digits = milliseconds)
  // Only submits if the new time is better (lower) than the current best
  async submitToYandexLeaderboard(timeMs: number): Promise<boolean> {
    if (!this.leaderboards) return false;

    try {
      // Check if this is a new record (lower time = better)
      const currentBestMs = await this.getPlayerBestTimeMs();
      if (currentBestMs !== null && timeMs >= currentBestMs) {
        console.log('[Yandex] Score not submitted (not a new record):', timeMs, 'ms >=', currentBestMs, 'ms');
        return false;
      }

      // Yandex time leaderboard: lower = better, score is in milliseconds
      await this.leaderboards.setLeaderboardScore('main', Math.round(timeMs));
      console.log('[Yandex] New record submitted:', timeMs, 'ms');

      return true;
    } catch (e) {
      console.error('[Yandex] Failed to submit score:', e);
      return false;
    }
  }

  // Get Yandex leaderboard entries
  async getYandexLeaderboard(): Promise<Array<{ rank: number; name: string; timeMs: number }>> {
    if (!this.leaderboards) return [];

    try {
      const result = await this.leaderboards.getLeaderboardEntries('main', {
        quantityTop: 10,
        includeUser: true,
      });

      return result.entries.map((entry) => ({
        rank: entry.rank,
        name: entry.player.publicName,
        timeMs: entry.score, // Score is already in milliseconds
      }));
    } catch (e) {
      console.error('[Yandex] Failed to get leaderboard:', e);
      return [];
    }
  }

  // Save best time to localStorage (fallback)
  async saveBestTime(timeSeconds: number): Promise<void> {
    try {
      const currentBest = await this.getBestTime();
      if (currentBest === null || timeSeconds < currentBest) {
        localStorage.setItem('mandarin-best-time', timeSeconds.toString());
      }
    } catch {
      // Ignore storage errors
    }
  }

  async getBestTime(): Promise<number | null> {
    try {
      const value = localStorage.getItem('mandarin-best-time');
      return value ? parseFloat(value) : null;
    } catch {
      return null;
    }
  }
}

// Singleton
export const yandex = new YandexManager();

// ============ Anonymous Web User Support ============

function generateAnonymousId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'yandex_' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getAnonymousUserId(): string | null {
  try {
    let id = localStorage.getItem('mandarin-anonymous-id');
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem('mandarin-anonymous-id', id);
    }
    return id;
  } catch {
    return null;
  }
}

export function getAnonymousUserName(): string {
  try {
    return localStorage.getItem('mandarin-anonymous-name') || 'Player';
  } catch {
    return 'Player';
  }
}

export function setAnonymousUserName(name: string): void {
  try {
    localStorage.setItem('mandarin-anonymous-name', name);
  } catch {
    // Ignore
  }
}

// ============ Global Leaderboard API ============

export interface ScoreResponse {
  success: boolean;
  rank: number | null;
  bestTime: number | null;
}

export interface APILeaderboardEntry {
  rank: number;
  odaUserId: string;
  odaName: string;
  time: number;
  streak: number;
  streakTime: number;
  cellCount: number;
  platform: 'telegram' | 'line' | 'web' | 'yandex';
}

export interface LeaderboardResponse {
  leaderboard: APILeaderboardEntry[];
}

export type LeaderboardSortBy = 'time' | 'streak' | 'streakTime';

export async function submitScore(
  odaUserId: string,
  odaName: string,
  time: number,
  platform: 'telegram' | 'line' | 'web' | 'yandex' = 'yandex',
  options?: {
    streak?: number;
    streakTime?: number;
    streakId?: string;
    cellCount?: number;
  }
): Promise<ScoreResponse | null> {
  try {
    const response = await fetch(`${API_URL}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        odaUserId,
        odaName,
        time,
        platform,
        streak: options?.streak || 0,
        streakTime: options?.streakTime || 0,
        streakId: options?.streakId || null,
        cellCount: options?.cellCount || 1,
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getLeaderboard(
  limit = 10,
  platform?: 'telegram' | 'line' | 'web' | 'yandex',
  options?: {
    cellCount?: number;
    sortBy?: LeaderboardSortBy;
  }
): Promise<LeaderboardResponse | null> {
  try {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (platform) {
      params.set('platform', platform);
    }
    if (options?.cellCount) {
      params.set('cellCount', String(options.cellCount));
    }
    if (options?.sortBy) {
      params.set('sortBy', options.sortBy);
    }
    const response = await fetch(`${API_URL}/leaderboard?${params.toString()}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getUserRankFromAPI(
  odaUserId: string,
  cellCount?: number
): Promise<{ rank: number; bestTime: number; total: number; streak: number; streakTime: number } | null> {
  try {
    let url = `${API_URL}/rank/${encodeURIComponent(odaUserId)}`;
    if (cellCount) {
      url += `?cellCount=${cellCount}`;
    }
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
