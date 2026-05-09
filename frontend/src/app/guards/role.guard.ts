import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Strategy pattern: the required roles are passed via route data,
 * making this guard reusable across any route with any role combination.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles: string[] = route.data['roles'] ?? [];
  if (allowedRoles.includes(currentUser.role)) {
    return true;
  }

  return router.createUrlTree(['/events']);
};
