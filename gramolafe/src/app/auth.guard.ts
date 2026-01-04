import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

// Guard de ruta: si no hay sesión en el frontend, redirige a /login.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn$.pipe(
    take(1),
    map(isLogged => {
      if (isLogged) return true;
      router.navigateByUrl('/login');
      return false;
    })
  );
};
