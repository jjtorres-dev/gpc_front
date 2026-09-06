import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { FirmantesApiService } from '../../../ponentes-firmantes/data-access/firmantes-api.service';
import { Firmante } from '../../../ponentes-firmantes/models/firmante.model';
import { Practicante } from '../../models/practicante.model';
import { PracticantesService } from '../../services/practicantes.service';

/** Confirmación previa a concluir una práctica (acción irreversible). */
@Component({
  selector: 'app-concluir-practica-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Concluir práctica</h2>
    <mat-dialog-content>
      Esta acción marca la práctica como <strong>Concluida</strong> y no se puede revertir. Después
      de concluir podrás generar el certificado. ¿Deseas continuar?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="dialogRef.close(true)">
        Concluir práctica
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcluirPracticaDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConcluirPracticaDialogComponent, boolean>);
}

@Component({
  selector: 'app-practicante-detail',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './practicante-detail.component.html',
  styleUrl: './practicante-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticanteDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly firmantesApi = inject(FirmantesApiService);

  readonly vm = inject(PracticantesService);

  readonly practicanteId = Number(this.route.snapshot.paramMap.get('id'));
  readonly practicante = signal<Practicante | null>(null);

  readonly firmantes = signal<Firmante[]>([]);
  readonly firmaControl = this.fb.control<number | null>(null);

  readonly concluyendo = signal(false);
  readonly generando = signal(false);
  readonly descargando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  confirmarConcluir(): void {
    this.dialog
      .open(ConcluirPracticaDialogComponent, { width: '460px' })
      .afterClosed()
      .pipe(
        filter((confirmado): confirmado is true => confirmado === true),
        switchMap(() => {
          this.concluyendo.set(true);
          return this.vm.concluir(this.practicanteId).pipe(finalize(() => this.concluyendo.set(false)));
        }),
      )
      .subscribe({
        next: (practicante) => {
          this.practicante.set(practicante);
          this.snackBar.open('Práctica concluida.', 'Cerrar', { duration: 3000 });
          if (!practicante.certificado) this.cargarFirmantes();
        },
        error: () => undefined,
      });
  }

  generarCertificado(): void {
    const idFirma = this.firmaControl.value;
    if (idFirma == null || this.generando()) return;

    this.generando.set(true);
    this.vm
      .generarCertificado(this.practicanteId, idFirma)
      .pipe(finalize(() => this.generando.set(false)))
      .subscribe({
        next: (practicante) => {
          this.practicante.set(practicante);
          this.snackBar.open('Certificado generado.', 'Cerrar', { duration: 3000 });
        },
        error: () => undefined,
      });
  }

  /**
   * El certificado se muestra como "Anulado" (chip gris) solo cuando su estado
   * lo dice explícitamente; cualquier otro estado ("Emitido", "Válido", …) es
   * un certificado vigente → chip verde "Válido".
   */
  estadoAnulado(estado: string): boolean {
    return (estado ?? '').trim().toLowerCase() === 'anulado';
  }

  verPdf(): void {
    const cert = this.practicante()?.certificado;
    if (!cert || this.descargando()) return;

    this.descargando.set(true);
    this.vm
      .descargarCertificado(cert.id)
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        error: () =>
          this.snackBar.open('No se pudo abrir el certificado.', 'Cerrar', { duration: 4000 }),
      });
  }

  private cargar(): void {
    this.vm.obtener(this.practicanteId).subscribe({
      next: (practicante) => {
        this.practicante.set(practicante);
        if (practicante.estadoPractica === 'Concluida' && !practicante.certificado) {
          this.cargarFirmantes();
        }
      },
      error: () => undefined,
    });
  }

  private cargarFirmantes(): void {
    this.firmantesApi.listar().subscribe({
      next: (res) => this.firmantes.set(res.data),
      error: () => this.firmantes.set([]),
    });
  }
}
