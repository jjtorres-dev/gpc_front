import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';

import { AuthApiService } from '../data-access/auth-api.service';
import { Usuario } from '../models/usuario.model';

/**
 * Capa ViewModel: lógica de negocio de autenticación.
 * Mantiene el estado de sesión en signals y traduce los códigos de error
 * del backend a mensajes que la View puede mostrar directamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<Usuario | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  /**
   * Consulta la sesión activa contra el backend (cookie httpOnly).
   * Nunca lanza error: resuelve a false y limpia el estado si no hay sesión,
   * para poder usarse de forma segura en el APP_INITIALIZER y en los guards.
   */
  checkSession(): Observable<boolean> {
    return this.api.me().pipe(
      tap((res) => this._currentUser.set(res.user)),
      map(() => true),
      catchError(() => {
        this._currentUser.set(null);
        return of(false);
      }),
    );
  }

  login(email: string, password: string): Observable<Usuario> {
    return this.api.login({ email, password }).pipe(
      tap((res) => this._currentUser.set(res.user)),
      map((res) => res.user),
      catchError((error: HttpErrorResponse) => throwError(() => new Error(this.mapLoginError(error)))),
    );
  }

  logout(): void {
    this.api
      .logout()
      .pipe(
        finalize(() => {
          this._currentUser.set(null);
          this.router.navigateByUrl('/login');
        }),
      )
      .subscribe({ error: () => undefined });
  }

  forgotPassword(email: string): Observable<void> {
    return this.api.forgotPassword({ email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.api.resetPassword({ token, password });
  }

  /** Limpia el estado local sin llamar al backend (usado por el interceptor de 401). */
  clearSession(): void {
    this._currentUser.set(null);
  }

  private mapLoginError(error: HttpErrorResponse): string {
    if (error.status === 423 || error.error?.error === 'account_locked') {
      return 'Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador para desbloquearla.';
    }
    if (error.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
    return 'Ocurrió un error al iniciar sesión. Intenta nuevamente.';
  }
}
