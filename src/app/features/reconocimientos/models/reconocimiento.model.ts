import { Persona } from '../../../core/models/persona.model';

/** Reconocimiento otorgado a una persona. */
export interface Reconocimiento {
  id: number;
  persona: Pick<Persona, 'id' | 'dni' | 'nombreCompleto' | 'correo'>;
  titulo: string;
  descripcion?: string;
  motivo?: string;
  fechaReconocimiento: string;
  responsableAprobacion?: string;
}

/**
 * Cuerpo de POST/PUT /api/reconocimientos.
 * `nombreCompleto` / `correo` solo se envían al crear cuando el DNI no existía
 * en el padrón (persona nueva); si ya existe, el backend los ignora.
 */
export interface ReconocimientoPayload {
  dni: string;
  nombreCompleto?: string;
  correo?: string;
  titulo: string;
  descripcion?: string;
  motivo?: string;
  fechaReconocimiento: string;
  responsableAprobacion?: string;
}
