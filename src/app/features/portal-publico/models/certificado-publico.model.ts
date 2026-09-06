/**
 * Fila del listado público por DNI
 * (GET /api/publico/certificados?dni=).
 */
export interface CertificadoPublico {
  codigo: string;
  tipo: string;
  nombreActividad: string;
  fechaEmision: string;
  estado: string;
}

/**
 * Detalle público de un certificado por código
 * (GET /api/publico/certificados/:codigo), usado en la vista de verificación
 * a la que se llega por QR.
 */
export interface CertificadoDetallePublico {
  codigo: string;
  nombreCompleto: string;
  tipo: string;
  nombreActividad: string;
  fechaEmision: string;
  estado: string;
  /** Código del certificado que reemplaza a este, si fue anulado y reemitido. */
  reemplazadoPor?: string | null;
}

/**
 * true si el estado del certificado es "Válido" (tolerante a mayúsculas y
 * acentos); cualquier otro valor se considera anulado.
 */
export function esEstadoValido(estado: string): boolean {
  const v = (estado ?? '').trim().toLowerCase();
  return v === 'válido' || v === 'valido';
}
