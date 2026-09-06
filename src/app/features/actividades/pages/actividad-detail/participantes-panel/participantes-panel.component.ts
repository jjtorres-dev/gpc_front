import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs';

import { PersonasApiService } from '../../../../../core/data-access/personas-api.service';
import { Persona } from '../../../../../core/models/persona.model';
import { MATERIAL_IMPORTS } from '../../../../../shared/material';
import { Participacion, ParticipacionPayload, TipoParticipacion } from '../../../models/participacion.model';
import { ParticipantesService } from '../../../services/participantes.service';

const DNI_REGEX = /^\d{8}$/;

/** Diálogo de confirmación para retirar a un participante. */
@Component({
  selector: 'app-retirar-participante-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Retirar participante</h2>
    <mat-dialog-content>
      ¿Retirar a <strong>{{ data.nombre }}</strong> de esta actividad? Se perderá su registro de
      asistencia.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">Retirar</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetirarParticipanteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RetirarParticipanteDialogComponent, boolean>);
  readonly data = inject<{ nombre: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-participantes-panel',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './participantes-panel.component.html',
  styleUrl: './participantes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantesPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personasApi = inject(PersonasApiService);

  readonly vm = inject(ParticipantesService);

  /** Id de la actividad dueña de las participaciones. */
  readonly actividadId = input.required<number>();
  /** Si la actividad está cerrada: bloquea alta y retiro (no la asistencia). */
  readonly cerrada = input.required<boolean>();

  readonly columnas = ['dni', 'nombreCompleto', 'tipoParticipacion', 'asistencia', 'acciones'];
  readonly tipos: TipoParticipacion[] = ['Municipal', 'Externo'];

  /** Búsqueda de persona por DNI. */
  readonly buscando = signal(false);
  readonly persona = signal<Persona | null>(null);
  /** true cuando ya se resolvió una búsqueda para el DNI actual (encontrada o no). */
  readonly busquedaHecha = signal(false);
  readonly enviando = signal(false);
  /** true mientras se descarga la exportación: solo deshabilita el botón. */
  readonly exportando = signal(false);

  readonly form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(DNI_REGEX)]],
    nombreCompleto: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required]),
    correo: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.email]),
    tipoParticipacion: this.fb.nonNullable.control<TipoParticipacion>('Municipal', [Validators.required]),
  });

  ngOnInit(): void {
    this.vm.cargar(this.actividadId());

    this.form.controls.dni.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dni) => this.buscarPersona(dni));
  }

  get personaNueva(): boolean {
    return this.busquedaHecha() && this.persona() === null;
  }

  agregar(): void {
    if (this.cerrada() || this.form.invalid || !this.busquedaHecha() || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ParticipacionPayload = this.persona()
      ? { dni: raw.dni.trim(), tipoParticipacion: raw.tipoParticipacion }
      : {
          dni: raw.dni.trim(),
          tipoParticipacion: raw.tipoParticipacion,
          nombreCompleto: raw.nombreCompleto.trim(),
          correo: raw.correo.trim() || undefined,
        };

    this.enviando.set(true);
    this.vm
      .agregar(this.actividadId(), payload)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (participacion) => {
          this.snackBar.open(`${participacion.persona.nombreCompleto} inscrito(a).`, 'Cerrar', {
            duration: 3000,
          });
          this.resetForm();
        },
        // El mensaje de 409 / 422 lo expone vm.formError(); no hay nada más que hacer aquí.
        error: () => undefined,
      });
  }

  onAsistenciaChange(row: Participacion, event: MatSlideToggleChange): void {
    this.vm.marcarAsistencia(this.actividadId(), row.id, event.checked).subscribe({
      error: () => {
        event.source.checked = row.asistencia; // revierte el toggle si falló
        this.snackBar.open('No se pudo actualizar la asistencia.', 'Cerrar', { duration: 3000 });
      },
    });
  }

  confirmarRetiro(row: Participacion): void {
    if (this.cerrada()) return;

    this.dialog
      .open(RetirarParticipanteDialogComponent, {
        width: '420px',
        data: { nombre: row.persona.nombreCompleto },
      })
      .afterClosed()
      .pipe(
        filter((confirmado): confirmado is true => confirmado === true),
        switchMap(() => this.vm.quitar(this.actividadId(), row.id)),
      )
      .subscribe({
        next: () => this.snackBar.open('Participante retirado.', 'Cerrar', { duration: 3000 }),
        error: () => undefined,
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.vm.cargar(this.actividadId(), event.pageIndex + 1);
  }

  /** Exporta la lista de participantes (RF-33: disponible para los 3 roles). */
  exportar(formato: 'csv' | 'pdf'): void {
    if (this.exportando()) return;

    this.exportando.set(true);
    this.vm
      .exportar(this.actividadId(), formato)
      .pipe(finalize(() => this.exportando.set(false)))
      .subscribe({
        next: () =>
          this.snackBar.open('Exportación descargada.', 'Cerrar', { duration: 3000 }),
        error: () =>
          this.snackBar.open('No se pudo exportar la lista.', 'Cerrar', { duration: 4000 }),
      });
  }

  private buscarPersona(dni: string): void {
    this.vm.limpiarFormError();
    this.persona.set(null);
    this.busquedaHecha.set(false);
    this.setModoPersonaNueva(false);

    if (!DNI_REGEX.test(dni)) return;

    this.buscando.set(true);
    this.personasApi
      .buscarPorDni(dni)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (persona) => {
          this.persona.set(persona);
          this.busquedaHecha.set(true);
          this.setModoPersonaNueva(persona === null);
        },
        error: () => this.busquedaHecha.set(false),
      });
  }

  /** Habilita nombre/correo como editables (persona nueva) o los bloquea. */
  private setModoPersonaNueva(nueva: boolean): void {
    const { nombreCompleto, correo } = this.form.controls;
    nombreCompleto.reset('');
    correo.reset('');
    if (nueva) {
      nombreCompleto.enable();
      correo.enable();
    } else {
      nombreCompleto.disable();
      correo.disable();
    }
  }

  private resetForm(): void {
    this.form.reset({ dni: '', nombreCompleto: '', correo: '', tipoParticipacion: 'Municipal' });
    this.setModoPersonaNueva(false);
    this.persona.set(null);
    this.busquedaHecha.set(false);
    this.vm.limpiarFormError();
  }
}
