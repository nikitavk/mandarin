// Telegram Mini App integration + Leaderboard API

const API_URL = 'https://mandarin-leaderboard.mandarin-game.workers.dev';

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  colorScheme: 'light' | 'dark';
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void;
    getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
    getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void;
  };
  openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  switchInlineQuery: (query: string, chatTypes?: ('users' | 'bots' | 'groups' | 'channels')[]) => void;
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface LeaderboardEntry {
  odaUserId: number;
  odaName: string;
  time: number; // seconds (lower is better)
  date: number; // timestamp
}

class TelegramManager {
  private webApp: TelegramWebApp | null = null;
  private _isAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      // Check if we have actual user data - this only exists when running inside Telegram
      const hasUser = !!this.webApp.initDataUnsafe?.user?.id;
      this._isAvailable = hasUser;
      this.webApp.ready();
      this.webApp.expand();
      console.log('[Telegram]', hasUser ? 'Running inside Telegram Mini App' : 'SDK loaded but not in Telegram');
    } else {
      console.log('[Telegram] Not running inside Telegram');
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  get user() {
    return this.webApp?.initDataUnsafe?.user ?? null;
  }

  get userId(): number | null {
    return this.user?.id ?? null;
  }

  get userName(): string {
    const user = this.user;
    if (!user) return 'Player';
    if (user.username) return user.username;
    return user.first_name + (user.last_name ? ' ' + user.last_name : '');
  }

  // Save best time to CloudStorage
  async saveBestTime(timeSeconds: number): Promise<void> {
    if (!this.webApp) return;

    const currentBest = await this.getBestTime();

    // Only save if it's a new best (or first time)
    if (currentBest === null || timeSeconds < currentBest) {
      return new Promise((resolve) => {
        this.webApp!.CloudStorage.setItem(
          'bestTime',
          timeSeconds.toString(),
          () => resolve()
        );
      });
    }
  }

  // Get best time from CloudStorage
  async getBestTime(): Promise<number | null> {
    if (!this.webApp) return null;

    return new Promise((resolve) => {
      this.webApp!.CloudStorage.getItem('bestTime', (error, value) => {
        if (error || !value) {
          resolve(null);
        } else {
          resolve(parseFloat(value));
        }
      });
    });
  }

  // Save leaderboard to CloudStorage (simple version - stores top 10)
  async saveToLeaderboard(timeSeconds: number): Promise<void> {
    if (!this.webApp || !this.userId) return;

    const entry: LeaderboardEntry = {
      odaUserId: this.userId,
      odaName: this.userName,
      time: timeSeconds,
      date: Date.now(),
    };

    // Get existing leaderboard
    const leaderboard = await this.getLeaderboard();

    // Check if user already has an entry
    const existingIndex = leaderboard.findIndex(e => e.odaUserId === this.userId);

    if (existingIndex >= 0) {
      // Only update if new time is better
      if (timeSeconds < leaderboard[existingIndex].time) {
        leaderboard[existingIndex] = entry;
      }
    } else {
      leaderboard.push(entry);
    }

    // Sort by time (fastest first) and keep top 100
    leaderboard.sort((a, b) => a.time - b.time);
    const top100 = leaderboard.slice(0, 100);

    return new Promise((resolve) => {
      this.webApp!.CloudStorage.setItem(
        'leaderboard',
        JSON.stringify(top100),
        () => resolve()
      );
    });
  }

  // Get leaderboard from CloudStorage
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.webApp) return [];

    return new Promise((resolve) => {
      this.webApp!.CloudStorage.getItem('leaderboard', (error, value) => {
        if (error || !value) {
          resolve([]);
        } else {
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve([]);
          }
        }
      });
    });
  }

  // Get user's rank on leaderboard (from CloudStorage - deprecated)
  async getUserRank(): Promise<{ rank: number; total: number } | null> {
    if (!this.userId) return null;

    const leaderboard = await this.getLeaderboard();
    const index = leaderboard.findIndex(e => e.odaUserId === this.userId);

    if (index < 0) return null;

    return {
      rank: index + 1,
      total: leaderboard.length,
    };
  }

  // Open invoice for Stars donation
  openInvoice(invoiceUrl: string): Promise<'paid' | 'cancelled' | 'failed' | 'pending'> {
    return new Promise((resolve) => {
      if (!this.webApp) {
        resolve('failed');
        return;
      }

      let resolved = false;

      // Timeout in case callback never fires
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve('cancelled');
        }
      }, 60000); // 60 second timeout

      this.webApp.openInvoice(invoiceUrl, (status) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(status);
        }
      });
    });
  }

  // Share the app via Telegram
  shareApp(text: string): void {
    if (!this.webApp) return;

    // Link directly to the mini app
    const appUrl = 'https://t.me/MANDARINMANDARINbot/MANDARIN';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
    this.webApp.openTelegramLink(shareUrl);
  }

  // Share a link via Telegram (with custom URL for OG preview)
  shareLink(url: string, text: string): void {
    if (!this.webApp) return;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    this.webApp.openTelegramLink(shareUrl);
  }

  // Share via inline query (shows image with button)
  // cellsPerSide should be 1,3,5,7... to match win_pics filenames
  // timeSeconds is the time taken to complete the level
  shareInline(cellsPerSide: number, timeSeconds: number): boolean {
    console.log('[TG] shareInline called, cellsPerSide:', cellsPerSide, 'time:', timeSeconds);
    console.log('[TG] webApp:', !!this.webApp);
    console.log('[TG] switchInlineQuery:', !!this.webApp?.switchInlineQuery);

    if (!this.webApp?.switchInlineQuery) {
      console.log('[TG] switchInlineQuery not available, falling back');
      return false;
    }

    try {
      // Format: "cellsPerSide:timeSeconds" e.g. "5:12.3"
      const query = `${cellsPerSide}:${timeSeconds.toFixed(1)}`;
      this.webApp.switchInlineQuery(query, ['users', 'groups', 'channels']);
      console.log('[TG] switchInlineQuery called successfully');
      return true;
    } catch (e) {
      console.error('[TG] switchInlineQuery error:', e);
      return false;
    }
  }
}

