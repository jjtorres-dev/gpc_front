import { Component, inject } from '@angular/core';
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

  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Módulo';
}
