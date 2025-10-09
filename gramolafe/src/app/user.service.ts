import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:8080/users';

  constructor(private http: HttpClient) {}

  register(email: string, pwd1: string, pwd2: string): Observable<any> {
    const info = { email, pwd1, pwd2 };
    return this.http.post<any>(`${this.baseUrl}/register`, info);
  }

  login(email: string, pwd: string): Observable<void> {
    const info = { email, pwd };
    return this.http.put<void>(`${this.baseUrl}/login`, info);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {});
  }

  verify(token: string): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/verify`, { params: { token } });
  }

  forgot(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/forgot`, { email });
  }

  reset(token: string, pwd1: string, pwd2: string): Observable<void> {
    // Simplified reset by email (no token)
    return this.http.post<void>(`${this.baseUrl}/reset`, { email: token, pwd1, pwd2 });
  }
}
