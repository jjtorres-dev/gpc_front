import { Area } from './area.model';

export type TipoActividad = 'Capacitación' | 'Reconocimiento';
export type EstadoActividad = 'Activa' | 'Cerrada';

export interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: TipoActividad;
  fechaInicio: string;
  fechaFin: string;
  sede?: string;
  area: Area | null;
  estado: EstadoActividad;
}

export interface ActividadFiltros {
  tipo?: TipoActividad;
  estado?: EstadoActividad;
  fechaInicio?: string;
  areaId?: number;
  page?: number;
}

export interface ActividadPayload {
  nombre: string;
  descripcion?: string;
  tipo: TipoActividad;
  fechaInicio: string;
  fechaFin: string;
  sede?: string;
  idArea: number;
}
