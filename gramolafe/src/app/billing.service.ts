import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private baseUrl = 'http://localhost:8000/billing';
  constructor(private http: HttpClient) {}
  getPrice(): Observable<{ pricePerSong: number }> { return this.http.get<{ pricePerSong: number }>(`${this.baseUrl}/price`); }
  getBalance(): Observable<{ coins: number }> { return this.http.get<{ coins: number }>(`${this.baseUrl}/balance`); }
  recharge(amount: number): Observable<{ coins: number }> { return this.http.post<{ coins: number }>(`${this.baseUrl}/recharge`, { amount }); }
}
