import { Injectable } from '@angular/core';

import { MenuItem } from '../models/menu-item.model';
import { Rol, Usuario } from '../models/usuario.model';

const MENU_BY_ROLE: Record<Rol, MenuItem[]> = {
  Administrador: [
    { label: 'Gestión de Usuarios', icon: 'people', route: '/usuarios' },
    { label: 'Actividades', icon: 'event', route: '/actividades' },
    { label: 'Reportes', icon: 'bar_chart', route: '/reportes' },
  ],
  Digitador: [
    { label: 'Actividades', icon: 'event', route: '/actividades' },
    { label: 'Participantes', icon: 'group', route: '/participantes' },
    { label: 'Ponentes y Firmantes', icon: 'campaign', route: '/ponentes-firmantes' },
    { label: 'Emisión de Certificados', icon: 'workspace_premium', route: '/emision' },
    { label: 'Reportes', icon: 'bar_chart', route: '/reportes' },
  ],
  Gerencial: [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Reportes', icon: 'bar_chart', route: '/reportes' },
  ],
};

@Injectable({ providedIn: 'root' })
export class MenuService {
  getMenuForRole(rol: Usuario['rol']): MenuItem[] {
    return MENU_BY_ROLE[rol].map((item) => ({ ...item }));
  }
}
