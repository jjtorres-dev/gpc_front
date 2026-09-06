import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { PublicLayoutComponent } from '../../../../shared/components/public-layout/public-layout.component';
import { abrirBlobEnPestana, descargarBlob } from '../../data-access/archivo.util';
import { PortalPublicoApiService } from '../../data-access/portal-publico-api.service';
import { CertificadoPublico, esEstadoValido } from '../../models/certificado-publico.model';

const DNI_REGEX = /^\d{8}$/;

/** Portal público — consulta de certificados por DNI (ruta /portal). */
@Component({
  selector: 'app-consulta-dni',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PublicLayoutComponent, ...MATERIAL_IMPORTS],
  templateUrl: './consulta-dni.component.html',
  styleUrl: './consulta-dni.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaDniComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortalPublicoApiService);

  readonly form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(DNI_REGEX)]],
  });

  readonly buscando = signal(false);
  readonly error = signal<string | null>(null);
  /** true una vez que se resolvió al menos una búsqueda (para el mensaje vacío). */
  readonly busquedaHecha = signal(false);
  readonly resultados = signal<CertificadoPublico[]>([]);
  readonly descargandoCodigo = signal<string | null>(null);

  readonly esEstadoValido = esEstadoValido;

  buscar(): void {
    if (this.form.invalid || this.buscando()) {
      this.form.markAllAsTouched();
      return;
    }

    const dni = this.form.getRawValue().dni.trim();
    this.buscando.set(true);
    this.error.set(null);

    this.api
      .buscarPorDni(dni)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (certificados) => {
          this.resultados.set(certificados);
          this.busquedaHecha.set(true);
        },
        error: () => {
          this.resultados.set([]);
          this.busquedaHecha.set(true);
          this.error.set('No se pudo completar la consulta. Intenta nuevamente en unos minutos.');
        },
      });
  }

  verPdf(codigo: string): void {
    if (this.descargandoCodigo()) return;
    this.descargandoCodigo.set(codigo);
    this.api
      .descargarArchivo(codigo)
      .pipe(finalize(() => this.descargandoCodigo.set(null)))
      .subscribe({
        next: (blob) => abrirBlobEnPestana(blob),
        error: () => this.error.set('No se pudo abrir el PDF del certificado.'),
      });
  }

  descargar(codigo: string): void {
    if (this.descargandoCodigo()) return;
    this.descargandoCodigo.set(codigo);
    this.api
      .descargarArchivo(codigo)
      .pipe(finalize(() => this.descargandoCodigo.set(null)))
      .subscribe({
        next: (blob) => descargarBlob(blob, `${codigo}.pdf`),
        error: () => this.error.set('No se pudo descargar el PDF del certificado.'),
      });
  }
}
