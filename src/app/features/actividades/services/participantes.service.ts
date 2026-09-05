import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { Participacion, ParticipacionPayload } from '../models/participacion.model';
import {
  ParticipantesApiService,
  ParticipantesMeta,
} from '../data-access/participantes-api.service';

const INITIAL_META: ParticipantesMeta = { total: 0, page: 1, perPage: 10 };

/**
 * Capa ViewModel: estado y reglas de interacción de la gestión de participantes
 * de una actividad. La lista se mantiene en un signal y las mutaciones
 * (agregar / quitar / asistencia) la actualizan en sitio, sin recargar todo.
 */
@Injectable({ providedIn: 'root' })
export class ParticipantesService {
  private readonly api = inject(ParticipantesApiService);

  private readonly _participantes = signal<Participacion[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formError = signal<string | null>(null);
  private readonly _meta = signal<ParticipantesMeta>(INITIAL_META);

  /** Lista de participaciones de la actividad actualmente cargada. */
  readonly participantes = this._participantes.asReadonly();
  /** Carga/errores de nivel de sección (banner). */
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Error específico del formulario de alta (409 / 422): se muestra junto al form. */
  readonly formError = this._formError.asReadonly();
  readonly meta = this._meta.asReadonly();

  /** Limpia el error del formulario (al reintentar o cambiar de DNI). */
  limpiarFormError(): void {
    this._formError.set(null);
  }

  cargar(actividadId: number, page = 1): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .listar(actividadId, page)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._participantes.set(res.data);
          this._meta.set(res.meta);
        },
        error: () => this._error.set('No se pudieron cargar los participantes.'),
      });
  }

  /**
   * Inscribe a una persona. Distingue el 409 (ya inscrita o actividad cerrada:
   * ambos casos comparten código, así que se muestra el mensaje del backend tal
   * cual) del 422 (persona nueva sin nombre). Ambos van a `formError` para
   * mostrarse dentro del formulario, no como error genérico de la sección.
   */
  agregar(actividadId: number, payload: ParticipacionPayload): Observable<Participacion> {
    this._formError.set(null);

    return this.api.agregar(actividadId, payload).pipe(
      map((res) => res.participacion),
      tap((nueva) => {
        this._participantes.update((lista) => [...lista, nueva]);
        this._meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409 || error.status === 422) {
          this._formError.set(this.mensajeBackend(error) ?? this.formErrorFallback(error.status));
        } else {
          this._error.set('No se pudo agregar el participante.');
        }
        return throwError(() => error);
      }),
    );
  }

  quitar(actividadId: number, participacionId: number): Observable<void> {
    this._error.set(null);

    return this.api.quitar(actividadId, participacionId).pipe(
      map(() => undefined),
      tap(() => {
        this._participantes.update((lista) => lista.filter((p) => p.id !== participacionId));
        this._meta.update((meta) => ({ ...meta, total: Math.max(0, meta.total - 1) }));
      }),
      catchError((error: HttpErrorResponse) => {
        this._error.set(
          error.status === 409
            ? this.mensajeBackend(error) ?? 'No se puede retirar a un participante de una actividad cerrada.'
            : 'No se pudo retirar al participante.',
        );
        return throwError(() => error);
      }),
    );
  }

  marcarAsistencia(
    actividadId: number,
    participacionId: number,
    asistencia: boolean,
  ): Observable<void> {
    this._error.set(null);

    return this.api.marcarAsistencia(actividadId, participacionId, asistencia).pipe(
      map(() => undefined),
      tap(() =>
        this._participantes.update((lista) =>
          lista.map((p) => (p.id === participacionId ? { ...p, asistencia } : p)),
        ),
      ),
      catchError((error: HttpErrorResponse) => {
        this._error.set('No se pudo actualizar la asistencia.');
        return throwError(() => error);
      }),
    );
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }

  private formErrorFallback(status: number): string {
    return status === 422
      ? 'Faltan datos de la persona nueva.'
      : 'No se pudo inscribir a la persona en esta actividad.';
  }
}
