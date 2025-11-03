import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

// Landing guard: if logged in go to /queue, otherwise go to /home
export const entryGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn$.pipe(
    take(1),
    // Use parseUrl with absolute path or createUrlTree with path segments (without leading slash)
    map(is => router.parseUrl(is ? '/queue' : '/home'))
  );
};
