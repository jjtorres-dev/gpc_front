/**
 * Firmante autorizado: un usuario del sistema con un certificado digital (.pfx)
 * cargado. La passphrase nunca se expone en el frontend.
 */
export interface Firmante {
  id: number;
  usuario: {
    id: number;
    nombreCompleto: string;
    cargo: string;
  };
  nombreArchivo: string;
  fechaRegistro: string;
}

/** Usuario elegible para convertirse en firmante (GET /api/usuarios/disponibles-firmante). */
export interface UsuarioDisponible {
  id: number;
  nombreCompleto: string;
  rol: string;
}
