import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Actividad, ActividadFiltros, ActividadPayload } from '../../../core/models/actividad.model';
import { environment } from '../../../../environments/environment';

export interface ActividadesMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface ActividadesResponse {
  data: Actividad[];
  meta: ActividadesMeta;
}

export interface ActividadResponse {
  actividad: Actividad;
}

/** Capa Model: llamadas HTTP puras al contrato propuesto de /api/actividades. */
@Injectable({ providedIn: 'root' })
export class ActividadesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/actividades`;

  listar(filtros: ActividadFiltros = {}): Observable<ActividadesResponse> {
    let params = new HttpParams();

    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.fechaInicio) params = params.set('fecha_inicio', filtros.fechaInicio);
    if (filtros.areaId) params = params.set('area', filtros.areaId);
    if (filtros.page) params = params.set('page', filtros.page);

    return this.http.get<ActividadesResponse>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<ActividadResponse> {
    return this.http.get<ActividadResponse>(`${this.baseUrl}/${id}`);
  }

  crear(actividad: ActividadPayload): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(this.baseUrl, actividad);
  }

  editar(id: number, actividad: ActividadPayload): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.baseUrl}/${id}`, actividad);
  }

  cerrar(id: number): Observable<ActividadResponse> {
    return this.http.patch<ActividadResponse>(`${this.baseUrl}/${id}/cerrar`, {});
  }
}
