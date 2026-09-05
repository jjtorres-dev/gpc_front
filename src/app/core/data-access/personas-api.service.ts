import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Persona } from '../models/persona.model';

interface PersonaResponse {
  persona: Persona;
}

/** Capa Model: búsqueda de personas del padrón contra GET /api/personas?dni=. */
@Injectable({ providedIn: 'root' })
export class PersonasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/personas`;

  /**
   * Busca una persona por DNI. Un 404 aquí NO es un error: significa "esta
   * persona todavía no está registrada", caso normal al inscribir a alguien
   * nuevo. Por eso se intercepta y se resuelve a `null`.
   */
  buscarPorDni(dni: string): Observable<Persona | null> {
    return this.http
      .get<PersonaResponse>(this.baseUrl, { params: new HttpParams().set('dni', dni) })
      .pipe(
        map((res) => res.persona),
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(null) : throwError(() => error),
        ),
      );
  }
}
