import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import { Actividad, ActividadFiltros, ActividadPayload } from '../../../core/models/actividad.model';
import { Area } from '../../../core/models/area.model';
import { AreasApiService } from '../../../core/data-access/areas-api.service';
import { ActividadesApiService, ActividadesMeta } from '../data-access/actividades-api.service';

const INITIAL_META: ActividadesMeta = { total: 0, page: 1, perPage: 10 };

/** Capa ViewModel: estado y reglas de interacción del módulo de actividades. */
@Injectable({ providedIn: 'root' })
export class ActividadesService {
  private readonly api = inject(ActividadesApiService);
  private readonly areasApi = inject(AreasApiService);

  private readonly _actividades = signal<Actividad[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtrosActuales = signal<ActividadFiltros>({});
  private readonly _meta = signal<ActividadesMeta>(INITIAL_META);
  private readonly _areas = signal<Area[]>([]);
  private readonly _areasError = signal<string | null>(null);

  readonly actividades = this._actividades.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtrosActuales = this._filtrosActuales.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly areas = this._areas.asReadonly();
  readonly areasError = this._areasError.asReadonly();

  constructor() {
    this.cargarAreas();
  }

  cargarAreas(): void {
    this._areasError.set(null);
    this.areasApi.getAreas().subscribe({
      next: (areas) => this._areas.set(areas),
      error: () => this._areasError.set('No se pudo cargar el catálogo de áreas.'),
    });
  }

  cargar(filtros: ActividadFiltros = {}): void {
    this._loading.set(true);
    this._error.set(null);
    this._filtrosActuales.set({ ...filtros });

    this.api
      .listar(filtros)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (response) => {
          this._actividades.set(response.data);
          this._meta.set(response.meta);
        },
        error: () => this._error.set('No se pudieron cargar las actividades.'),
      });
  }

  obtener(id: number): Observable<Actividad> {
    this.beginOperation();
    return this.api.obtener(id).pipe(
      map((response) => response.actividad),
      catchError((error: HttpErrorResponse) => this.fail(error, 'No se pudo cargar la actividad.')),
      finalize(() => this._loading.set(false)),
    );
  }

  crear(actividad: ActividadPayload): Observable<Actividad> {
    this.beginOperation();
    return this.api.crear(actividad).pipe(
      map((response) => response.actividad),
      tap((creada) => this._actividades.update((actuales) => [creada, ...actuales])),
      catchError((error: HttpErrorResponse) => this.fail(error, 'No se pudo crear la actividad.')),
      finalize(() => this._loading.set(false)),
    );
  }

  editar(id: number, actividad: ActividadPayload): Observable<Actividad> {
    this.beginOperation();
    return this.api.editar(id, actividad).pipe(
      map((response) => response.actividad),
      tap((actualizada) => this.replaceInList(actualizada)),
      catchError((error: HttpErrorResponse) => {
        const message =
          error.status === 409
            ? 'No se puede editar una actividad cerrada.'
            : 'No se pudo actualizar la actividad.';
        return this.fail(error, message);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  cerrar(id: number): Observable<Actividad> {
    this.beginOperation();
    return this.api.cerrar(id).pipe(
      map((response) => response.actividad),
      tap((cerrada) => this.replaceInList(cerrada)),
      catchError((error: HttpErrorResponse) => this.fail(error, 'No se pudo cerrar la actividad.')),
      finalize(() => this._loading.set(false)),
    );
  }

  private beginOperation(): void {
    this._loading.set(true);
    this._error.set(null);
  }

  private replaceInList(actividad: Actividad): void {
    this._actividades.update((actuales) =>
      actuales.map((actual) => (actual.id === actividad.id ? actividad : actual)),
    );
  }

  private fail(error: HttpErrorResponse, message: string): Observable<never> {
    this._error.set(message);
    return throwError(() => error);
  }
}
