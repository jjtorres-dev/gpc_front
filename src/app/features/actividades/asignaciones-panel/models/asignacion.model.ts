import { Ponente } from '../../../ponentes-firmantes/models/ponente.model';

/**
 * Ponente asignado a una actividad
 * (GET /api/actividades/:id/ponentes → [{ id, ponente }]).
 * Reutiliza la interfaz `Ponente` del catálogo de ponentes-firmantes.
 */
export interface ActividadPonente {
  id: number;
  ponente: Ponente;
}

/**
 * Firmante asignado a una actividad
 * (GET /api/actividades/:id/firmante → { firmante: { id, firma } | null }).
 * `firma` es la firma registrada (usuario + certificado) del módulo de
 * ponentes-firmantes; aquí solo se necesitan los datos del usuario.
 */
export interface ActividadFirmante {
  id: number;
  firma: {
    id: number;
    usuario: {
      nombreCompleto: string;
      cargo: string;
    };
  };
}
