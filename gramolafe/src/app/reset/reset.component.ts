import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {
  email = '';
  pwd1 = '';
  pwd2 = '';
  message = '';
  error = '';
  loading = false;

  constructor(private service: UserService, private router: Router) {}

  submit() {
    this.message = '';
    this.error = '';
    if (!this.email) {
      this.error = 'El correo es obligatorio';
      return;
    }
    if (this.pwd1 !== this.pwd2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    this.service.reset(this.email, this.pwd1, this.pwd2).subscribe({
      next: () => {
        this.message = 'Contraseña actualizada. Ahora puedes iniciar sesión';
        this.loading = false;
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err) => {
        const m = err?.error?.message || err?.message || 'Error al restablecer';
        this.error = m;
        this.loading = false;
      }
    });
  }
}
