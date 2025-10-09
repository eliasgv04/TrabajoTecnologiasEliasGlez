import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../user.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent {
  email = '';
  message = '';
  error = '';

  constructor(private service: UserService) {}

  submit() {
    this.message = '';
    this.error = '';
    this.service.forgot(this.email).subscribe({
      next: () => this.message = 'Si el correo existe, recibirás un enlace para restablecer la contraseña (simulado).',
      error: () => this.message = 'Si el correo existe, recibirás un enlace para restablecer la contraseña (simulado).'
    });
  }
}
