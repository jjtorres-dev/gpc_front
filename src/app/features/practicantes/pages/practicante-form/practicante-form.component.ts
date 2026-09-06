import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

import { InstitucionesApiService } from '../../../../core/data-access/instituciones-api.service';
import { PersonasApiService } from '../../../../core/data-access/personas-api.service';
import { Institucion } from '../../../../core/models/institucion.model';
import { Persona } from '../../../../core/models/persona.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { Practicante, PracticantePayload } from '../../models/practicante.model';
import { PracticantesService } from '../../services/practicantes.service';

const DNI_REGEX = /^\d{8}$/;

/** fechaFin no puede ser anterior a fechaInicio. */
const rangoFechasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const inicio = control.get('fechaInicio')?.value as Date | null;
  const fin = control.get('fechaFin')?.value as Date | null;
  return inicio && fin && fin < inicio ? { rangoFechas: true } : null;
};

@Component({
  selector: 'app-practicante-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './practicante-form.component.html',
  styleUrl: './practicante-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticanteFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly personasApi = inject(PersonasApiService);
  private readonly institucionesApi = inject(InstitucionesApiService);

  readonly vm = inject(PracticantesService);

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  readonly practicanteId = this.routeId ? Number(this.routeId) : null;
  readonly isEditMode = this.practicanteId !== null;

  /** Bloque de persona (mismo patrón que Participantes / Reconocimientos). */
  readonly buscando = signal(false);
  readonly persona = signal<Persona | null>(null);
  readonly busquedaHecha = signal(false);
  /** Modo edición: persona ya asignada, no reasignable. */
  readonly personaFija = signal<Practicante['persona'] | null>(null);

  /** Bloque de institución (autocomplete). */
  readonly buscandoInstitucion = signal(false);
  readonly institucionSugerencias = signal<Institucion[]>([]);
  readonly institucionSeleccionada = signal<Institucion | null>(null);
  readonly institucionFija = signal<Institucion | null>(null);

  readonly guardando = signal(false);
  /** Modo edición con práctica ya concluida: formulario bloqueado. */
  readonly practicaConcluida = signal(false);

  readonly institucionControl = this.fb.nonNullable.control('', [Validators.required]);

  readonly form = this.fb.group(
    {
      dni: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(DNI_REGEX)]),
      nombreCompleto: this.fb.nonNullable.control({ value: '', disabled: true }, [
        Validators.required,
      ]),
      correo: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.email]),
      carrera: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
      area: this.fb.nonNullable.control(''),
      jefeSupervisor: this.fb.nonNullable.control(''),
      fechaInicio: this.fb.control<Date | null>(null, Validators.required),
      fechaFin: this.fb.control<Date | null>(null, Validators.required),
    },
    { validators: rangoFechasValidator },
  );

  ngOnInit(): void {
    if (this.practicanteId !== null) {
      // Modo edición: persona e institución no participan del formulario.
      this.form.controls.dni.disable();
      this.form.controls.dni.clearValidators();
      this.form.controls.dni.updateValueAndValidity();
      this.institucionControl.disable();

      this.vm.obtener(this.practicanteId).subscribe({
        next: (practicante) => this.cargarPracticante(practicante),
        error: () => undefined,
      });
      return;
    }

    // Modo creación: lookup de persona por DNI con debounce.
    this.form.controls.dni.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dni) => this.buscarPersona(dni));

    // Institución: si el texto ya no coincide con la opción elegida, pasa a "nueva".
    this.institucionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        const seleccion = this.institucionSeleccionada();
        if (seleccion && valor.trim() !== seleccion.nombreInstitucion) {
          this.institucionSeleccionada.set(null);
        }
      });

    // Institución: búsqueda de sugerencias con debounce.
    this.institucionControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((texto) => this.buscarInstituciones(texto));
  }

  get personaNueva(): boolean {
    return !this.isEditMode && this.busquedaHecha() && this.persona() === null;
  }

  /** Hay texto de institución pero ninguna sugerencia exacta seleccionada. */
  get institucionEsNueva(): boolean {
    return (
      !this.isEditMode &&
      this.institucionControl.value.trim().length > 0 &&
      this.institucionSeleccionada() === null
    );
  }

  onInstitucionSeleccionada(nombre: string): void {
    const match =
      this.institucionSugerencias().find((i) => i.nombreInstitucion === nombre) ?? null;
    this.institucionSeleccionada.set(match);
  }

  guardar(): void {
    if (this.practicaConcluida()) return;

    const institucionInvalida = !this.isEditMode && this.institucionControl.invalid;
    if (this.form.invalid || institucionInvalida || this.guardando()) {
      this.form.markAllAsTouched();
      this.institucionControl.markAsTouched();
      return;
    }
    if (!this.isEditMode && !this.busquedaHecha()) return;

    const raw = this.form.getRawValue();
    const comun = {
      carrera: raw.carrera.trim(),
      area: raw.area.trim() || undefined,
      jefeSupervisor: raw.jefeSupervisor.trim() || undefined,
      fechaInicio: this.formatDate(raw.fechaInicio!),
      fechaFin: this.formatDate(raw.fechaFin!),
    };

    let payload: PracticantePayload;
    if (this.isEditMode) {
      payload = {
        dni: this.personaFija()!.dni,
        idInstitucion: this.institucionFija()!.id,
        ...comun,
      };
    } else {
      const personaPart = this.persona()
        ? { dni: raw.dni.trim() }
        : {
            dni: raw.dni.trim(),
            nombreCompleto: raw.nombreCompleto.trim(),
            correo: raw.correo.trim() || undefined,
          };

      const texto = this.institucionControl.value.trim();
      const seleccion = this.institucionSeleccionada();
      const institucionPart =
        seleccion && seleccion.nombreInstitucion === texto
          ? { idInstitucion: seleccion.id }
          : { nombreInstitucion: texto };

      payload = { ...personaPart, ...institucionPart, ...comun };
    }

    this.guardando.set(true);
    const operacion = this.isEditMode
      ? this.vm.editar(this.practicanteId!, payload)
      : this.vm.crear(payload);

    operacion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (practicante) => {
        this.snackBar.open(
          this.isEditMode ? 'Practicante actualizado.' : 'Practicante registrado.',
          'Cerrar',
          { duration: 3000 },
        );
        this.router.navigate(['/practicantes', practicante.id]);
      },
      // El 422 / 409 lo expone vm.formError(); nada más que hacer aquí.
      error: () => undefined,
    });
  }

  private cargarPracticante(practicante: Practicante): void {
    this.personaFija.set(practicante.persona);
    this.institucionFija.set(practicante.institucion);
    this.institucionSeleccionada.set(practicante.institucion);
    this.institucionControl.setValue(practicante.institucion.nombreInstitucion);
    this.institucionControl.disable();

    this.form.patchValue({
      carrera: practicante.carrera,
      area: practicante.area ?? '',
      jefeSupervisor: practicante.jefeSupervisor ?? '',
      fechaInicio: this.parseDate(practicante.fechaInicio),
      fechaFin: this.parseDate(practicante.fechaFin),
    });

    if (practicante.estadoPractica === 'Concluida') {
      this.practicaConcluida.set(true);
      this.form.disable();
      this.institucionControl.disable();
    }
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

  private buscarInstituciones(texto: string): void {
    if (texto.length < 2) {
      this.institucionSugerencias.set([]);
      return;
    }

    this.buscandoInstitucion.set(true);
    this.institucionesApi
      .buscar(texto)
      .pipe(finalize(() => this.buscandoInstitucion.set(false)))
      .subscribe({
        next: (items) => this.institucionSugerencias.set(items),
        error: () => this.institucionSugerencias.set([]),
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
