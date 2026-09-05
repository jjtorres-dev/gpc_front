import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { Reconocimiento, ReconocimientoPayload } from '../models/reconocimiento.model';
import {
  ReconocimientosApiService,
  ReconocimientosMeta,
} from '../data-access/reconocimientos-api.service';

const INITIAL_META: ReconocimientosMeta = { total: 0, page: 1, perPage: 10 };

/**
 * Capa ViewModel: estado y reglas de interacción del módulo de reconocimientos.
 * La lista vive en un signal; crear/editar la actualizan en sitio sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class ReconocimientosService {
  private readonly api = inject(ReconocimientosApiService);

  private readonly _reconocimientos = signal<Reconocimiento[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formError = signal<string | null>(null);
  private readonly _meta = signal<ReconocimientosMeta>(INITIAL_META);
  private readonly _searchTerm = signal('');

  readonly reconocimientos = this._reconocimientos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Error específico del formulario (422): se muestra junto al form, no como banner. */
  readonly formError = this._formError.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  limpiarFormError(): void {
    this._formError.set(null);
  }

  cargar(search = '', page = 1): void {
    this._loading.set(true);
    this._error.set(null);
    this._searchTerm.set(search);

    this.api
      .listar(search, page)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._reconocimientos.set(res.data);
          this._meta.set(res.meta);
        },
        error: () => this._error.set('No se pudieron cargar los reconocimientos.'),
      });
  }

  obtener(id: number): Observable<Reconocimiento> {
    this._loading.set(true);
    this._error.set(null);

    return this.api.obtener(id).pipe(
      map((res) => res.reconocimiento),
      catchError((error: HttpErrorResponse) => {
        this._error.set(
          error.status === 404
            ? 'El reconocimiento no existe o fue eliminado.'
            : 'No se pudo cargar el reconocimiento.',
        );
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  /**
   * Registra un reconocimiento. Distingue el 422 (persona nueva sin nombre) y lo
   * expone en `formError` con el mensaje del backend tal cual; cualquier otro
   * error va al banner de sección.
   */
  crear(payload: ReconocimientoPayload): Observable<Reconocimiento> {
    this._formError.set(null);
    this._loading.set(true);

    return this.api.crear(payload).pipe(
      map((res) => res.reconocimiento),
      tap((nuevo) => {
        this._reconocimientos.update((lista) => [nuevo, ...lista]);
        this._meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
      }),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'registrar')),
      finalize(() => this._loading.set(false)),
    );
  }

  editar(id: number, payload: ReconocimientoPayload): Observable<Reconocimiento> {
    this._formError.set(null);
    this._loading.set(true);

    return this.api.editar(id, payload).pipe(
      map((res) => res.reconocimiento),
      tap((actualizado) =>
        this._reconocimientos.update((lista) =>
          lista.map((r) => (r.id === id ? actualizado : r)),
        ),
      ),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'actualizar')),
      finalize(() => this._loading.set(false)),
    );
  }

  private handleWriteError(
    error: HttpErrorResponse,
    accion: 'registrar' | 'actualizar',
  ): Observable<never> {
    if (error.status === 422) {
      this._formError.set(this.mensajeBackend(error) ?? 'Revisa los datos del formulario.');
    } else {
      this._error.set(`No se pudo ${accion} el reconocimiento.`);
    }
    return throwError(() => error);
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
