import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { EstadoPractica } from '../../models/practicante.model';
import { PracticantesService } from '../../services/practicantes.service';

@Component({
  selector: 'app-practicantes-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './practicantes-list.component.html',
  styleUrl: './practicantes-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticantesListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly vm = inject(PracticantesService);

  readonly searchControl = this.fb.nonNullable.control('');
  readonly estadoControl = this.fb.nonNullable.control<'' | EstadoPractica>('');

  readonly displayedColumns = [
    'dni',
    'nombreCompleto',
    'institucion',
    'carrera',
    'fechaInicio',
    'fechaFin',
    'estado',
    'acciones',
  ];

  ngOnInit(): void {
    this.vm.cargar();

    this.searchControl.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => this.vm.cargar(search, this.estadoControl.value, 1));

    this.estadoControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((estado) => this.vm.cargar(this.searchControl.value.trim(), estado, 1));
  }

  cambiarPagina(event: PageEvent): void {
    this.vm.cargar(this.vm.searchTerm(), this.vm.estadoFiltro(), event.pageIndex + 1);
  }
}
