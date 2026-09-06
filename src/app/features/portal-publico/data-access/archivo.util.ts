/**
 * Helpers para manejar el PDF que devuelven los endpoints públicos como blob.
 * Se usan desde un <a> temporal con un object URL (mismo patrón que el panel
 * de certificados interno) para evitar los bloqueadores de pop-ups.
 */

/** Abre el PDF en una pestaña nueva. */
export function abrirBlobEnPestana(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Fuerza la descarga del PDF con el nombre de archivo indicado. */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
