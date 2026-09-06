import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Certificado, CertificadoResumen, ResultadoLote } from '../models/certificado.model';

export interface CertificadoResponse {
  certificado: Certificado;
}

/**
 * Capa Model: llamadas HTTP puras al contrato de certificados
 * (/api/actividades/:id/certificados y /api/certificados/:id).
 */
@Injectable({ providedIn: 'root' })
export class CertificadosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  listarPorActividad(actividadId: number): Observable<CertificadoResumen[]> {
    return this.http.get<CertificadoResumen[]>(
      `${this.baseUrl}/actividades/${actividadId}/certificados`,
    );
  }

  generarLote(actividadId: number): Observable<ResultadoLote> {
    return this.http.post<ResultadoLote>(
      `${this.baseUrl}/actividades/${actividadId}/certificados/generar-lote`,
      {},
    );
  }

  descargar(certId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/certificados/${certId}/descargar`, {
      responseType: 'blob',
    });
  }

  reemitir(certId: number, motivo: string): Observable<CertificadoResponse> {
    return this.http.post<CertificadoResponse>(
      `${this.baseUrl}/certificados/${certId}/reemitir`,
      { motivo },
    );
  }
}
