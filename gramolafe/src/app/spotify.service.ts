import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, filter, take } from 'rxjs';

declare global {
  interface Window { onSpotifyWebPlaybackSDKReady?: () => void; Spotify?: any; }
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private baseUrl = '/api';
  private deviceId$ = new BehaviorSubject<string | null>(null);
  private player: any;

  constructor(private http: HttpClient) {}

  get deviceId(): Observable<string | null> { return this.deviceId$.asObservable(); }

  async ensurePlayer(): Promise<string | null> {
    if (!('Spotify' in window)) {
      await this.injectSdk();
    }
    if (!this.player) {
      const token = await this.getToken();
      if (!token) return null;
      // Create player
      this.player = new window.Spotify.Player({
        name: 'Gramola Player',
        getOAuthToken: (cb: any) => this.getToken().then(t => t && cb(t)),
        volume: 0.8
      });
      this.player.addListener('ready', (e: any) => this.deviceId$.next(e.device_id));
      this.player.addListener('not_ready', (_: any) => this.deviceId$.next(null));
      this.player.addListener('initialization_error', ({ message }: any) => console.error(message));
      this.player.addListener('authentication_error', ({ message }: any) => console.error(message));
      this.player.addListener('account_error', ({ message }: any) => console.error(message));
      await this.player.connect();
    }
    // Wait until the SDK reports a real device id (BehaviorSubject starts as null)
    return firstValueFrom(this.deviceId$.pipe(filter((v): v is string => !!v && v.length > 0), take(1)));
  }

  async connectOrLogin(returnUrl?: string) {
    const finalReturnUrl = returnUrl || `${window.location.origin}/queue`;

    // 1) First check if we are authenticated with Spotify.
    // Do NOT depend on the Web Playback SDK to decide whether to redirect.
    try {
      const token = await this.getToken();
      if (!token) {
        window.location.href = `${this.baseUrl}/spotify/login?returnUrl=${encodeURIComponent(finalReturnUrl)}`;
        return null;
      }
    } catch {
      window.location.href = `${this.baseUrl}/spotify/login?returnUrl=${encodeURIComponent(finalReturnUrl)}`;
      return null;
    }

    // 2) We have a token: now try to bring up the player/device.
    // Guard against SDK load hanging forever.
    try {
      const id = await this.withTimeout(this.ensurePlayer(), 7000);
      if (id) return id;
    } catch {
      // Token exists but player not ready; caller can retry later.
    }
    return null;
  }

  playUris(uris: string[], deviceId?: string) {
    return this.http.post(`${this.baseUrl}/spotify/play`, { uris, deviceId });
  }
  resume(deviceId?: string) {
    return this.http.post(`${this.baseUrl}/spotify/play`, { deviceId });
  }

  seek(positionMs: number, deviceId?: string) {
    return this.http.put(`${this.baseUrl}/spotify/seek`, { positionMs, deviceId });
  }
  
  pause(deviceId?: string) {
    return this.http.put(`${this.baseUrl}/spotify/pause`, { deviceId });
  }
  transfer(deviceId: string, play = true) {
    return this.http.put(`${this.baseUrl}/spotify/transfer`, { deviceId, play });
  }

  private async getToken(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.http.get<{ accessToken: string }>(`${this.baseUrl}/spotify/token`).subscribe({
        next: (r) => resolve(r.accessToken),
        error: (e) => reject(e)
      });
    });
  }

  private injectSdk(timeoutMs = 7000): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already available, resolve immediately
      if ('Spotify' in window) {
        resolve();
        return;
      }

      // If already injecting, just wait for the ready callback (with timeout)
      const existing = document.getElementById('spotify-player-sdk');
      const timer = setTimeout(() => reject(new Error('Spotify SDK load timeout')), timeoutMs);
      window.onSpotifyWebPlaybackSDKReady = () => {
        clearTimeout(timer);
        resolve();
      };
      if (existing) return;

      const script = document.createElement('script');
      script.id = 'spotify-player-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Spotify SDK load error'));
      };
      document.body.appendChild(script);
    });
  }

  private withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      p.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }
}
