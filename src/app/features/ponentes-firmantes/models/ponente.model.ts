/** Ponente que participa como expositor en una actividad. */
export interface Ponente {
  id: number;
  nombreCompleto: string;
  dni?: string;
  institucion?: string;
  cargo?: string;
  especialidad?: string;
}

/** Cuerpo de POST /api/ponentes y PUT /api/ponentes/:id. */
export interface PonentePayload {
  nombreCompleto: string;
  dni?: string;
  institucion?: string;
  cargo?: string;
  especialidad?: string;
}
