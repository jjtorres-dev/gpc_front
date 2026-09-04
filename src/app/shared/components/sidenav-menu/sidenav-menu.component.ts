import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from '../../../core/models/menu-item.model';
import { MATERIAL_IMPORTS } from '../../material';

@Component({
  selector: 'app-sidenav-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ...MATERIAL_IMPORTS],
  templateUrl: './sidenav-menu.component.html',
  styleUrl: './sidenav-menu.component.scss',
})
export class SidenavMenuComponent {
  readonly items = input.required<readonly MenuItem[]>();
}
