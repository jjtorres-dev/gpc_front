/** Certificado ya emitido para una persona en una actividad. */
export interface Certificado {
  id: number;
  codigo?: string;
  fechaEmision?: string;
  /** true cuando ya se envió la notificación (correo) al titular. */
  notificado: boolean;
}

/**
 * Fila del resumen de certificados de una actividad
 * (GET /api/actividades/:id/certificados).
 */
export interface CertificadoResumen {
  idPersona: number;
  dni: string;
  nombreCompleto: string;
  asistencia: boolean;
  certificado: Certificado | null;
}

/** Entrada exitosa del lote (solo se usa su conteo en la vista). */
export interface LoteGenerado {
  idPersona: number;
  nombreCompleto: string;
}

/** Entrada fallida del lote: se muestra el nombre y el motivo del error. */
export interface LoteFallido {
  idPersona?: number;
  nombreCompleto: string;
  motivo: string;
}

/** Respuesta de POST /api/actividades/:id/certificados/generar-lote. */
export interface ResultadoLote {
  generados: LoteGenerado[];
  fallidos: LoteFallido[];
}
