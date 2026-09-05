import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { ReconocimientosService } from '../../services/reconocimientos.service';

@Component({
  selector: 'app-reconocimientos-list',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './reconocimientos-list.component.html',
  styleUrl: './reconocimientos-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconocimientosListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly vm = inject(ReconocimientosService);
  readonly searchControl = this.fb.nonNullable.control('');

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
}
