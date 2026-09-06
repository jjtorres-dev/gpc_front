import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { FirmantesTabComponent } from './firmantes-tab/firmantes-tab.component';
import { PonentesTabComponent } from './ponentes-tab/ponentes-tab.component';

/**
 * Contenedor de "Ponentes y Firmantes": una sola página con un
 * <mat-tab-group> que separa el catálogo de ponentes del registro de firmantes.
 */
@Component({
  selector: 'app-ponentes-firmantes',
  standalone: true,
  imports: [PonentesTabComponent, FirmantesTabComponent, ...MATERIAL_IMPORTS],
  templateUrl: './ponentes-firmantes.component.html',
  styleUrl: './ponentes-firmantes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PonentesFirmantesComponent {}
