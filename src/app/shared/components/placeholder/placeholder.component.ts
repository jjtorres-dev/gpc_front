import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MATERIAL_IMPORTS } from '../../material';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.scss',
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = input<string>();
  readonly message = input('Este módulo está en desarrollo');
  readonly displayTitle = computed(
    () => this.title() ?? (this.route.snapshot.data['title'] as string | undefined) ?? 'Módulo',
  );
}
