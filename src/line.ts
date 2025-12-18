// LINE LIFF (LINE Front-end Framework) integration
// Documentation: https://developers.line.biz/en/docs/liff/

import liff from '@line/liff';
import { i18n } from './i18n';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineShareResult {
  status: 'success' | 'cancelled';
}

class LineManager {
  private _isInitialized: boolean = false;
  private _isLoggedIn: boolean = false;
  private _profile: LineProfile | null = null;
  private _isInClient: boolean = false;

  // Replace with your LIFF ID from LINE Developers Console
  private readonly LIFF_ID = '2008701589-C29pObv0';

  async init(): Promise<boolean> {
    try {
      await liff.init({ liffId: this.LIFF_ID });
      this._isInitialized = true;
      this._isInClient = liff.isInClient();
      this._isLoggedIn = liff.isLoggedIn();

      // In LINE app, users are auto-logged in, so always try to load profile
      if (this._isLoggedIn || this._isInClient) {
        await this.loadProfile();
      }

      console.log('[LINE] Initialized:', {
        isInClient: this._isInClient,
        isLoggedIn: this._isLoggedIn,
        userId: this._profile?.userId ?? null,
        userName: this._profile?.displayName ?? null,
      });

      return true;
    } catch (error) {
      console.error('[LINE] Init failed:', error);
      return false;
    }
  }

  get isAvailable(): boolean {
    return this._isInitialized;
  }

  get isInClient(): boolean {
    return this._isInClient;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  get profile(): LineProfile | null {
    return this._profile;
  }

  get userId(): string | null {
    return this._profile?.userId ?? null;
  }

  get userName(): string {
    return this._profile?.displayName ?? 'Player';
  }

  private async loadProfile(): Promise<void> {
    if (!this._isInitialized) return;

    try {
      const profile = await liff.getProfile();
      this._profile = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      };
      console.log('[LINE] Profile loaded:', this._profile.displayName);
    } catch (error) {
      console.error('[LINE] Failed to load profile:', error);
    }
  }

  // Login (only needed in external browser, not in LINE app)
  login(): void {
    if (!this._isInitialized) return;

    if (!this._isLoggedIn) {
      liff.login();
    }
  }

  // Logout
  logout(): void {
    if (!this._isInitialized) return;

    if (this._isLoggedIn) {
      liff.logout();
      this._isLoggedIn = false;
      this._profile = null;
    }
  }

  // Share game result to LINE friends/groups
  async shareResult(timeSeconds: number, _cellsPerSide?: number): Promise<LineShareResult> {
    if (!this._isInitialized) {
      console.warn('[LINE] Share failed: not initialized');
      return { status: 'cancelled' };
    }

    // Check if shareTargetPicker is available
    const isShareAvailable = liff.isApiAvailable('shareTargetPicker');
    console.log('[LINE] shareTargetPicker available:', isShareAvailable);

    if (!isShareAvailable) {
      console.warn('[LINE] shareTargetPicker not available - check LIFF settings in LINE Developers Console');
      return { status: 'cancelled' };
    }

    // Simple text message (works more reliably than Flex)
    // Use translated share text based on user's language
    const shareText = `🍊 ${i18n.title} 🍊\n\n${i18n.formatShareText(timeSeconds.toFixed(1))}\n\n▶️ https://liff.line.me/${this.LIFF_ID}`;

    try {
      console.log('[LINE] Opening shareTargetPicker...');
      const result = await liff.shareTargetPicker([
        {
          type: 'text',
          text: shareText,
        },
      ]);

      if (result) {
        console.log('[LINE] Share success');
        return { status: 'success' };
      } else {
        console.log('[LINE] Share cancelled by user');
        return { status: 'cancelled' };
      }
    } catch (error) {
      console.error('[LINE] Share failed:', error);
      return { status: 'cancelled' };
    }
  }

  // Send message to current chat (only works when opened from chat)
  async sendMessage(timeSeconds: number): Promise<boolean> {
    if (!this._isInitialized || !this._isInClient) {
      return false;
    }

    try {
      await liff.sendMessages([
        {
          type: 'text',
          text: `I just peeled a mandarin in ${timeSeconds.toFixed(1)} seconds! Play here: https://liff.line.me/${this.LIFF_ID}`,
        },
      ]);
      return true;
    } catch (error) {
      console.error('[LINE] Send message failed:', error);
      return false;
    }
  }

  // Close the LIFF app
  closeWindow(): void {
    if (this._isInitialized && this._isInClient) {
      liff.closeWindow();
    }
  }

  // Get OS info
  getOS(): 'ios' | 'android' | 'web' {
    if (!this._isInitialized) return 'web';
    return liff.getOS() as 'ios' | 'android' | 'web';
  }

  // Get LINE version
  getLineVersion(): string | null {
    if (!this._isInitialized) return null;
    return liff.getLineVersion();
  }

  // Get language
  getLanguage(): string {
    if (!this._isInitialized) return 'en';
    return liff.getLanguage();
  }

  // Check if specific API is available
  isApiAvailable(api: string): boolean {
    if (!this._isInitialized) return false;
    return liff.isApiAvailable(api);
  }
}

// Singleton
export const line = new LineManager();

// Initialize LINE on module load - store promise for awaiting
export const lineInitPromise = line.init().catch(console.error);
