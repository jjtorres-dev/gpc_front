/**
 * Utilidades de descarga de archivos a partir de respuestas `Blob` del backend.
 * Centralizan el patrón del `<a>` temporal + object URL (evita los bloqueadores
 * de pop-ups) para no repetir la lógica en cada servicio.
 */

/**
 * Abre un blob en una pestaña nueva mediante un `<a target="_blank">` temporal.
 * Pensado para PDFs que se visualizan en el navegador (p. ej. certificados).
 */
export function abrirBlobEnPestana(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se revoca luego para dar tiempo a que la pestaña cargue el blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Fuerza la descarga de un blob como archivo con el nombre indicado, mediante
 * un `<a download>` temporal. Pensado para exportaciones (CSV / PDF de reportes).
 */
export function descargarBlobComoArchivo(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
