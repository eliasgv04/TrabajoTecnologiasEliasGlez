import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
/**
 * Pantalla de inicio (landing).
 *
 * Ajusta la UI según el estado de autenticación.
 */
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
