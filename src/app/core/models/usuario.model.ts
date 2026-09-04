export type Rol = 'Administrador' | 'Digitador' | 'Gerencial';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}
