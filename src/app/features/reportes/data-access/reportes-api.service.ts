import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  FormatoExportacion,
  FormatoReporte,
  ReporteActividadesRespuesta,
  ReporteActividadFiltros,
  ReporteCertificadosRespuesta,
  ReporteCertificadoFiltros,
} from '../models/reporte.model';

/**
 * Capa Model: llamadas HTTP puras a /api/reportes.
 * Con `formato = 'json'` devuelve la envoltura tipada `{ data, ... }`; con 'csv'
 * o 'pdf' devuelve el `Blob` descargable ({ responseType: 'blob' }).
 */
@Injectable({ providedIn: 'root' })
export class ReportesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  actividades(filtros: ReporteActividadFiltros): Observable<ReporteActividadesRespuesta>;
  actividades(
    filtros: ReporteActividadFiltros,
    formato: 'json',
  ): Observable<ReporteActividadesRespuesta>;
  actividades(filtros: ReporteActividadFiltros, formato: FormatoExportacion): Observable<Blob>;
  actividades(
    filtros: ReporteActividadFiltros,
    formato: FormatoReporte = 'json',
  ): Observable<ReporteActividadesRespuesta | Blob> {
    const params = this.buildParams(filtros).set('formato', formato);
    const url = `${this.baseUrl}/actividades`;

    return formato === 'json'
      ? this.http.get<ReporteActividadesRespuesta>(url, { params })
      : this.http.get(url, { params, responseType: 'blob' });
  }

  certificados(filtros: ReporteCertificadoFiltros): Observable<ReporteCertificadosRespuesta>;
  certificados(
    filtros: ReporteCertificadoFiltros,
    formato: 'json',
  ): Observable<ReporteCertificadosRespuesta>;
  certificados(filtros: ReporteCertificadoFiltros, formato: FormatoExportacion): Observable<Blob>;
  certificados(
    filtros: ReporteCertificadoFiltros,
    formato: FormatoReporte = 'json',
  ): Observable<ReporteCertificadosRespuesta | Blob> {
    const params = this.buildParams(filtros).set('formato', formato);
    const url = `${this.baseUrl}/certificados`;

    return formato === 'json'
      ? this.http.get<ReporteCertificadosRespuesta>(url, { params })
      : this.http.get(url, { params, responseType: 'blob' });
  }

  private buildParams(filtros: ReporteActividadFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.areaId != null) params = params.set('area', filtros.areaId);
    if (filtros.fechaDesde) params = params.set('fecha_desde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fecha_hasta', filtros.fechaHasta);
    return params;
  }
}
