import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Servicio HTTP de pagos de canciones: prepay/confirm y obtención de publishableKey.
 */
@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private baseUrl = '/api/payments';
  constructor(private http: HttpClient) {}

  getPublicKey(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.baseUrl}/public-key`);
  }

  prepay(trackId: string, amountEur: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/prepay`, { params: { trackId, amountEur }, responseType: 'text' });
  }

  confirm(): Observable<{ message: string; trackId: string; amountEur: number }> {
    return this.http.get<{ message: string; trackId: string; amountEur: number }>(`${this.baseUrl}/confirm`);
  }
}
