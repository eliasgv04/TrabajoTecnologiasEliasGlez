import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { AuthService } from '../auth.service';

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

  constructor(private userService: UserService, private auth: AuthService, private router: Router) {}

  login() {
    this.error = '';
    this.loading = true;
    this.userService.login(this.email, this.pwd).subscribe({
      next: () => {
        this.auth.setLoggedIn(true);
        this.loading = false;
        this.router.navigateByUrl('/queue');
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error ?? err?.message ?? 'Error desconocido';
        this.error = typeof msg === 'string' ? msg : (msg?.message || 'Credenciales inválidas');
      }
    });
  }
}
