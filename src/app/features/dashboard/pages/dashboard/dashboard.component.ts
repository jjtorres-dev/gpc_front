import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { DashboardService } from '../../services/dashboard.service';

interface TarjetaResumen {
  etiqueta: string;
  icono: string;
  valor: number;
  clase: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, ...MATERIAL_IMPORTS],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly vm = inject(DashboardService);

  /** Traduce el resumen a las tarjetas que pinta la vista (icono + número + etiqueta). */
  readonly tarjetas = computed<TarjetaResumen[]>(() => {
    const r = this.vm.resumen();
    if (!r) return [];

    return [
      { etiqueta: 'Total Actividades', icono: 'event', valor: r.totalActividades, clase: 'is-actividades' },
      { etiqueta: 'Certificados Emitidos', icono: 'workspace_premium', valor: r.totalCertificados, clase: 'is-certificados' },
      { etiqueta: 'Participantes', icono: 'group', valor: r.totalParticipantes, clase: 'is-participantes' },
      { etiqueta: 'Reconocimientos', icono: 'military_tech', valor: r.totalReconocimientos, clase: 'is-reconocimientos' },
      { etiqueta: 'Actividades Activas', icono: 'play_circle', valor: r.actividadesActivas, clase: 'is-activas' },
    ];
  });

  ngOnInit(): void {
    this.vm.cargar();
  }
}
