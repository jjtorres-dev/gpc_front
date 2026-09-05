import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard, homeRedirectGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./features/auth/pages/acceso-denegado/acceso-denegado.component').then(
        (m) => m.AccesoDenegadoComponent,
      ),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['Administrador'], title: 'Gestión de Usuarios' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ['Administrador', 'Digitador', 'Gerencial'], title: 'Reportes' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'actividades',
        canActivate: [roleGuard],
        data: { roles: ['Digitador', 'Administrador'], title: 'Actividades' },
        loadComponent: () =>
          import('./features/actividades/pages/actividades-list/actividades-list.component').then(
            (m) => m.ActividadesListComponent,
          ),
      },
      {
        path: 'actividades/nueva',
        canActivate: [roleGuard],
        data: { roles: ['Digitador', 'Administrador'], title: 'Nueva actividad' },
        loadComponent: () =>
          import('./features/actividades/pages/actividad-form/actividad-form.component').then(
            (m) => m.ActividadFormComponent,
          ),
      },
      {
        path: 'actividades/:id/editar',
        canActivate: [roleGuard],
        data: { roles: ['Digitador', 'Administrador'], title: 'Editar actividad' },
        loadComponent: () =>
          import('./features/actividades/pages/actividad-form/actividad-form.component').then(
            (m) => m.ActividadFormComponent,
          ),
      },
      {
        path: 'actividades/:id',
        canActivate: [roleGuard],
        data: { roles: ['Digitador', 'Administrador'], title: 'Detalle de actividad' },
        loadComponent: () =>
          import('./features/actividades/pages/actividad-detail/actividad-detail.component').then(
            (m) => m.ActividadDetailComponent,
          ),
      },
      {
        path: 'participantes',
        canActivate: [roleGuard],
        data: { roles: ['Digitador'], title: 'Participantes' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'ponentes-firmantes',
        canActivate: [roleGuard],
        data: { roles: ['Digitador'], title: 'Ponentes y Firmantes' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'emision',
        canActivate: [roleGuard],
        data: { roles: ['Digitador'], title: 'Emisión de Certificados' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Gerencial'], title: 'Dashboard' },
        loadComponent: () =>
          import('./shared/components/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
