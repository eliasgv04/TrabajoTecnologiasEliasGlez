import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccountInfo {
  email: string;
  active: boolean;
  activeUntil: string | null;
}

/**
 * Servicio HTTP de cuenta: devuelve datos del usuario autenticado (/api/account).
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private baseUrl = '/api/account';
  constructor(private http: HttpClient) {}

  me(): Observable<AccountInfo> {
    return this.http.get<AccountInfo>(`${this.baseUrl}`);
  }
}
