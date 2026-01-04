import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, filter, take } from 'rxjs';

declare global {
  interface Window { onSpotifyWebPlaybackSDKReady?: () => void; Spotify?: any; }
}

/**
 * Servicio de Spotify en frontend: integra el Web Playback SDK y llama a endpoints del backend (/api/spotify/*).
 * Se encarga de cargar el SDK, crear el reproductor y obtener/usar el deviceId.
 */
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
      // Crear el reproductor web
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
    // Esperar a que el SDK devuelva un deviceId real (el BehaviorSubject empieza en null)
    return firstValueFrom(this.deviceId$.pipe(filter((v): v is string => !!v && v.length > 0), take(1)));
  }

  async connectOrLogin(returnUrl?: string) {
    const finalReturnUrl = returnUrl || `${window.location.origin}/queue`;

    // 1) Primero comprobamos si ya estamos autenticados con Spotify.
    // No dependemos del Web Playback SDK para decidir si redirigir.
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

    // 2) Si hay token, intentamos levantar el player/dispositivo.
    // Protegemos contra bloqueos de carga del SDK.
    try {
      const id = await this.withTimeout(this.ensurePlayer(), 7000);
      if (id) return id;
    } catch {
      // Hay token pero el player no está listo; se puede reintentar más tarde.
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

  /**
   * Para la reproducción actual (best-effort).
   *
   * Se usa al cerrar sesión/cambiar de cuenta para evitar que Spotify siga sonando.
   */
  async stopPlayback(): Promise<void> {
    const deviceId = this.deviceId$.value || undefined;

    // 1) Intento vía Web Playback SDK (si está cargado)
    try {
      if (this.player && typeof this.player.pause === 'function') {
        await this.player.pause();
      }
    } catch {
      // ignorar
    }

    // 2) Intento vía backend (Spotify Web API)
    try {
      await firstValueFrom(this.pause(deviceId));
    } catch {
      // ignorar
    }

    // 3) Desconectar el player para cortar audio y liberar recursos
    try {
      if (this.player && typeof this.player.disconnect === 'function') {
        this.player.disconnect();
      }
    } catch {
      // ignorar
    }

    this.player = null;
    this.deviceId$.next(null);
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
      // Si ya está disponible, resolvemos al instante
      if ('Spotify' in window) {
        resolve();
        return;
      }

      // Si ya se está inyectando, esperamos al callback de "ready" (con timeout)
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
