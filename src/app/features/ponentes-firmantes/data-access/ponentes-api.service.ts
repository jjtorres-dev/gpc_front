import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Ponente, PonentePayload } from '../models/ponente.model';

export interface PonentesMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface PonentesResponse {
  data: Ponente[];
  meta: PonentesMeta;
}

export interface PonenteResponse {
  ponente: Ponente;
}

/** Capa Model: llamadas HTTP puras al contrato de /api/ponentes. */
@Injectable({ providedIn: 'root' })
export class PonentesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ponentes`;

  listar(search = '', page = 1): Observable<PonentesResponse> {
    let params = new HttpParams().set('page', page);
    if (search.trim()) params = params.set('search', search.trim());

    return this.http.get<PonentesResponse>(this.baseUrl, { params });
  }

  crear(payload: PonentePayload): Observable<PonenteResponse> {
    return this.http.post<PonenteResponse>(this.baseUrl, payload);
  }

  editar(id: number, payload: PonentePayload): Observable<PonenteResponse> {
    return this.http.put<PonenteResponse>(`${this.baseUrl}/${id}`, payload);
  }
}
