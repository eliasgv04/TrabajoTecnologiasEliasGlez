import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

declare global {
  interface Window { onSpotifyWebPlaybackSDKReady?: () => void; Spotify?: any; }
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private baseUrl = 'http://localhost:8000';
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
    return firstValueFrom(this.deviceId$);
  }

  async connectOrLogin(returnUrl: string = 'http://localhost:4200/queue') {
    const id = await this.ensurePlayer();
    if (id) return id;
    // Try to fetch token: if 401, redirect to login
    try {
      await this.getToken();
    } catch {
      window.location.href = `${this.baseUrl}/spotify/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    return null;
  }

  playUris(uris: string[], deviceId?: string) {
    return this.http.post(`${this.baseUrl}/spotify/play${deviceId ? '' : ''}`, { uris, deviceId });
  }
  pause(deviceId?: string) {
    return this.http.put(`${this.baseUrl}/spotify/pause${deviceId ? '' : ''}`, { deviceId });
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

  private injectSdk(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
    });
  }
}
