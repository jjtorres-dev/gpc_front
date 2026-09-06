import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  EstadoPractica,
  Practicante,
  PracticanteCertificado,
  PracticantePayload,
} from '../models/practicante.model';

export interface PracticantesMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface PracticantesResponse {
  data: Practicante[];
  meta: PracticantesMeta;
}

export interface PracticanteResponse {
  practicante: Practicante;
}

export interface CertificadoResponse {
  certificado: PracticanteCertificado | null;
}

/** Capa Model: llamadas HTTP puras al contrato de /api/practicantes. */
@Injectable({ providedIn: 'root' })
export class PracticantesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/practicantes`;

  listar(search = '', estado: '' | EstadoPractica = '', page = 1): Observable<PracticantesResponse> {
    let params = new HttpParams().set('page', page);
    if (search.trim()) params = params.set('search', search.trim());
    if (estado) params = params.set('estado', estado);

    return this.http.get<PracticantesResponse>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<PracticanteResponse> {
    return this.http.get<PracticanteResponse>(`${this.baseUrl}/${id}`);
  }

  crear(payload: PracticantePayload): Observable<PracticanteResponse> {
    return this.http.post<PracticanteResponse>(this.baseUrl, payload);
  }

  editar(id: number, payload: PracticantePayload): Observable<PracticanteResponse> {
    return this.http.put<PracticanteResponse>(`${this.baseUrl}/${id}`, payload);
  }

  concluir(id: number): Observable<PracticanteResponse> {
    return this.http.patch<PracticanteResponse>(`${this.baseUrl}/${id}/concluir`, {});
  }

  obtenerCertificado(id: number): Observable<CertificadoResponse> {
    return this.http.get<CertificadoResponse>(`${this.baseUrl}/${id}/certificado`);
  }

  generarCertificado(id: number, idFirma: number): Observable<CertificadoResponse> {
    return this.http.post<CertificadoResponse>(`${this.baseUrl}/${id}/certificado`, { idFirma });
  }

  /** Descarga el PDF de un certificado ya emitido (endpoint transversal de certificados). */
  descargarCertificado(certId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/certificados/${certId}/descargar`, {
      responseType: 'blob',
    });
  }
}
