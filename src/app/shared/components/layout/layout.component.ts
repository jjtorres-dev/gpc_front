import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { MATERIAL_IMPORTS } from '../../material';
import { SidenavMenuComponent } from '../sidenav-menu/sidenav-menu.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidenavMenuComponent, ...MATERIAL_IMPORTS],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly currentUser = this.authService.currentUser;
  readonly menuItems = computed(() => {
    const user = this.currentUser();
    return user ? this.menuService.getMenuForRole(user.rol) : [];
  });
  readonly isNarrowScreen = toSignal(
    this.breakpointObserver.observe('(max-width: 767px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  logout(): void {
    this.authService.logout();
  }
}
