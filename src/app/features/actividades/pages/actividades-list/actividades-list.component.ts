import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';

import {
  Actividad,
  ActividadFiltros,
  EstadoActividad,
  TipoActividad,
} from '../../../../core/models/actividad.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { ActividadesService } from '../../services/actividades.service';

@Component({
  selector: 'app-cerrar-actividad-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Cerrar actividad</h2>
    <mat-dialog-content>
      Esta acción cerrará la actividad y no se puede revertir. ¿Deseas continuar?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">
        Cerrar actividad
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CerrarActividadDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CerrarActividadDialogComponent, boolean>);
}

@Component({
  selector: 'app-actividades-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './actividades-list.component.html',
  styleUrl: './actividades-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActividadesListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly actividadesService = inject(ActividadesService);
  readonly displayedColumns = ['nombre', 'tipo', 'fechaInicio', 'fechaFin', 'area', 'estado', 'acciones'];

  readonly filtrosForm = this.fb.group({
    tipo: this.fb.control<TipoActividad | ''>(''),
    estado: this.fb.control<EstadoActividad | ''>(''),
    fechaInicio: this.fb.control<Date | null>(null),
    areaId: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    this.actividadesService.cargar({ page: 1 });
  }

  aplicarFiltros(page = 1): void {
    const value = this.filtrosForm.getRawValue();
    const filtros: ActividadFiltros = {
      tipo: value.tipo || undefined,
      estado: value.estado || undefined,
      fechaInicio: value.fechaInicio ? this.formatDate(value.fechaInicio) : undefined,
      areaId: value.areaId ?? undefined,
      page,
    };

    this.actividadesService.cargar(filtros);
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({ tipo: '', estado: '', fechaInicio: null, areaId: null });
    this.aplicarFiltros();
  }

  cambiarPagina(event: PageEvent): void {
    this.aplicarFiltros(event.pageIndex + 1);
  }

  confirmarCierre(actividad: Actividad): void {
    if (actividad.estado === 'Cerrada') return;

    this.dialog
      .open(CerrarActividadDialogComponent, { width: '440px' })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => confirmed === true),
        switchMap(() => this.actividadesService.cerrar(actividad.id)),
      )
      .subscribe({
        next: () => this.snackBar.open('Actividad cerrada correctamente.', 'Cerrar', { duration: 3000 }),
        error: () => undefined,
      });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
