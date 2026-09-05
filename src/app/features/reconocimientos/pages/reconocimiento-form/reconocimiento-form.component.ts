import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

import { PersonasApiService } from '../../../../core/data-access/personas-api.service';
import { Persona } from '../../../../core/models/persona.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { Reconocimiento, ReconocimientoPayload } from '../../models/reconocimiento.model';
import { ReconocimientosService } from '../../services/reconocimientos.service';

const DNI_REGEX = /^\d{8}$/;

@Component({
  selector: 'app-reconocimiento-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './reconocimiento-form.component.html',
  styleUrl: './reconocimiento-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconocimientoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personasApi = inject(PersonasApiService);

  readonly vm = inject(ReconocimientosService);

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  readonly reconocimientoId = this.routeId ? Number(this.routeId) : null;
  readonly isEditMode = this.reconocimientoId !== null;

  /** Búsqueda de persona por DNI (solo modo creación). */
  readonly buscando = signal(false);
  readonly persona = signal<Persona | null>(null);
  readonly busquedaHecha = signal(false);
  readonly guardando = signal(false);
  /** Modo edición: persona ya asignada, no reasignable. */
  readonly personaFija = signal<Reconocimiento['persona'] | null>(null);

  readonly form = this.fb.group({
    dni: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(DNI_REGEX)]),
    nombreCompleto: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required]),
    correo: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.email]),
    titulo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    descripcion: this.fb.nonNullable.control(''),
    motivo: this.fb.nonNullable.control(''),
    fechaReconocimiento: this.fb.control<Date | null>(null, Validators.required),
    responsableAprobacion: this.fb.nonNullable.control(''),
  });

  ngOnInit(): void {
    if (this.reconocimientoId !== null) {
      // Modo edición: el bloque de persona no participa del formulario.
      this.form.controls.dni.disable();
      this.form.controls.dni.clearValidators();
      this.form.controls.dni.updateValueAndValidity();

      this.vm.obtener(this.reconocimientoId).subscribe({
        next: (reconocimiento) => this.cargarReconocimiento(reconocimiento),
        error: () => undefined,
      });
      return;
    }

    // Modo creación: lookup por DNI con debounce (mismo patrón que Participantes).
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
    return !this.isEditMode && this.busquedaHecha() && this.persona() === null;
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.isEditMode && !this.busquedaHecha()) {
      return;
    }

    const raw = this.form.getRawValue();
    const fecha = this.formatDate(raw.fechaReconocimiento!);

    const comun = {
      titulo: raw.titulo.trim(),
      descripcion: raw.descripcion.trim() || undefined,
      motivo: raw.motivo.trim() || undefined,
      fechaReconocimiento: fecha,
      responsableAprobacion: raw.responsableAprobacion.trim() || undefined,
    };

    let payload: ReconocimientoPayload;
    if (this.isEditMode) {
      payload = { dni: this.personaFija()!.dni, ...comun };
    } else if (this.persona()) {
      payload = { dni: raw.dni.trim(), ...comun };
    } else {
      payload = {
        dni: raw.dni.trim(),
        nombreCompleto: raw.nombreCompleto.trim(),
        correo: raw.correo.trim() || undefined,
        ...comun,
      };
    }

    this.guardando.set(true);
    const operacion = this.isEditMode
      ? this.vm.editar(this.reconocimientoId!, payload)
      : this.vm.crear(payload);

    operacion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Reconocimiento actualizado.' : 'Reconocimiento registrado.',
          'Cerrar',
          { duration: 3000 },
        );
        this.router.navigateByUrl('/reconocimientos');
      },
      // El 422 lo expone vm.formError(); nada más que hacer aquí.
      error: () => undefined,
    });
  }

  private cargarReconocimiento(reconocimiento: Reconocimiento): void {
    this.personaFija.set(reconocimiento.persona);
    this.form.patchValue({
      titulo: reconocimiento.titulo,
      descripcion: reconocimiento.descripcion ?? '',
      motivo: reconocimiento.motivo ?? '',
      fechaReconocimiento: this.parseDate(reconocimiento.fechaReconocimiento),
      responsableAprobacion: reconocimiento.responsableAprobacion ?? '',
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
