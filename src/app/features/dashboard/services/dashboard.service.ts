import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { DashboardResumen } from '../models/dashboard-resumen.model';
import { DashboardApiService } from '../data-access/dashboard-api.service';

/**
 * Capa ViewModel: estado del dashboard gerencial. Solo expone los contadores
 * globales (lectura) y el estado de carga/error de la consulta.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(DashboardApiService);

  private readonly _resumen = signal<DashboardResumen | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly resumen = this._resumen.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  cargar(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .resumen()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (resumen) => this._resumen.set(resumen),
        error: () => this._error.set('No se pudo cargar el resumen del dashboard.'),
      });
  }
}
