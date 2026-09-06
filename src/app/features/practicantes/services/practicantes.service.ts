import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, switchMap, tap, throwError } from 'rxjs';

import { abrirBlobEnPestana } from '../../../core/utils/descarga-archivo';
import { EstadoPractica, Practicante, PracticantePayload } from '../models/practicante.model';
import { PracticantesApiService, PracticantesMeta } from '../data-access/practicantes-api.service';

const INITIAL_META: PracticantesMeta = { total: 0, page: 1, perPage: 10 };

/**
 * Capa ViewModel: estado y reglas de interacción del módulo de practicantes.
 * La lista vive en un signal; crear / editar / concluir / generar certificado
 * la actualizan en sitio sin recargar todo.
 */
@Injectable({ providedIn: 'root' })
export class PracticantesService {
  private readonly api = inject(PracticantesApiService);

  private readonly _practicantes = signal<Practicante[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _formError = signal<string | null>(null);
  private readonly _meta = signal<PracticantesMeta>(INITIAL_META);
  private readonly _searchTerm = signal('');
  private readonly _estadoFiltro = signal<'' | EstadoPractica>('');

  readonly practicantes = this._practicantes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Error específico del formulario (422 / 409): se muestra junto al form, no como banner. */
  readonly formError = this._formError.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly estadoFiltro = this._estadoFiltro.asReadonly();

  limpiarFormError(): void {
    this._formError.set(null);
  }

  cargar(search = '', estado: '' | EstadoPractica = '', page = 1): void {
    this._loading.set(true);
    this._error.set(null);
    this._searchTerm.set(search);
    this._estadoFiltro.set(estado);

    this.api
      .listar(search, estado, page)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => {
          this._practicantes.set(res.data);
          this._meta.set(res.meta);
        },
        error: () => this._error.set('No se pudieron cargar los practicantes.'),
      });
  }

  obtener(id: number): Observable<Practicante> {
    this._loading.set(true);
    this._error.set(null);

    return this.api.obtener(id).pipe(
      map((res) => res.practicante),
      catchError((error: HttpErrorResponse) => {
        this._error.set(
          error.status === 404
            ? 'El practicante no existe o fue eliminado.'
            : 'No se pudo cargar el practicante.',
        );
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  /**
   * Registra un practicante. Distingue el 422 (falta el nombre de la persona
   * nueva o de la institución nueva) y lo expone en `formError` con el mensaje
   * del backend tal cual; cualquier otro error va al banner de sección.
   */
  crear(payload: PracticantePayload): Observable<Practicante> {
    this._formError.set(null);
    this._loading.set(true);

    return this.api.crear(payload).pipe(
      map((res) => res.practicante),
      tap((nuevo) => {
        this._practicantes.update((lista) => [nuevo, ...lista]);
        this._meta.update((meta) => ({ ...meta, total: meta.total + 1 }));
      }),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'registrar')),
      finalize(() => this._loading.set(false)),
    );
  }

  editar(id: number, payload: PracticantePayload): Observable<Practicante> {
    this._formError.set(null);
    this._loading.set(true);

    return this.api.editar(id, payload).pipe(
      map((res) => res.practicante),
      tap((actualizado) => this.replaceInList(actualizado)),
      catchError((error: HttpErrorResponse) => this.handleWriteError(error, 'actualizar')),
      finalize(() => this._loading.set(false)),
    );
  }

  /** Concluye la práctica (acción irreversible). Actualiza el item en la lista. */
  concluir(id: number): Observable<Practicante> {
    this._error.set(null);

    return this.api.concluir(id).pipe(
      map((res) => res.practicante),
      tap((concluido) => this.replaceInList(concluido)),
      catchError((error: HttpErrorResponse) => {
        this._error.set(
          error.status === 409
            ? this.mensajeBackend(error) ?? 'La práctica ya estaba concluida.'
            : 'No se pudo concluir la práctica.',
        );
        return throwError(() => error);
      }),
    );
  }

  /**
   * Genera el certificado del practicante con la firma indicada. Distingue el
   * 422 ("la práctica no está concluida") del 409 ("ya tiene certificado") con
   * mensajes propios.
   *
   * El POST solo devuelve un payload mínimo (codigoVerificacion / hashCertificado),
   * así que se recarga el practicante para obtener el certificado en su forma
   * canónica `{ id, codigo, fechaEmision, estado }` y devolver el practicante
   * completo ya actualizado.
   */
  generarCertificado(id: number, idFirma: number): Observable<Practicante> {
    this._error.set(null);

    return this.api.generarCertificado(id, idFirma).pipe(
      switchMap(() => this.api.obtener(id)),
      map((res) => res.practicante),
      tap((practicante) => this.replaceInList(practicante)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 422) {
          this._error.set(
            this.mensajeBackend(error) ??
              'La práctica debe estar concluida para generar el certificado.',
          );
        } else if (error.status === 409) {
          this._error.set(
            this.mensajeBackend(error) ?? 'Este practicante ya tiene un certificado emitido.',
          );
        } else {
          this._error.set('No se pudo generar el certificado.');
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Abre el PDF del certificado en una pestaña nueva (mismo patrón de blob +
   * `<a>` temporal que en Certificados, vía el helper compartido).
   */
  descargarCertificado(certId: number): Observable<void> {
    this._error.set(null);

    return this.api.descargarCertificado(certId).pipe(
      map((blob) => abrirBlobEnPestana(blob)),
      catchError((error: HttpErrorResponse) => {
        this._error.set('No se pudo abrir el certificado.');
        return throwError(() => error);
      }),
    );
  }

  private replaceInList(practicante: Practicante): void {
    this._practicantes.update((lista) =>
      lista.map((p) => (p.id === practicante.id ? practicante : p)),
    );
  }

  private handleWriteError(
    error: HttpErrorResponse,
    accion: 'registrar' | 'actualizar',
  ): Observable<never> {
    if (error.status === 422) {
      this._formError.set(
        this.mensajeBackend(error) ??
          'Faltan datos: el nombre de la persona nueva o el de la institución nueva.',
      );
    } else if (error.status === 409) {
      this._formError.set(
        this.mensajeBackend(error) ?? 'No se puede editar una práctica concluida.',
      );
    } else {
      this._error.set(`No se pudo ${accion} el practicante.`);
    }
    return throwError(() => error);
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
