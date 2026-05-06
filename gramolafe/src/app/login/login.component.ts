import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
/**
 * Pantalla de inicio de sesión.
 *
 * Autentica contra el backend y envía primero a la contratación del servicio
 * si el bar todavía no tiene una suscripción activa.
 */
export class LoginComponent {
  identifier = '';
  pwd = '';
  loading = false;
  error = '';

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
    private subs: SubscriptionsService,
    private route: ActivatedRoute
  ) {}

  login() {
    this.error = '';
    this.loading = true;
    this.userService.login(this.identifier, this.pwd).subscribe({
      next: async (res) => {
        this.auth.setLoggedIn(true);
        this.auth.setEmail(res?.email || this.identifier);
        this.loading = false;
        const nextUrl = this.route.snapshot.queryParamMap.get('next') || '';
        if (nextUrl && nextUrl.startsWith('/')) {
          this.router.navigateByUrl(nextUrl);
          return;
        }
        this.subs.status().subscribe({
          next: s => this.router.navigateByUrl(s.active ? '/queue' : '/plans'),
          error: () => this.router.navigateByUrl('/plans')
        });
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error ?? err?.message ?? 'Error desconocido';
        this.error = typeof msg === 'string' ? msg : (msg?.message || 'Credenciales inválidas');
      }
    });
  }
}
