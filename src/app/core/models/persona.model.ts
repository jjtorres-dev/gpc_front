/** Persona registrada en el padrón (puede o no estar inscrita en una actividad). */
export interface Persona {
  id: number;
  dni: string;
  nombreCompleto: string;
  correo?: string;
}
