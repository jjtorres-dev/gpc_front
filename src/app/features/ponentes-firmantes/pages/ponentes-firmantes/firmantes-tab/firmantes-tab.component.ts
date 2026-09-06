import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';

import { AuthService } from '../../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../../shared/material';
import { Firmante } from '../../../models/firmante.model';
import { FirmantesService } from '../../../services/firmantes.service';
import { FirmanteFormDialogComponent } from './firmante-form-dialog.component';

/** Diálogo de confirmación para eliminar un firmante (certificado digital). */
@Component({
  selector: 'app-eliminar-firmante-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Eliminar firmante</h2>
    <mat-dialog-content>
      Esto eliminará el certificado digital de <strong>{{ data.nombre }}</strong> de forma
      permanente.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" type="button" (click)="dialogRef.close(true)">
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarFirmanteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EliminarFirmanteDialogComponent, boolean>);
  readonly data = inject<{ nombre: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-firmantes-tab',
  standalone: true,
  imports: [DatePipe, ...MATERIAL_IMPORTS],
  templateUrl: './firmantes-tab.component.html',
  styleUrl: './firmantes-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirmantesTabComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly vm = inject(FirmantesService);

  /** Solo un Administrador ve el botón "Eliminar" (el backend además lo exige). */
  readonly puedeEliminar = computed(() => this.auth.currentUser()?.rol === 'Administrador');

  ngOnInit(): void {
    this.vm.cargar();
  }

  cambiarPagina(event: PageEvent): void {
    this.vm.cargar(event.pageIndex + 1);
  }

  abrirFormulario(): void {
    this.dialog
      .open<FirmanteFormDialogComponent, void, Firmante>(FirmanteFormDialogComponent, {
        width: '520px',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((firmante) => {
        if (firmante) {
          this.snackBar.open('Firmante registrado.', 'Cerrar', { duration: 3000 });
        }
      });
  }

  confirmarEliminacion(firmante: Firmante): void {
    if (!this.puedeEliminar()) return;

    this.dialog
      .open(EliminarFirmanteDialogComponent, {
        width: '420px',
        data: { nombre: firmante.usuario.nombreCompleto },
      })
      .afterClosed()
      .pipe(
        filter((confirmado): confirmado is true => confirmado === true),
        switchMap(() => this.vm.eliminar(firmante.id)),
      )
      .subscribe({
        next: () => this.snackBar.open('Firmante eliminado.', 'Cerrar', { duration: 3000 }),
        error: () => undefined,
      });
  }
}
