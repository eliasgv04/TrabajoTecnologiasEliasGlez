import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
/**
 * Pantalla de restablecimiento de contraseña.
 *
 * Lee el token desde query params y envía la nueva contraseña al backend.
 */
export class ResetComponent {
  token = '';
  pwd1 = '';
  pwd2 = '';
  message = '';
  error = '';
  loading = false;

  constructor(private service: UserService, private router: Router, private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      this.token = (params.get('token') || '').trim();
      if (!this.token) {
        this.error = 'Token no encontrado. Abre esta página desde el enlace del correo de restablecimiento.';
      }
    });
  }

  submit() {
    this.message = '';
    this.error = '';
    if (!this.token) {
      this.error = 'Falta el token. Usa el enlace recibido por correo.';
      return;
    }
    if (this.pwd1 !== this.pwd2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.loading = true;
    this.service.reset(this.token, this.pwd1, this.pwd2).subscribe({
      next: () => {
        this.message = 'Contraseña actualizada. Ahora puedes iniciar sesión';
        this.loading = false;
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err) => {
            const m = err?.error?.message || err?.error?.error || err?.message || 'Error al restablecer';
        this.error = m;
        this.loading = false;
      }
    });
  }
}
