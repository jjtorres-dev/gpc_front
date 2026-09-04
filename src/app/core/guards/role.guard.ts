import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Restringe una ruta a los roles listados en route.data['roles'].
 * Debe usarse siempre después de authGuard (asume que ya hay usuario).
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [];
  const user = authService.currentUser();

  if (user && allowedRoles.includes(user.rol)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
