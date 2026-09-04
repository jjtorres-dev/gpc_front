import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Endpoints donde un 401 es una respuesta esperada del propio flujo de auth
 * (login inválido, verificación de sesión sin cookie) y no debe forzar una
 * redirección global: cada uno ya maneja su propio 401 en AuthService.
 */
const SELF_HANDLED_401_PATHS = ['/auth/login', '/auth/me'];

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const isSelfHandled = SELF_HANDLED_401_PATHS.some((path) => req.url.includes(path));
        if (!isSelfHandled) {
          authService.clearSession();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
