import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';
import { SpotifyService } from '../spotify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  pwd = '';
  loading = false;
  error = '';

  constructor(private userService: UserService, private auth: AuthService, private router: Router, private spotify: SpotifyService, private route: ActivatedRoute) {}

  login() {
    this.error = '';
    this.loading = true;
    this.userService.login(this.email, this.pwd).subscribe({
      next: async (res) => {
        this.auth.setLoggedIn(true);
        this.auth.setEmail(res?.email || this.email);
        this.loading = false;
        // Navegar siempre a la cola tras login.
        // La autenticación de Spotify se dispara al entrar en /queue.
        const nextUrl = this.route.snapshot.queryParamMap.get('next') || '/queue';
        this.router.navigateByUrl(nextUrl);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error ?? err?.message ?? 'Error desconocido';
        this.error = typeof msg === 'string' ? msg : (msg?.message || 'Credenciales inválidas');
      }
    });
  }
}
