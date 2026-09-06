/**
 * Institución educativa. Catálogo transversal (mismo criterio que `Area`): no
 * pertenece a un feature concreto, lo consumen los practicantes y podría
 * consumirlo cualquier otro módulo.
 */
export interface Institucion {
  id: number;
  nombreInstitucion: string;
}
