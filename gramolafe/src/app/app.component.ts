import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gramolafe';
  year = new Date().getFullYear();
  isLoggedIn$: Observable<boolean>;

  constructor(private userService: UserService, private auth: AuthService, public router: Router) {
    this.isLoggedIn$ = this.auth.isLoggedIn$;
  }

  onLogout() {
    this.userService.logout().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigateByUrl('/home');
      },
      error: () => {
        // Even if the server fails, clear client session
        this.auth.logout();
        this.router.navigateByUrl('/home');
      }
    });
  }
}
