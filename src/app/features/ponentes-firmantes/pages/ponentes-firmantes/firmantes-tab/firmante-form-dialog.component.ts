import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../../shared/material';
import { Firmante } from '../../../models/firmante.model';
import { FirmantesService } from '../../../services/firmantes.service';

const EXTENSIONES_VALIDAS = ['.pfx', '.p12'];
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB

/**
 * Diálogo con el formulario de registro de firmante. El archivo .pfx/.p12 se
 * valida en el cliente (extensión + tamaño) ANTES de enviar; al confirmar arma
 * un FormData con los 4 campos y lo manda por firmantesApiService.crear().
 */
@Component({
  selector: 'app-firmante-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './firmante-form-dialog.component.html',
  styleUrl: './firmante-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirmanteFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FirmanteFormDialogComponent, Firmante>);

  readonly vm = inject(FirmantesService);

  readonly guardando = signal(false);
  readonly hidePassphrase = signal(true);
  readonly archivo = signal<File | null>(null);
  /** Error de validación de cliente del archivo (no llega a enviarse la petición). */
  readonly archivoError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    idUsuario: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    cargo: ['', [Validators.required]],
    passphrase: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.vm.limpiarFormError();
    this.vm.cargarDisponibles();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // permite volver a elegir el mismo archivo

    if (!file) return;

    const nombre = file.name.toLowerCase();
    const extensionOk = EXTENSIONES_VALIDAS.some((ext) => nombre.endsWith(ext));
    if (!extensionOk) {
      this.archivo.set(null);
      this.archivoError.set('El archivo debe tener extensión .pfx o .p12.');
      return;
    }
    if (file.size > TAMANO_MAXIMO) {
      this.archivo.set(null);
      this.archivoError.set('El archivo no puede superar los 2 MB.');
      return;
    }

    this.archivoError.set(null);
    this.archivo.set(file);
  }

  guardar(): void {
    const archivo = this.archivo();
    if (!archivo) {
      this.archivoError.set('Selecciona el archivo del certificado.');
    }
    if (this.form.invalid || !archivo || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('idUsuario', String(raw.idUsuario));
    formData.append('cargo', raw.cargo.trim());
    formData.append('archivoPfx', archivo, archivo.name);
    formData.append('passphrase', raw.passphrase);

    this.guardando.set(true);
    this.vm
      .crear(formData)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (firmante) => this.dialogRef.close(firmante),
        // El 409 / 422 lo expone vm.formError(); nada más que hacer aquí.
        error: () => undefined,
      });
  }
}
