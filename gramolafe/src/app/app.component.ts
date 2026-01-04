import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { SpotifyService } from './spotify.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
/**
 * Componente raíz de la aplicación.
 *
 * - Aloja el `router-outlet` y la navegación.
 * - Gestiona el cierre de sesión y el comportamiento del "brand".
 */
export class AppComponent {
  title = 'gramolafe';
  year = new Date().getFullYear();
  isLoggedIn$: Observable<boolean>;

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private spotify: SpotifyService,
    public router: Router
  ) {
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  async onLogout() {
    // Parar reproducción (Spotify + estado local) antes de cambiar de cuenta.
    const email = (() => {
      try { return (localStorage.getItem('email') || '').trim().toLowerCase(); } catch { return ''; }
    })();
    try { await this.spotify.stopPlayback(); } catch {}
    try {
      if (email) localStorage.removeItem(`gramola:${email}:player`);
      // compatibilidad con claves antiguas
      localStorage.removeItem('gramolaPlayer');
    } catch {}

    this.userService.logout().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigateByUrl('/home');
      },
      error: () => {
        // Aunque el servidor falle, limpiamos la sesión del cliente
        this.auth.logout();
        this.router.navigateByUrl('/home');
      }
    });
  }

  onBrandClick(evt: MouseEvent) {
    // Si hay sesión, clicar en el brand hace logout; si no, dejamos que el routerLink navegue a /home
    const sub = this.isLoggedIn$.subscribe(is => {
      if (is) {
        evt.preventDefault();
        this.onLogout();
      }
    });
    // Aseguramos que la suscripción sea de vida corta
    setTimeout(() => sub.unsubscribe(), 0);
  }
}
