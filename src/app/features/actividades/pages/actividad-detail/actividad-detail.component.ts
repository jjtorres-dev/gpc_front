import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Actividad } from '../../../../core/models/actividad.model';
import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { AsignacionesPanelComponent } from '../../asignaciones-panel/asignaciones-panel.component';
import { CertificadosPanelComponent } from '../../certificados-panel/certificados-panel.component';
import { ActividadesService } from '../../services/actividades.service';
import { ParticipantesPanelComponent } from './participantes-panel/participantes-panel.component';

@Component({
  selector: 'app-actividad-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ParticipantesPanelComponent,
    AsignacionesPanelComponent,
    CertificadosPanelComponent,
    ...MATERIAL_IMPORTS,
  ],
  templateUrl: './actividad-detail.component.html',
  styleUrl: './actividad-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActividadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly actividadesService = inject(ActividadesService);
  readonly actividad = signal<Actividad | null>(null);
  readonly actividadId = Number(this.route.snapshot.paramMap.get('id'));

  ngOnInit(): void {
    this.actividadesService.obtener(this.actividadId).subscribe({
      next: (actividad) => this.actividad.set(actividad),
      error: () => undefined,
    });
  }
}
