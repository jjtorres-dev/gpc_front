import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MATERIAL_IMPORTS } from '../../../../shared/material';
import { PublicLayoutComponent } from '../../../../shared/components/public-layout/public-layout.component';
import { abrirBlobEnPestana, descargarBlob } from '../../data-access/archivo.util';
import { PortalPublicoApiService } from '../../data-access/portal-publico-api.service';
import { CertificadoDetallePublico, esEstadoValido } from '../../models/certificado-publico.model';

/**
 * Portal público — verificación de un certificado por código.
 * - Sin :codigo (ruta /verificar): muestra un formulario para pegar el código
 *   a mano (útil si alguien copia el código sin escanear el QR).
 * - Con :codigo (ruta /verificar/:codigo): carga el detalle automáticamente,
 *   que es como funciona el escaneo real del QR.
 */
@Component({
  selector: 'app-verificar',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PublicLayoutComponent, ...MATERIAL_IMPORTS],
  templateUrl: './verificar.component.html',
  styleUrl: './verificar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortalPublicoApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly codigo = signal<string | null>(null);
  readonly cargando = signal(false);
  readonly detalle = signal<CertificadoDetallePublico | null>(null);
  /** true cuando el backend respondió 404: no hay certificado con ese código. */
  readonly noEncontrado = signal(false);
  /** Error técnico (red / 5xx), distinto de "no encontrado". */
  readonly error = signal<string | null>(null);
  readonly descargando = signal(false);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required]],
  });

  readonly esEstadoValido = esEstadoValido;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const codigo = params.get('codigo');
      this.codigo.set(codigo);
      if (codigo) {
        this.cargar(codigo);
      } else {
        this.detalle.set(null);
        this.noEncontrado.set(false);
        this.error.set(null);
      }
    });
  }

  /** Envía el formulario de "pegar código": navega a /verificar/:codigo. */
  irACodigo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const codigo = this.form.getRawValue().codigo.trim();
    this.router.navigate(['/verificar', codigo]);
  }

  private cargar(codigo: string): void {
    this.cargando.set(true);
    this.detalle.set(null);
    this.noEncontrado.set(false);
    this.error.set(null);

    this.api
      .obtenerPorCodigo(codigo)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (detalle) => this.detalle.set(detalle),
        error: (err: HttpErrorResponse) => {
          if (err.status === 404) {
            this.noEncontrado.set(true);
          } else {
            this.error.set('No se pudo verificar el certificado. Intenta nuevamente en unos minutos.');
          }
        },
      });
  }

  verPdf(): void {
    const codigo = this.codigo();
    if (!codigo || this.descargando()) return;
    this.descargando.set(true);
    this.api
      .descargarArchivo(codigo)
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => abrirBlobEnPestana(blob),
        error: () => this.error.set('No se pudo abrir el PDF del certificado.'),
      });
  }

  descargar(): void {
    const codigo = this.codigo();
    if (!codigo || this.descargando()) return;
    this.descargando.set(true);
    this.api
      .descargarArchivo(codigo)
      .pipe(finalize(() => this.descargando.set(false)))
      .subscribe({
        next: (blob) => descargarBlob(blob, `${codigo}.pdf`),
        error: () => this.error.set('No se pudo descargar el PDF del certificado.'),
      });
  }
}
