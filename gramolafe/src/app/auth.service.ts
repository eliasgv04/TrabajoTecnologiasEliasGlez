import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(this.readPersisted());

  isLoggedIn$ = this.loggedIn$.asObservable();

  private readPersisted(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }

  setLoggedIn(value: boolean) {
    this.loggedIn$.next(value);
    localStorage.setItem('loggedIn', value ? 'true' : 'false');
  }

  logout() {
    this.setLoggedIn(false);
  }
}
