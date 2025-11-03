import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(this.readPersisted());
  private email$ = new BehaviorSubject<string | null>(localStorage.getItem('email'));

  isLoggedIn$ = this.loggedIn$.asObservable();
  emailObservable$ = this.email$.asObservable();

  private readPersisted(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }

  setLoggedIn(value: boolean) {
    this.loggedIn$.next(value);
    localStorage.setItem('loggedIn', value ? 'true' : 'false');
  }

  setEmail(email: string | null) {
    this.email$.next(email);
    if (email) localStorage.setItem('email', email); else localStorage.removeItem('email');
  }

  logout() {
    this.setLoggedIn(false);
    this.setEmail(null);
  }
}
