import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../../shared/material';
import { Ponente } from '../../../models/ponente.model';
import { PonentesService } from '../../../services/ponentes.service';
import {
  PonenteDialogData,
  PonenteFormDialogComponent,
} from './ponente-form-dialog.component';

@Component({
  selector: 'app-ponentes-tab',
  standalone: true,
  imports: [ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './ponentes-tab.component.html',
  styleUrl: './ponentes-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PonentesTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly vm = inject(PonentesService);
  readonly searchControl = this.fb.nonNullable.control('');
  readonly columnas = ['nombreCompleto', 'dni', 'institucion', 'cargo', 'especialidad', 'acciones'];

  ngOnInit(): void {
    this.vm.cargar();

    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => this.vm.cargar(search, 1));
  }

  cambiarPagina(event: PageEvent): void {
    this.vm.cargar(this.vm.searchTerm(), event.pageIndex + 1);
  }

  abrirFormulario(ponente?: Ponente): void {
    this.dialog
      .open<PonenteFormDialogComponent, PonenteDialogData, Ponente>(PonenteFormDialogComponent, {
        width: '520px',
        autoFocus: 'dialog',
        data: { ponente },
      })
      .afterClosed()
      .subscribe((guardado) => {
        if (guardado) {
          this.snackBar.open(
            ponente ? 'Ponente actualizado.' : 'Ponente registrado.',
            'Cerrar',
            { duration: 3000 },
          );
        }
      });
  }
}
