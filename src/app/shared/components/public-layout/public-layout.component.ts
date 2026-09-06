import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MATERIAL_IMPORTS } from '../../material';

/**
 * Contenedor del Portal Público: toolbar simple (sin logout ni sidenav) +
 * navegación entre "Consulta por DNI" y "Verificación QR o Código", con el
 * contenido de cada página proyectado por <ng-content>.
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ...MATERIAL_IMPORTS],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {}
