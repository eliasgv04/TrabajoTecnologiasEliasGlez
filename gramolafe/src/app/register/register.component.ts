import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
/**
 * Pantalla de registro.
 *
 * Crea un usuario en el backend y muestra el aviso de verificación por email.
 */
export class RegisterComponent {
  email = '';
  pwd1 = '';
  pwd2 = '';
  barName = '';
  message = '';
  error = '';

  constructor(private service: UserService, private router: Router) {}

  registrar() {
    this.message = '';
    this.error = '';
    if (this.pwd1 !== this.pwd2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.service.register(this.email, this.pwd1, this.pwd2, this.barName).subscribe({
      next: (res) => {
        this.message = 'Registro correcto. Revisa tu correo y haz clic en el enlace de verificación.';
      },
      error: (err) => {
        const backendMsg = err?.error?.message || err?.error?.error;
        if (err?.status === 409) {
          this.error = backendMsg || 'Ese correo electrónico ya está registrado';
        } else {
          const msg = backendMsg || err?.message;
          this.error = msg ? `Error en el registro: ${msg}` : 'Error en el registro';
        }
        console.error('Error en el registro', err);
      }
    });
  }
}
