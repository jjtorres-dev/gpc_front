import { Institucion } from '../../../core/models/institucion.model';
import { Persona } from '../../../core/models/persona.model';

export type EstadoPractica = 'En curso' | 'Concluida';

/** Certificado anidado en el practicante (GET /api/practicantes/:id). */
export interface PracticanteCertificado {
  id: number;
  codigo: string;
  fechaEmision: string;
  estado: string;
}

/** Práctica pre-profesional de una persona en una institución (RF-12). */
export interface Practicante {
  id: number;
  persona: Pick<Persona, 'id' | 'dni' | 'nombreCompleto' | 'correo'>;
  institucion: Institucion;
  carrera: string;
  area: string;
  jefeSupervisor: string;
  fechaInicio: string;
  fechaFin: string;
  estadoPractica: EstadoPractica;
  certificado?: PracticanteCertificado | null;
}

/**
 * Cuerpo de POST/PUT /api/practicantes.
 * - `nombreCompleto` / `correo`: solo al crear cuando el DNI no existía en el
 *   padrón (persona nueva); si ya existe, el backend los ignora.
 * - `idInstitucion`: cuando se eligió una institución del catálogo.
 * - `nombreInstitucion` (+ `pais` / `tipo` opcionales): cuando es una
 *   institución nueva que el backend debe registrar.
 */
export interface PracticantePayload {
  dni: string;
  nombreCompleto?: string;
  correo?: string;
  idInstitucion?: number;
  nombreInstitucion?: string;
  pais?: string;
  tipo?: string;
  carrera: string;
  area?: string;
  jefeSupervisor?: string;
  fechaInicio: string;
  fechaFin: string;
}
