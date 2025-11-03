import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan { id: number; code: string; name: string; priceEur: number; durationMonths: number; }

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private baseUrl = '/api/subscriptions';
  private paymentsBase = '/api/payments';
  constructor(private http: HttpClient) {}

  plans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/plans`);
  }

  status(): Observable<{ active: boolean; activeUntil: string | null }> {
    return this.http.get<{ active: boolean; activeUntil: string | null }>(`${this.baseUrl}/status`);
  }

  prepay(planId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/prepay`, { params: { planId }, responseType: 'text' });
  }

  confirm(): Observable<{ message: string; activeUntil: string }> {
    return this.http.get<{ message: string; activeUntil: string }>(`${this.baseUrl}/confirm`);
  }

  publicKey(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.paymentsBase}/public-key`);
  }
}
