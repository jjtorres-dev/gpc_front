import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adjunta la cookie httpOnly de sesión (access_token) a cada request.
 * El frontend nunca lee el JWT directamente, solo garantiza que viaje.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
