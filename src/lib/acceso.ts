import type { Nivel } from "./tipos";

/**
 * Qué se puede usar sin cuenta.
 *
 * Las tiendas (Google Play sobre todo) exigen que la app sea usable sin
 * registrarse. La regla: **la primera sección de cada nivel es libre**, y para
 * el resto hará falta cuenta. Mientras el login no exista, `ACCESO_ABIERTO`
 * deja todo accesible; el día que entre la autenticación se apaga y no hay que
 * tocar nada más. La app de React Native importará este mismo módulo.
 */
export const SECCION_LIBRE = "hito";   // 人と体 — la primera de cada nivel

export const ACCESO_ABIERTO =
  process.env.NEXT_PUBLIC_ACCESO_ABIERTO !== "0";

export function esLibre(seccion: string): boolean {
  return seccion === SECCION_LIBRE;
}

export function puedeEntrar(seccion: string, haySesion: boolean): boolean {
  return ACCESO_ABIERTO || haySesion || esLibre(seccion);
}

/** Para la etiqueta de la tarjeta: "gratis" sólo se muestra si hay candado en otras. */
export function mostrarEtiquetaGratis(seccion: string): boolean {
  return !ACCESO_ABIERTO && esLibre(seccion);
}

export function nivelesConMuestra(): Nivel[] {
  return ["N5", "N4", "N3", "N2", "N1"];
}
