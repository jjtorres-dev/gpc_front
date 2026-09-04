import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';

/**
 * Redirige a un usuario autenticado al primer destino de su menú.
 * Debe usarse siempre después de authGuard (asume que ya hay sesión).
 */
export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const menuService = inject(MenuService);
  const router = inject(Router);

  const user = authService.currentUser();
  const homeRoute = user ? menuService.getMenuForRole(user.rol)[0]?.route : undefined;

  return router.parseUrl(homeRoute ?? '/acceso-denegado');
};
