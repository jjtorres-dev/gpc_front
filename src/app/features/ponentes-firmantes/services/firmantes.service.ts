import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { Firmante, UsuarioDisponible } from '../models/firmante.model';
import { FirmantesApiService, FirmantesMeta } from '../data-access/firmantes-api.service';

const INITIAL_META: FirmantesMeta = { total: 0, page: 1, perPage: 10 };

/**
 * Capa ViewModel: estado y reglas de interacción del registro de firmantes.
 * La lista vive en un signal; crear/eliminar la actualizan en sitio.
 */
@Injectable({ providedIn: 'root' })
export class FirmantesService {
  private readonly api = inject(FirmantesApiService);

  private readonly _firmantes = signal<Firmante[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formError = signal<string | null>(null);
  private readonly _meta = signal<FirmantesMeta>(INITIAL_META);

  private readonly _disponibles = signal<UsuarioDisponible[]>([]);
  private readonly _disponiblesLoading = signal(false);

  readonly firmantes = this._firmantes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Error específico del formulario (409 / 422): se muestra dentro del diálogo. */
  readonly formError = this._formError.asReadonly();
  readonly meta = this._meta.asReadonly();

  /** Usuarios elegibles para el <mat-select> del formulario de registro. */
  readonly disponibles = this._disponibles.asReadonly();
  readonly disponiblesLoading = this._disponiblesLoading.asReadonly();

  limpiarFormError(): void {
    this._formError.set(null);
  }

  cargar(page = 1): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .listar(page)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._firmantes.set(res.data);
          this._meta.set(res.meta);
        },
        error: () => this._error.set('No se pudieron cargar los firmantes.'),
      });
  }

  /** Carga el catálogo de usuarios disponibles (se llama al abrir el diálogo). */
  cargarDisponibles(): void {
    this._disponiblesLoading.set(true);

    this.api
      .listarDisponibles()
      .pipe(finalize(() => this._disponiblesLoading.set(false)))
      .subscribe({
        next: (usuarios) => this._disponibles.set(usuarios),
        error: () => this._disponibles.set([]),
      });
  }

  /**
   * Registra un firmante a partir de un FormData (idUsuario, cargo, archivoPfx,
   * passphrase). Distingue el 409 ("el usuario ya tiene firmante") del 422
   * ("pfx/passphrase inválidos"): en ambos casos muestra el mensaje del backend
   * tal cual en `formError`, con un fallback específico por código.
   */
  crear(formData: FormData): Observable<Firmante> {
    this._formError.set(null);

    return this.api.crear(formData).pipe(
      map((res) => res.firmante),
      tap((nuevo) => {
        this._firmantes.update((lista) => [nuevo, ...lista]);
        this._meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          this._formError.set(
            this.mensajeBackend(error) ?? 'Este usuario ya tiene un firmante registrado.',
          );
        } else if (error.status === 422) {
          this._formError.set(
            this.mensajeBackend(error) ?? 'El archivo .pfx o la contraseña no son válidos.',
          );
        } else {
          this._error.set('No se pudo registrar el firmante.');
        }
        return throwError(() => error);
      }),
    );
  }

  eliminar(id: number): Observable<void> {
    this._error.set(null);

    return this.api.eliminar(id).pipe(
      map(() => undefined),
      tap(() => {
        this._firmantes.update((lista) => lista.filter((f) => f.id !== id));
        this._meta.update((meta) => ({ ...meta, total: Math.max(0, meta.total - 1) }));
      }),
      catchError((error: HttpErrorResponse) => {
        this._error.set(
          error.status === 403
            ? 'Solo un Administrador puede eliminar un firmante.'
            : 'No se pudo eliminar el firmante.',
        );
        return throwError(() => error);
      }),
    );
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
