import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const token = authService.getToken()!;
    if (authService.isTokenExpired(token)) {
      authService.logout();
      return router.createUrlTree(['/login']);
    }
    return true;
  }

  return router.createUrlTree(['/login']);
};