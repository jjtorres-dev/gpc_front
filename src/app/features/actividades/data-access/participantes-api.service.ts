import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Participacion, ParticipacionPayload } from '../models/participacion.model';

export interface ParticipantesMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface ParticipantesResponse {
  data: Participacion[];
  meta: ParticipantesMeta;
}

export interface ParticipacionResponse {
  participacion: Participacion;
}

/**
 * Capa Model: llamadas HTTP puras al contrato de
 * /api/actividades/:actividadId/participantes.
 */
@Injectable({ providedIn: 'root' })
export class ParticipantesApiService {
  private readonly http = inject(HttpClient);

  private baseUrl(actividadId: number): string {
    return `${environment.apiUrl}/actividades/${actividadId}/participantes`;
  }

  listar(actividadId: number, page = 1): Observable<ParticipantesResponse> {
    return this.http.get<ParticipantesResponse>(this.baseUrl(actividadId), {
      params: new HttpParams().set('page', page),
    });
  }

  agregar(actividadId: number, payload: ParticipacionPayload): Observable<ParticipacionResponse> {
    return this.http.post<ParticipacionResponse>(this.baseUrl(actividadId), payload);
  }

  quitar(actividadId: number, participacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(actividadId)}/${participacionId}`);
  }

  marcarAsistencia(
    actividadId: number,
    participacionId: number,
    asistencia: boolean,
  ): Observable<ParticipacionResponse> {
    return this.http.patch<ParticipacionResponse>(
      `${this.baseUrl(actividadId)}/${participacionId}/asistencia`,
      { asistencia },
    );
  }

  /** Descarga la lista de participantes de la actividad (CSV o PDF). */
  exportar(actividadId: number, formato: 'csv' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.baseUrl(actividadId)}/exportar`, {
      params: new HttpParams().set('formato', formato),
      responseType: 'blob',
    });
  }
}
