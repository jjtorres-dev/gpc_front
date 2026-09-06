import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../shared/material';
import { FirmantesApiService } from '../../ponentes-firmantes/data-access/firmantes-api.service';
import { PonentesApiService } from '../../ponentes-firmantes/data-access/ponentes-api.service';
import { Firmante } from '../../ponentes-firmantes/models/firmante.model';
import { Ponente } from '../../ponentes-firmantes/models/ponente.model';
import { ActividadPonente } from './models/asignacion.model';
import { AsignacionesService } from './services/asignaciones.service';

/** Diálogo de confirmación para quitar el firmante de una actividad. */
@Component({
  selector: 'app-quitar-firmante-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Quitar firmante</h2>
    <mat-dialog-content>
      Esto puede bloquear la generación de certificados hasta asignar uno nuevo.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">
        Quitar firmante
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuitarFirmanteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<QuitarFirmanteDialogComponent, boolean>);
}

@Component({
  selector: 'app-asignaciones-panel',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './asignaciones-panel.component.html',
  styleUrl: './asignaciones-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignacionesPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ponentesApi = inject(PonentesApiService);
  private readonly firmantesApi = inject(FirmantesApiService);

  readonly vm = inject(AsignacionesService);

  /** Id de la actividad dueña de las asignaciones. */
  readonly actividadId = input.required<number>();
  /** Si la actividad está Cerrada: bloquea todas las reasignaciones. */
  readonly cerrada = input.required<boolean>();

  /** Catálogos para los <mat-select>. */
  readonly catalogoPonentes = signal<Ponente[]>([]);
  readonly catalogoFirmantes = signal<Firmante[]>([]);

  readonly agregandoPonente = signal(false);
  readonly asignandoFirmante = signal(false);
  readonly quitandoPonenteId = signal<number | null>(null);
  readonly quitandoFirmante = signal(false);

  readonly ponenteCtrl = this.fb.control<number | null>(null);
  readonly firmanteCtrl = this.fb.control<number | null>(null);

  constructor() {
    // Una actividad cerrada bloquea los selects (además del guard en cada acción).
    effect(() => {
      const bloquear = this.cerrada();
      for (const ctrl of [this.ponenteCtrl, this.firmanteCtrl]) {
        if (bloquear && ctrl.enabled) ctrl.disable({ emitEvent: false });
        else if (!bloquear && ctrl.disabled) ctrl.enable({ emitEvent: false });
      }
    });
  }

  /** Ponentes del catálogo que aún no están asignados a esta actividad. */
  readonly ponentesDisponibles = computed(() => {
    const asignados = new Set(this.vm.ponentesAsignados().map((a) => a.ponente.id));
    return this.catalogoPonentes().filter((p) => !asignados.has(p.id));
  });

  /** Línea de metadatos del ponente: institución · cargo · especialidad (sin vacíos). */
  metaPonente(asignado: ActividadPonente): string {
    const p = asignado.ponente;
    return [p.institucion, p.cargo, p.especialidad].filter((v) => !!v && v.trim()).join(' · ');
  }

  ngOnInit(): void {
    this.vm.cargar(this.actividadId());

    this.ponentesApi.listar('', 1).subscribe({
      next: (res) => this.catalogoPonentes.set(res.data),
      error: () => this.catalogoPonentes.set([]),
    });

    this.firmantesApi.listar(1).subscribe({
      next: (res) => this.catalogoFirmantes.set(res.data),
      error: () => this.catalogoFirmantes.set([]),
    });
  }

  agregarPonente(): void {
    const idPonente = this.ponenteCtrl.value;
    if (this.cerrada() || idPonente == null || this.agregandoPonente()) return;

    this.agregandoPonente.set(true);
    this.vm.agregarPonente(this.actividadId(), idPonente).subscribe({
      next: (asignado) => {
        this.agregandoPonente.set(false);
        this.ponenteCtrl.reset(null);
        this.snackBar.open(`${asignado.ponente.nombreCompleto} agregado como ponente.`, 'Cerrar', {
          duration: 3000,
        });
      },
      error: () => this.agregandoPonente.set(false),
    });
  }

  quitarPonente(asignadoId: number): void {
    if (this.cerrada() || this.quitandoPonenteId() !== null) return;

    this.quitandoPonenteId.set(asignadoId);
    this.vm.quitarPonente(this.actividadId(), asignadoId).subscribe({
      next: () => {
        this.quitandoPonenteId.set(null);
        this.snackBar.open('Ponente quitado.', 'Cerrar', { duration: 3000 });
      },
      error: () => this.quitandoPonenteId.set(null),
    });
  }

  asignarFirmante(): void {
    const idFirma = this.firmanteCtrl.value;
    if (this.cerrada() || idFirma == null || this.asignandoFirmante()) return;

    this.asignandoFirmante.set(true);
    this.vm.asignarFirmante(this.actividadId(), idFirma).subscribe({
      next: (firmante) => {
        this.asignandoFirmante.set(false);
        this.firmanteCtrl.reset(null);
        this.snackBar.open(
          `${firmante.firma.usuario.nombreCompleto} asignado como firmante.`,
          'Cerrar',
          { duration: 3000 },
        );
      },
      error: () => this.asignandoFirmante.set(false),
    });
  }

  confirmarQuitarFirmante(): void {
    if (this.cerrada() || this.quitandoFirmante()) return;

    this.dialog
      .open(QuitarFirmanteDialogComponent, { width: '420px' })
      .afterClosed()
      .pipe(
        filter((confirmado): confirmado is true => confirmado === true),
        switchMap(() => {
          this.quitandoFirmante.set(true);
          return this.vm.quitarFirmante(this.actividadId());
        }),
      )
      .subscribe({
        next: () => {
          this.quitandoFirmante.set(false);
          this.snackBar.open('Firmante quitado.', 'Cerrar', { duration: 3000 });
        },
        error: () => this.quitandoFirmante.set(false),
      });
  }
}
