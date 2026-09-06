import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { abrirBlobEnPestana } from '../../../../core/utils/descarga-archivo';
import { CertificadoResumen, ResultadoLote } from '../models/certificado.model';
import { CertificadosApiService } from '../data-access/certificados-api.service';

/**
 * Capa ViewModel: estado y reglas del panel de certificados de una actividad.
 * `generando` está separado de `loading` para no bloquear la tabla mientras
 * corre el lote; `ultimoResultado` guarda el resumen del último lote generado.
 */
@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private readonly api = inject(CertificadosApiService);

  private readonly _items = signal<CertificadoResumen[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _generando = signal(false);
  private readonly _ultimoResultado = signal<ResultadoLote | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** true mientras corre el lote: solo deshabilita el botón, no la tabla. */
  readonly generando = this._generando.asReadonly();
  /** Resumen del último lote generado, para mostrar el banner de resultado. */
  readonly ultimoResultado = this._ultimoResultado.asReadonly();

  limpiarResultado(): void {
    this._ultimoResultado.set(null);
  }

  cargar(actividadId: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .listarPorActividad(actividadId)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (items) => this._items.set(items),
        error: () => this._error.set('No se pudieron cargar los certificados.'),
      });
  }

  /**
   * Genera el lote de certificados. Al terminar recarga la lista y expone el
   * resumen en `ultimoResultado`. Distingue el 409 (actividad no cerrada) y el
   * 422 (sin firmante configurado) con mensajes específicos.
   */
  generarLote(actividadId: number): Observable<ResultadoLote> {
    this._generando.set(true);
    this._error.set(null);
    this._ultimoResultado.set(null);

    return this.api.generarLote(actividadId).pipe(
      tap((resultado) => {
        this._ultimoResultado.set(resultado);
        this.cargar(actividadId);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          this._error.set(
            this.mensajeBackend(error) ??
              'La actividad debe estar Cerrada para generar certificados.',
          );
        } else if (error.status === 422) {
          this._error.set(
            this.mensajeBackend(error) ??
              'No hay un firmante configurado para emitir certificados.',
          );
        } else {
          this._error.set('No se pudo generar el lote de certificados.');
        }
        return throwError(() => error);
      }),
      finalize(() => this._generando.set(false)),
    );
  }

  /**
   * Descarga el PDF del certificado y lo abre en una pestaña nueva mediante un
   * <a> temporal con un object URL, evitando los bloqueadores de pop-ups que
   * afectan a window.open directo.
   */
  descargar(certId: number): Observable<void> {
    this._error.set(null);

    return this.api.descargar(certId).pipe(
      map((blob) => abrirBlobEnPestana(blob)),
      catchError((error: HttpErrorResponse) => {
        this._error.set('No se pudo descargar el certificado.');
        return throwError(() => error);
      }),
    );
  }

  /**
   * Reemite un certificado (solo Administrador). Requiere motivo. Al terminar
   * recarga la lista para reflejar el nuevo estado. Distingue 403 y 422.
   */
  reemitir(actividadId: number, certId: number, motivo: string): Observable<void> {
    this._error.set(null);

    return this.api.reemitir(certId, motivo).pipe(
      map(() => undefined),
      tap(() => this.cargar(actividadId)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          this._error.set('Solo un Administrador puede reemitir certificados.');
        } else if (error.status === 422) {
          this._error.set(this.mensajeBackend(error) ?? 'Debes indicar el motivo de la reemisión.');
        } else {
          this._error.set('No se pudo reemitir el certificado.');
        }
        return throwError(() => error);
      }),
    );
  }

  private mensajeBackend(error: HttpErrorResponse): string | null {
    const message = (error.error as { message?: string } | null)?.message;
    return typeof message === 'string' && message.trim() ? message : null;
  }
}
