import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private baseUrl = '/api/payments';
  constructor(private http: HttpClient) {}

  getPublicKey(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.baseUrl}/public-key`);
  }

  prepay(matches: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/prepay`, { params: { matches }, responseType: 'text' });
  }

  confirm(): Observable<{ message: string; coins: number }> {
    return this.http.get<{ message: string; coins: number }>(`${this.baseUrl}/confirm`);
  }
}
