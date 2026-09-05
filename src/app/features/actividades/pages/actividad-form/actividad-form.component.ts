import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Actividad, ActividadPayload, TipoActividad } from '../../../../core/models/actividad.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { ActividadesService } from '../../services/actividades.service';

const rangoFechasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const fechaInicio = control.get('fechaInicio')?.value as Date | null;
  const fechaFin = control.get('fechaFin')?.value as Date | null;

  return fechaInicio && fechaFin && fechaFin < fechaInicio ? { rangoFechas: true } : null;
};

@Component({
  selector: 'app-actividad-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './actividad-form.component.html',
  styleUrl: './actividad-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActividadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly actividadesService = inject(ActividadesService);
  readonly actividadCerrada = signal(false);

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  readonly actividadId = this.routeId ? Number(this.routeId) : null;
  readonly isEditMode = this.actividadId !== null;

  readonly form = this.fb.group(
    {
      nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
      descripcion: this.fb.nonNullable.control(''),
      tipo: this.fb.control<TipoActividad | null>(null, Validators.required),
      fechaInicio: this.fb.control<Date | null>(null, Validators.required),
      fechaFin: this.fb.control<Date | null>(null, Validators.required),
      sede: this.fb.nonNullable.control(''),
      idArea: this.fb.control<number | null>(null, Validators.required),
    },
    { validators: rangoFechasValidator },
  );

  ngOnInit(): void {
    if (this.actividadId !== null) {
      this.actividadesService.obtener(this.actividadId).subscribe({
        next: (actividad) => this.cargarActividad(actividad),
        error: () => undefined,
      });
    }
  }

  guardar(): void {
    if (this.form.invalid || this.actividadCerrada()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: ActividadPayload = {
      nombre: value.nombre.trim(),
      descripcion: value.descripcion.trim() || undefined,
      tipo: value.tipo!,
      fechaInicio: this.formatDate(value.fechaInicio!),
      fechaFin: this.formatDate(value.fechaFin!),
      sede: value.sede.trim() || undefined,
      idArea: value.idArea!,
    };

    const operation =
      this.actividadId === null
        ? this.actividadesService.crear(payload)
        : this.actividadesService.editar(this.actividadId, payload);

    operation.subscribe({
      next: (actividad) => {
        const message = this.isEditMode
          ? 'Actividad actualizada correctamente.'
          : 'Actividad creada correctamente.';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/actividades', actividad.id]);
      },
      error: () => undefined,
    });
  }

  private cargarActividad(actividad: Actividad): void {
    this.form.patchValue({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion ?? '',
      tipo: actividad.tipo,
      fechaInicio: this.parseDate(actividad.fechaInicio),
      fechaFin: this.parseDate(actividad.fechaFin),
      sede: actividad.sede ?? '',
      idArea: actividad.area?.id ?? null,
    });

    if (actividad.estado === 'Cerrada') {
      this.actividadCerrada.set(true);
      this.form.disable();
    }
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
