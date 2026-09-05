import { Persona } from '../../../core/models/persona.model';

export type TipoParticipacion = 'Municipal' | 'Externo';

/** Inscripción de una persona en una actividad. */
export interface Participacion {
  id: number;
  persona: Pick<Persona, 'id' | 'dni' | 'nombreCompleto' | 'correo'>;
  tipoParticipacion: TipoParticipacion;
  fechaInscripcion: string;
  asistencia: boolean;
}

/**
 * Cuerpo de POST /api/actividades/:id/participantes.
 * `nombreCompleto` / `correo` solo se envían cuando la persona es nueva (el DNI
 * no existía en el padrón); si ya existe, el backend los ignora.
 */
export interface ParticipacionPayload {
  dni: string;
  nombreCompleto?: string;
  correo?: string;
  tipoParticipacion: TipoParticipacion;
}
