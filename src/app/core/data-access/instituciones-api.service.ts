import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Institucion } from '../models/institucion.model';

/** Capa Model: acceso HTTP puro al catálogo transversal de instituciones. */
@Injectable({ providedIn: 'root' })
export class InstitucionesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/instituciones`;

  /** GET /api/instituciones?search= — lista para autocompletar. */
  buscar(search = ''): Observable<Institucion[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());

    return this.http.get<Institucion[]>(this.baseUrl, { params });
  }
}
