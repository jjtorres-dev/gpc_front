import { EstadoActividad, TipoActividad } from '../../../core/models/actividad.model';

/** Formato pedido a los endpoints de reportes. */
export type FormatoReporte = 'json' | 'csv' | 'pdf';
/** Formatos que producen un archivo descargable (blob). */
export type FormatoExportacion = 'csv' | 'pdf';

/** Fila de GET /api/reportes/actividades (formato=json). */
export interface ReporteActividad {
  id: number;
  nombre: string;
  tipo: TipoActividad;
  estado: EstadoActividad;
  area: string | null;
  fechaInicio: string;
  fechaFin: string;
  totalParticipantes: number;
  totalCertificados: number;
}

/** Fila de GET /api/reportes/certificados (formato=json). */
export interface ReporteCertificado {
  idActividad: number;
  nombreActividad: string;
  tipo: TipoActividad;
  cantidad: number;
  fechaEmision: string;
}

/** Envoltura de GET /api/reportes/actividades (formato=json). */
export interface ReporteActividadesRespuesta {
  data: ReporteActividad[];
}

/**
 * Envoltura de GET /api/reportes/certificados (formato=json).
 * El backend devuelve el total general ya calculado junto al array de filas.
 */
export interface ReporteCertificadosRespuesta {
  data: ReporteCertificado[];
  totalGeneral: number;
}

/** Filtros del reporte de actividades. */
export interface ReporteActividadFiltros {
  tipo?: TipoActividad;
  estado?: EstadoActividad;
  areaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Filtros del reporte de certificados. */
export interface ReporteCertificadoFiltros {
  tipo?: TipoActividad;
  areaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}
