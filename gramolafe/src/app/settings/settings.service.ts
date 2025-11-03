import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AppSettings {
  pricePerSong: number;
  spotifyPlaylistUri?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private baseUrl = '/api/settings';
  constructor(private http: HttpClient) {}

  get(): Observable<AppSettings> {
    return this.http.get<AppSettings>(this.baseUrl);
  }

  update(body: Partial<AppSettings>): Observable<AppSettings> {
    return this.http.put<AppSettings>(this.baseUrl, body);
  }
}
