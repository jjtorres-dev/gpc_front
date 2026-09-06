import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { Ponente, PonentePayload } from '../models/ponente.model';
import { PonentesApiService, PonentesMeta } from '../data-access/ponentes-api.service';

const INITIAL_META: PonentesMeta = { total: 0, page: 1, perPage: 10 };

/**
 * Capa ViewModel: estado y reglas de interacción del catálogo de ponentes.
 * La lista vive en un signal; crear/editar la actualizan en sitio sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class PonentesService {
  private readonly api = inject(PonentesApiService);

  private readonly _ponentes = signal<Ponente[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formError = signal<string | null>(null);
  private readonly _meta = signal<PonentesMeta>(INITIAL_META);
  private readonly _searchTerm = signal('');

  readonly ponentes = this._ponentes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Error específico del formulario (422): se muestra dentro del diálogo. */
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
          this._ponentes.set(res.data);
          this._meta.set(res.meta);
        },
        error: () => this._error.set('No se pudieron cargar los ponentes.'),
      });
  }

  /**
   * Registra un ponente. Distingue el 422 (datos inválidos) y lo expone en
   * `formError` con el mensaje del backend tal cual; cualquier otro error va al
   * banner de sección.
   */
  crear(payload: PonentePayload): Observable<Ponente> {
    this._formError.set(null);

    return this.api.crear(payload).pipe(
      map((res) => res.ponente),
      tap((nuevo) => {
        this._ponentes.update((lista) => [nuevo, ...lista]);
        this._meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
      }),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'registrar')),
    );
  }

  editar(id: number, payload: PonentePayload): Observable<Ponente> {
    this._formError.set(null);

    return this.api.editar(id, payload).pipe(
      map((res) => res.ponente),
      tap((actualizado) =>
        this._ponentes.update((lista) => lista.map((p) => (p.id === id ? actualizado : p))),
      ),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'actualizar')),
    );
  }

  private handleWriteError(
    error: HttpErrorResponse,
    accion: 'registrar' | 'actualizar',
  ): Observable<never> {
    if (error.status === 422) {
      this._formError.set(this.mensajeBackend(error) ?? 'Revisa los datos del formulario.');
    } else if (error.status === 404) {
      this._formError.set('El ponente no existe o fue eliminado.');
    } else {
      this._error.set(`No se pudo ${accion} el ponente.`);
    }
    return throwError(() => error);
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
