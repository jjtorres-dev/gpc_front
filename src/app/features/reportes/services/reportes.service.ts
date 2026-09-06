import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';

import { descargarBlobComoArchivo } from '../../../core/utils/descarga-archivo';
import {
  FormatoExportacion,
  ReporteActividad,
  ReporteActividadFiltros,
  ReporteCertificado,
  ReporteCertificadoFiltros,
} from '../models/reporte.model';
import { ReportesApiService } from '../data-access/reportes-api.service';

type TipoReporte = 'actividades' | 'certificados';
type ReporteFiltros = ReporteActividadFiltros | ReporteCertificadoFiltros;

/**
 * Capa ViewModel: estado y acciones del módulo de reportes.
 * Los resultados de cada pestaña viven en signals independientes; `loading` y
 * `error` se comparten y `filtrosActuales` guarda el último filtro aplicado
 * (de cualquiera de las dos pestañas).
 */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly api = inject(ReportesApiService);

  private readonly _actividades = signal<ReporteActividad[]>([]);
  private readonly _certificados = signal<ReporteCertificado[]>([]);
  private readonly _totalGeneralCertificados = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtrosActuales = signal<ReporteFiltros>({});

  readonly actividades = this._actividades.asReadonly();
  readonly certificados = this._certificados.asReadonly();
  /** Total general de certificados emitidos que envía el backend en la envoltura. */
  readonly totalGeneralCertificados = this._totalGeneralCertificados.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtrosActuales = this._filtrosActuales.asReadonly();

  cargarActividades(filtros: ReporteActividadFiltros): void {
    this._loading.set(true);
    this._error.set(null);
    this._filtrosActuales.set({ ...filtros });

    this.api
      .actividades(filtros, 'json')
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (respuesta) => this._actividades.set(this.extraerFilas(respuesta)),
        error: () => this._error.set('No se pudo generar el reporte de actividades.'),
      });
  }

  cargarCertificados(filtros: ReporteCertificadoFiltros): void {
    this._loading.set(true);
    this._error.set(null);
    this._filtrosActuales.set({ ...filtros });

    this.api
      .certificados(filtros, 'json')
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (respuesta) => {
          const filas = this.extraerFilas(respuesta);
          this._certificados.set(filas);
          this._totalGeneralCertificados.set(
            this.extraerTotalGeneral(respuesta) ??
              filas.reduce((acc, fila) => acc + fila.cantidad, 0),
          );
        },
        error: () => this._error.set('No se pudo generar el reporte de certificados.'),
      });
  }

  /**
   * El backend de reportes responde con una envoltura `{ data: [...] }` (y en
   * certificados además `totalGeneral`). Normaliza a un array plano —
   * tolerando también un array directo— para que la tabla nunca reciba un
   * objeto ("Error trying to diff '[object Object]'").
   */
  private extraerFilas<T>(respuesta: T[] | { data?: T[] } | null | undefined): T[] {
    if (Array.isArray(respuesta)) return respuesta;
    return respuesta?.data ?? [];
  }

  /** Toma el `totalGeneral` de la envoltura si viene como número; si no, null. */
  private extraerTotalGeneral(respuesta: { totalGeneral?: number } | unknown[]): number | null {
    return !Array.isArray(respuesta) && typeof respuesta.totalGeneral === 'number'
      ? respuesta.totalGeneral
      : null;
  }

  /**
   * Descarga el reporte indicado en el formato pedido, reutilizando el helper
   * compartido de descarga (blob + `<a>` temporal).
   */
  exportar(tipo: TipoReporte, filtros: ReporteFiltros, formato: FormatoExportacion): Observable<Blob> {
    this._error.set(null);

    const peticion$ =
      tipo === 'actividades'
        ? this.api.actividades(filtros, formato)
        : this.api.certificados(filtros, formato);

    return peticion$.pipe(
      tap((blob) => {
        const fecha = new Date().toISOString().slice(0, 10);
        const extension = formato === 'csv' ? 'csv' : 'pdf';
        descargarBlobComoArchivo(blob, `reporte-${tipo}-${fecha}.${extension}`);
      }),
      catchError((error: HttpErrorResponse) => {
        this._error.set('No se pudo exportar el reporte.');
        return throwError(() => error);
      }),
    );
  }
}
