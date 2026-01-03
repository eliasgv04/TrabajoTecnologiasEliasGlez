import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = '/api/users';

  constructor(private http: HttpClient) {}

  register(email: string, pwd1: string, pwd2: string, barName?: string): Observable<any> {
    const info: any = { email, pwd1, pwd2 };
    if (barName && barName.trim().length) info.barName = barName.trim();
    return this.http.post<any>(`${this.baseUrl}/register`, info);
  }

  login(email: string, pwd: string): Observable<{ message: string; email: string }> {
    const info = { email, pwd };
    return this.http.put<{ message: string; email: string }>(`${this.baseUrl}/login`, info);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {});
  }

  verify(token: string): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/verify`, { params: { token } });
  }

  forgot(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset/request`, { email });
  }

  reset(token: string, pwd1: string, pwd2: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reset/confirm`, { token, pwd1, pwd2 });
  }
}
