import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SubscriptionsService } from './subscriptions.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Blocks access if the user does not have an active subscription.
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
      // On error assume not active and redirect
      router.navigateByUrl('/plans');
      return of(false);
    })
  );
};
