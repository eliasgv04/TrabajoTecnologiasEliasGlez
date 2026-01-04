import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TrackDTO {
  id: string;
  title: string;
  artists: string[];
  album: string;
  imageUrl?: string;
  durationMs?: number;
  previewUrl?: string;
  uri?: string;
}

export interface QueueItem {
  id: number;
  trackId: string;
  title: string;
  artists: string;
  album: string;
  imageUrl?: string;
  durationMs?: number;
  uri?: string;
  chargedPrice?: number;
  popularity?: number;
  createdAt: string;
}

/**
 * Servicio HTTP de música y cola: encapsula llamadas a /api/music/* y /api/queue/*.
 */
@Injectable({ providedIn: 'root' })
export class MusicService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  search(q: string): Observable<TrackDTO[]> {
    return this.http.get<TrackDTO[]>(`${this.baseUrl}/music/search`, { params: { q } });
  }

  getTrackById(id: string): Observable<TrackDTO> {
    return this.http.get<TrackDTO>(`${this.baseUrl}/music/tracks/${id}`);
  }

  getPlaylist(uri: string): Observable<TrackDTO[]> {
    return this.http.get<TrackDTO[]>(`${this.baseUrl}/music/playlist`, { params: { uri } });
  }

  getQueue(): Observable<QueueItem[]> {
    return this.http.get<QueueItem[]>(`${this.baseUrl}/queue`);
  }

  addToQueue(track: TrackDTO): Observable<QueueItem> {
    return this.http.post<QueueItem>(`${this.baseUrl}/queue`, track);
  }

  clearQueue(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/queue/clear`);
  }

  deleteFromQueue(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/queue/${id}`);
  }
}