// Singleton
export const telegram = new TelegramManager();

// ============ Anonymous Web User Support ============

// Generate a unique anonymous user ID for web users (not in Telegram/LINE)
function generateAnonymousId(): string {
  // Generate a UUID-like ID
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'web_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Get or create anonymous user ID from localStorage
export function getAnonymousUserId(): string | null {
  try {
    let id = localStorage.getItem('mandarin-anonymous-id');
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem('mandarin-anonymous-id', id);
    }
    return id;
  } catch {
    // localStorage not available
    return null;
  }
}

// Get anonymous user name from localStorage
export function getAnonymousUserName(): string {
  try {
    return localStorage.getItem('mandarin-anonymous-name') || 'Player';
  } catch {
    return 'Player';
  }
}

// Set anonymous user name
export function setAnonymousUserName(name: string): void {
  try {
    localStorage.setItem('mandarin-anonymous-name', name);
  } catch {
    // Ignore localStorage errors
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
  platform: 'telegram' | 'line' | 'web';
}

export interface LeaderboardResponse {
  leaderboard: APILeaderboardEntry[];
}

export type LeaderboardSortBy = 'time' | 'streak' | 'streakTime';

export async function submitScore(
  odaUserId: string,
  odaName: string,
  time: number,
  platform: 'telegram' | 'line' | 'web' = 'telegram',
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
  platform?: 'telegram' | 'line' | 'web',
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

export async function createDonationInvoice(
  stars: number = 50
): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { invoiceUrl?: string };
    return data.invoiceUrl ?? null;
  } catch {
    return null;
  }
}
