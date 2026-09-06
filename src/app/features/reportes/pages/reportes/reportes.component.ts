import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { AreasApiService } from '../../../../core/data-access/areas-api.service';
import { EstadoActividad, TipoActividad } from '../../../../core/models/actividad.model';
import { Area } from '../../../../core/models/area.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import {
  FormatoExportacion,
  ReporteActividadFiltros,
  ReporteCertificadoFiltros,
} from '../../models/reporte.model';
import { ReportesService } from '../../services/reportes.service';

type TipoReporte = 'actividades' | 'certificados';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly areasApi = inject(AreasApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly vm = inject(ReportesService);

  readonly areas = signal<Area[]>([]);
  readonly exportando = signal(false);

  readonly tipos: TipoActividad[] = ['Capacitación', 'Reconocimiento'];
  readonly estados: EstadoActividad[] = ['Activa', 'Cerrada'];

  readonly columnasActividades = [
    'nombre',
    'tipo',
    'estado',
    'area',
    'fechaInicio',
    'fechaFin',
    'totalParticipantes',
    'totalCertificados',
  ];
  readonly columnasCertificados = ['nombreActividad', 'tipo', 'cantidad', 'fechaEmision'];

  readonly filtrosActividades = this.fb.group({
    tipo: this.fb.control<TipoActividad | ''>(''),
    estado: this.fb.control<EstadoActividad | ''>(''),
    areaId: this.fb.control<number | null>(null),
    fechaDesde: this.fb.control<Date | null>(null),
    fechaHasta: this.fb.control<Date | null>(null),
  });

  readonly filtrosCertificados = this.fb.group({
    tipo: this.fb.control<TipoActividad | ''>(''),
    areaId: this.fb.control<number | null>(null),
    fechaDesde: this.fb.control<Date | null>(null),
    fechaHasta: this.fb.control<Date | null>(null),
  });

  ngOnInit(): void {
    this.areasApi.getAreas().subscribe({
      next: (areas) => this.areas.set(areas),
      error: () => undefined,
    });

    this.vm.cargarActividades(this.leerFiltrosActividades());
    this.vm.cargarCertificados(this.leerFiltrosCertificados());
  }

  aplicarActividades(): void {
    this.vm.cargarActividades(this.leerFiltrosActividades());
  }

  limpiarActividades(): void {
    this.filtrosActividades.reset({
      tipo: '',
      estado: '',
      areaId: null,
      fechaDesde: null,
      fechaHasta: null,
    });
    this.aplicarActividades();
  }

  aplicarCertificados(): void {
    this.vm.cargarCertificados(this.leerFiltrosCertificados());
  }

  limpiarCertificados(): void {
    this.filtrosCertificados.reset({ tipo: '', areaId: null, fechaDesde: null, fechaHasta: null });
    this.aplicarCertificados();
  }

  exportar(tipo: TipoReporte, formato: FormatoExportacion): void {
    if (this.exportando()) return;

    const filtros =
      tipo === 'actividades' ? this.leerFiltrosActividades() : this.leerFiltrosCertificados();

    this.exportando.set(true);
    this.vm
      .exportar(tipo, filtros, formato)
      .pipe(finalize(() => this.exportando.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Exportación descargada.', 'Cerrar', { duration: 3000 }),
        error: () =>
          this.snackBar.open('No se pudo exportar el reporte.', 'Cerrar', { duration: 4000 }),
      });
  }

  private leerFiltrosActividades(): ReporteActividadFiltros {
    const v = this.filtrosActividades.getRawValue();
    return {
      tipo: v.tipo || undefined,
      estado: v.estado || undefined,
      areaId: v.areaId ?? undefined,
      fechaDesde: v.fechaDesde ? this.formatDate(v.fechaDesde) : undefined,
      fechaHasta: v.fechaHasta ? this.formatDate(v.fechaHasta) : undefined,
    };
  }

  private leerFiltrosCertificados(): ReporteCertificadoFiltros {
    const v = this.filtrosCertificados.getRawValue();
    return {
      tipo: v.tipo || undefined,
      areaId: v.areaId ?? undefined,
      fechaDesde: v.fechaDesde ? this.formatDate(v.fechaDesde) : undefined,
      fechaHasta: v.fechaHasta ? this.formatDate(v.fechaHasta) : undefined,
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
