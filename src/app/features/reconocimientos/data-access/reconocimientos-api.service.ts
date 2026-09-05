import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Reconocimiento, ReconocimientoPayload } from '../models/reconocimiento.model';

export interface ReconocimientosMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface ReconocimientosResponse {
  data: Reconocimiento[];
  meta: ReconocimientosMeta;
}

export interface ReconocimientoResponse {
  reconocimiento: Reconocimiento;
}

/** Capa Model: llamadas HTTP puras al contrato de /api/reconocimientos. */
@Injectable({ providedIn: 'root' })
export class ReconocimientosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reconocimientos`;

  listar(search = '', page = 1): Observable<ReconocimientosResponse> {
    let params = new HttpParams().set('page', page);
    if (search.trim()) params = params.set('search', search.trim());

    return this.http.get<ReconocimientosResponse>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<ReconocimientoResponse> {
    return this.http.get<ReconocimientoResponse>(`${this.baseUrl}/${id}`);
  }

  crear(payload: ReconocimientoPayload): Observable<ReconocimientoResponse> {
    return this.http.post<ReconocimientoResponse>(this.baseUrl, payload);
  }

  editar(id: number, payload: ReconocimientoPayload): Observable<ReconocimientoResponse> {
    return this.http.put<ReconocimientoResponse>(`${this.baseUrl}/${id}`, payload);
  }
}
