import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { AuthService } from './core/services/auth.service';

/**
 * Verifica la sesión (cookie httpOnly) antes de que la app renderice, para
 * que un F5 no muestre momentáneamente la app como "sin sesión" mientras
 * se resuelve GET /auth/me. checkSession() nunca lanza error.
 */
function initializeAuth(authService: AuthService) {
  return () => firstValueFrom(authService.checkSession());
}

// Locale único para toda la app: pipes de fecha/número y el mat-datepicker
// muestran/aceptan fechas en formato peruano (DD/MM/AAAA).
registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([credentialsInterceptor, authErrorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-PE' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
