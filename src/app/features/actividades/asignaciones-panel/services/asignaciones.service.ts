import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, tap, throwError } from 'rxjs';

import { ActividadFirmante, ActividadPonente } from '../models/asignacion.model';
import { AsignacionesApiService } from '../data-access/asignaciones-api.service';

/**
 * Capa ViewModel: estado y reglas de las asignaciones (ponentes + firmante) de
 * una actividad. Las mutaciones actualizan los signals en sitio, sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionesService {
  private readonly api = inject(AsignacionesApiService);

  private readonly _ponentesAsignados = signal<ActividadPonente[]>([]);
  private readonly _firmanteAsignado = signal<ActividadFirmante | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly ponentesAsignados = this._ponentesAsignados.asReadonly();
  readonly firmanteAsignado = this._firmanteAsignado.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  limpiarError(): void {
    this._error.set(null);
  }

  /** Trae ponentes y firmante en paralelo. */
  cargar(actividadId: number): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      ponentes: this.api.listarPonentes(actividadId),
      firmante: this.api.obtenerFirmante(actividadId),
    })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: ({ ponentes, firmante }) => {
          this._ponentesAsignados.set(ponentes);
          this._firmanteAsignado.set(firmante.firmante);
        },
        error: () => this._error.set('No se pudieron cargar las asignaciones.'),
      });
  }

  /**
   * Asigna un ponente del catálogo. El 409 (ya asignado) se traduce con un
   * mensaje propio; el 422 usa el mensaje del backend si viene.
   */
  agregarPonente(actividadId: number, idPonente: number): Observable<ActividadPonente> {
    this._error.set(null);

    return this.api.agregarPonente(actividadId, idPonente).pipe(
      tap((asignado) => this._ponentesAsignados.update((lista) => [...lista, asignado])),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          this._error.set('Este ponente ya está asignado a la actividad.');
        } else if (error.status === 422) {
          this._error.set(this.mensajeBackend(error) ?? 'No se pudo asignar el ponente.');
        } else {
          this._error.set('No se pudo asignar el ponente.');
        }
        return throwError(() => error);
      }),
    );
  }

  quitarPonente(actividadId: number, id: number): Observable<void> {
    this._error.set(null);

    return this.api.quitarPonente(actividadId, id).pipe(
      map(() => undefined),
      tap(() =>
        this._ponentesAsignados.update((lista) => lista.filter((p) => p.id !== id)),
      ),
      catchError((error: HttpErrorResponse) => {
        this._error.set('No se pudo quitar el ponente.');
        return throwError(() => error);
      }),
    );
  }

  /**
   * Asigna la firma de la actividad. El 409 se muestra con el mensaje completo
   * del backend tal cual: es informativo (explica que una actividad no soporta
   * firmas múltiples y hay que quitar la actual primero).
   */
  asignarFirmante(actividadId: number, idFirma: number): Observable<ActividadFirmante> {
    this._error.set(null);

    return this.api.asignarFirmante(actividadId, idFirma).pipe(
      map((res) => res.firmante),
      tap((firmante) => this._firmanteAsignado.set(firmante)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          this._error.set(
            this.mensajeBackend(error) ??
              'Esta actividad ya tiene un firmante y no soporta firmas múltiples. Quita el actual antes de asignar otro.',
          );
        } else {
          this._error.set('No se pudo asignar el firmante.');
        }
        return throwError(() => error);
      }),
    );
  }

  quitarFirmante(actividadId: number): Observable<void> {
    this._error.set(null);

    return this.api.quitarFirmante(actividadId).pipe(
      map(() => undefined),
      tap(() => this._firmanteAsignado.set(null)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // Ya no había firmante: el estado deseado igual se cumple.
          this._firmanteAsignado.set(null);
          return throwError(() => error);
        }
        this._error.set('No se pudo quitar el firmante.');
        return throwError(() => error);
      }),
    );
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
