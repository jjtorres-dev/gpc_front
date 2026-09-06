import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../../shared/material';
import { Ponente, PonentePayload } from '../../../models/ponente.model';
import { PonentesService } from '../../../services/ponentes.service';

const DNI_REGEX = /^\d{8}$/;

export interface PonenteDialogData {
  /** Ponente a editar; ausente en modo creación. */
  ponente?: Ponente;
}

/**
 * Diálogo con el formulario corto de ponente (alta y edición). No amerita su
 * propia ruta: se abre desde la pestaña de Ponentes y se cierra devolviendo el
 * ponente guardado.
 */
@Component({
  selector: 'app-ponente-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './ponente-form-dialog.component.html',
  styleUrl: './ponente-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PonenteFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PonenteFormDialogComponent, Ponente>);
  private readonly data = inject<PonenteDialogData>(MAT_DIALOG_DATA);

  readonly vm = inject(PonentesService);

  readonly isEditMode = !!this.data.ponente;
  readonly guardando = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombreCompleto: ['', [Validators.required, Validators.maxLength(200)]],
    dni: ['', [Validators.pattern(DNI_REGEX)]],
    institucion: [''],
    cargo: [''],
    especialidad: [''],
  });

  constructor() {
    this.vm.limpiarFormError();

    const ponente = this.data.ponente;
    if (ponente) {
      this.form.patchValue({
        nombreCompleto: ponente.nombreCompleto,
        dni: ponente.dni ?? '',
        institucion: ponente.institucion ?? '',
        cargo: ponente.cargo ?? '',
        especialidad: ponente.especialidad ?? '',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: PonentePayload = {
      nombreCompleto: raw.nombreCompleto.trim(),
      dni: raw.dni.trim() || undefined,
      institucion: raw.institucion.trim() || undefined,
      cargo: raw.cargo.trim() || undefined,
      especialidad: raw.especialidad.trim() || undefined,
    };

    this.guardando.set(true);
    const operacion = this.isEditMode
      ? this.vm.editar(this.data.ponente!.id, payload)
      : this.vm.crear(payload);

    operacion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (ponente) => this.dialogRef.close(ponente),
      // El 422 / 404 lo expone vm.formError(); nada más que hacer aquí.
      error: () => undefined,
    });
  }
}
