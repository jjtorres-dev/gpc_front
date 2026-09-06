import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Firmante, UsuarioDisponible } from '../models/firmante.model';

export interface FirmantesMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface FirmantesResponse {
  data: Firmante[];
  meta: FirmantesMeta;
}

export interface FirmanteResponse {
  firmante: Firmante;
}

/**
 * Capa Model: llamadas HTTP puras al contrato de /api/firmantes.
 * `crear` recibe un FormData (incluye el archivo .pfx), no un objeto JSON.
 */
@Injectable({ providedIn: 'root' })
export class FirmantesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/firmantes`;

  listar(page = 1): Observable<FirmantesResponse> {
    return this.http.get<FirmantesResponse>(this.baseUrl, {
      params: new HttpParams().set('page', page),
    });
  }

  listarDisponibles(): Observable<UsuarioDisponible[]> {
    return this.http.get<UsuarioDisponible[]>(
      `${environment.apiUrl}/usuarios/disponibles-firmante`,
    );
  }

  /**
   * Registra un firmante. El body es multipart/form-data con los campos
   * idUsuario, cargo, archivoPfx y passphrase; el navegador fija el
   * Content-Type con su boundary, no se debe forzar aquí.
   */
  crear(formData: FormData): Observable<FirmanteResponse> {
    return this.http.post<FirmanteResponse>(this.baseUrl, formData);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
