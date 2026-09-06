/** Respuesta de GET /api/dashboard/resumen: contadores globales de solo lectura. */
export interface DashboardResumen {
  totalActividades: number;
  totalCertificados: number;
  totalParticipantes: number;
  totalReconocimientos: number;
  actividadesActivas: number;
}
