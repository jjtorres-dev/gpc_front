import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ActividadFirmante, ActividadPonente } from '../models/asignacion.model';

export interface FirmanteActividadResponse {
  firmante: ActividadFirmante | null;
}

/**
 * Capa Model: llamadas HTTP puras al contrato de asignaciones de una actividad
 * (/api/actividades/:id/ponentes y /api/actividades/:id/firmante).
 */
@Injectable({ providedIn: 'root' })
export class AsignacionesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/actividades`;

  listarPonentes(actividadId: number): Observable<ActividadPonente[]> {
    return this.http.get<ActividadPonente[]>(`${this.baseUrl}/${actividadId}/ponentes`);
  }

  agregarPonente(actividadId: number, idPonente: number): Observable<ActividadPonente> {
    return this.http.post<ActividadPonente>(`${this.baseUrl}/${actividadId}/ponentes`, {
      idPonente,
    });
  }

  quitarPonente(actividadId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${actividadId}/ponentes/${id}`);
  }

  obtenerFirmante(actividadId: number): Observable<FirmanteActividadResponse> {
    return this.http.get<FirmanteActividadResponse>(`${this.baseUrl}/${actividadId}/firmante`);
  }

  asignarFirmante(actividadId: number, idFirma: number): Observable<{ firmante: ActividadFirmante }> {
    return this.http.post<{ firmante: ActividadFirmante }>(
      `${this.baseUrl}/${actividadId}/firmante`,
      { idFirma },
    );
  }

  quitarFirmante(actividadId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${actividadId}/firmante`);
  }
}
