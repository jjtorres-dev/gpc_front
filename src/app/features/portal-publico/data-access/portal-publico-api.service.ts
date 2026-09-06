import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CertificadoDetallePublico, CertificadoPublico } from '../models/certificado-publico.model';

/**
 * Capa Model: llamadas HTTP puras al contrato público de certificados
 * (/api/publico/certificados). Son endpoints sin autenticación; el
 * `withCredentials` global no molesta porque el backend no exige cookie aquí.
 */
@Injectable({ providedIn: 'root' })
export class PortalPublicoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/publico/certificados`;

  buscarPorDni(dni: string): Observable<CertificadoPublico[]> {
    return this.http.get<CertificadoPublico[]>(this.baseUrl, {
      params: new HttpParams().set('dni', dni),
    });
  }

  obtenerPorCodigo(codigo: string): Observable<CertificadoDetallePublico> {
    return this.http.get<CertificadoDetallePublico>(
      `${this.baseUrl}/${encodeURIComponent(codigo)}`,
    );
  }

  descargarArchivo(codigo: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(codigo)}/archivo`, {
      responseType: 'blob',
    });
  }
}
