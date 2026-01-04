import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

// Guard de entrada: si hay sesión → /queue, si no → /home.
export const entryGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn$.pipe(
    take(1),
    // Usamos parseUrl con ruta absoluta para devolver un UrlTree.
    map(is => router.parseUrl(is ? '/queue' : '/home'))
  );
};
