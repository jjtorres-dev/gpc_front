import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../shared/material';
import { CertificadoResumen } from './models/certificado.model';
import { CertificadosService } from './services/certificados.service';

/** Diálogo que pide el motivo obligatorio antes de reemitir un certificado. */
@Component({
  selector: 'app-reemitir-certificado-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Reemitir certificado</h2>
    <mat-dialog-content>
      <p class="dialog-intro">
        Se anulará el certificado actual de <strong>{{ data.nombre }}</strong> y se emitirá uno
        nuevo. Indica el motivo.
      </p>
      <mat-form-field appearance="outline" class="motivo-field">
        <mat-label>Motivo de la reemisión</mat-label>
        <textarea matInput [formControl]="motivo" rows="3"></textarea>
        @if (motivo.hasError('required') && motivo.touched) {
          <mat-error>El motivo es obligatorio.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="motivo.invalid"
        (click)="confirmar()"
      >
        Reemitir
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-intro {
        margin: 0 0 1rem;
      }
      .motivo-field {
        width: min(420px, 80vw);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReemitirCertificadoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ReemitirCertificadoDialogComponent, string>);
  readonly data = inject<{ nombre: string }>(MAT_DIALOG_DATA);
  readonly motivo = inject(FormBuilder).nonNullable.control('', [Validators.required]);

  confirmar(): void {
    if (this.motivo.invalid) {
      this.motivo.markAsTouched();
      return;
    }
    this.dialogRef.close(this.motivo.value.trim());
  }
}

@Component({
  selector: 'app-certificados-panel',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './certificados-panel.component.html',
  styleUrl: './certificados-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificadosPanelComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly vm = inject(CertificadosService);

  /** Id de la actividad dueña de los certificados. */
  readonly actividadId = input.required<number>();
  /** Si la actividad está Cerrada: requisito para poder generar el lote. */
  readonly cerrada = input.required<boolean>();

  /** Solo un Administrador ve el botón "Reemitir" (el backend además lo exige). */
  readonly esAdministrador = computed(() => this.auth.currentUser()?.rol === 'Administrador');

  readonly columnas = computed(() =>
    this.esAdministrador()
      ? ['dni', 'nombreCompleto', 'asistencia', 'certificado', 'acciones']
      : ['dni', 'nombreCompleto', 'asistencia', 'certificado'],
  );

  readonly descargandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.vm.cargar(this.actividadId());
  }

  generar(): void {
    if (!this.cerrada() || this.vm.generando()) return;

    this.vm.generarLote(this.actividadId()).subscribe({
      next: (resultado) => {
        this.snackBar.open(
          `${resultado.generados.length} certificados generados, ${resultado.fallidos.length} fallidos.`,
          'Cerrar',
          { duration: 4000 },
        );
      },
      // El mensaje de 409 / 422 lo expone vm.error(); nada más que hacer aquí.
      error: () => undefined,
    });
  }

  verPdf(row: CertificadoResumen): void {
    const cert = row.certificado;
    if (!cert || this.descargandoId() !== null) return;

    this.descargandoId.set(cert.id);
    this.vm.descargar(cert.id).subscribe({
      next: () => this.descargandoId.set(null),
      error: () => {
        this.descargandoId.set(null);
        this.snackBar.open('No se pudo abrir el PDF.', 'Cerrar', { duration: 3000 });
      },
    });
  }

  confirmarReemision(row: CertificadoResumen): void {
    if (!this.esAdministrador() || !row.certificado) return;
    const certId = row.certificado.id;

    this.dialog
      .open(ReemitirCertificadoDialogComponent, {
        width: '460px',
        data: { nombre: row.nombreCompleto },
      })
      .afterClosed()
      .pipe(
        filter((motivo): motivo is string => typeof motivo === 'string' && motivo.length > 0),
        switchMap((motivo) => this.vm.reemitir(this.actividadId(), certId, motivo)),
      )
      .subscribe({
        next: () => this.snackBar.open('Certificado reemitido.', 'Cerrar', { duration: 3000 }),
        error: () => undefined,
      });
  }
}
