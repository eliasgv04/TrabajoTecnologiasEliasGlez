import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio HTTP de "economía": saldo, precio por canción y estimación de coste por pista.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private baseUrl = '/api/billing';
  constructor(private http: HttpClient) {}
  getPrice(): Observable<{ pricePerSong: number }> { return this.http.get<{ pricePerSong: number }>(`${this.baseUrl}/price`); }
  getBalance(): Observable<{ coins: number }> { return this.http.get<{ coins: number }>(`${this.baseUrl}/balance`); }
  recharge(amount: number): Observable<{ coins: number }> { return this.http.post<{ coins: number }>(`${this.baseUrl}/recharge`, { amount }); }
  estimate(trackId: string): Observable<{ trackId: string; price: number; popularity: number }> { return this.http.get<{ trackId: string; price: number; popularity: number }>(`${this.baseUrl}/estimate`, { params: { trackId } }); }
}
