import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionsService } from './subscriptions.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Guard: bloquea el acceso si el usuario no tiene una suscripción activa.
export const subscriptionGuard: CanActivateFn = () => {
  const subs = inject(SubscriptionsService);
  const router = inject(Router);
  return subs.status().pipe(
    map(res => {
      if (res.active) return true;
      router.navigateByUrl('/plans');
      return false;
    }),
    catchError(() => {
      // Si hay error, asumimos que no está activa y redirigimos
      router.navigateByUrl('/plans');
      return of(false);
    })
  );
};
