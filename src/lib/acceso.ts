import type { Nivel } from "./tipos";

/**
 * Qué se puede usar sin pagar.
 *
 * Las tiendas (Google Play sobre todo) exigen que la app sea usable sin
 * registrarse. La regla: **la primera sección de cada nivel es libre**, y para
 * el resto hará falta suscripción.
 *
 * Aquí sólo queda lo que no depende del entorno, porque este módulo lo importa
 * también el navegador. Quién puede ver qué lo decide `acceso-servidor.ts`: el
 * interruptor vive en una variable sin prefijo NEXT_PUBLIC_, que el Dockerfile
 * no pasa al build y por tanto nunca llegaría hasta aquí con su valor real.
 */
export const SECCION_LIBRE = "hito";   // 人と体 — la primera de cada nivel

export function esLibre(seccion: string): boolean {
  return seccion === SECCION_LIBRE;
}

/**
 * Cuántos capítulos del libro se leen sin pagar.
 *
 * El libro no se puede cerrar por secciones como el curso: va en orden
 * cronológico, así que el capítulo 1 cae en `basho` y quedaba bloqueado, que
 * es justo al revés de lo que interesa. Lo que engancha es el principio de la
 * historia, así que lo que se abre son los cinco primeros CAPÍTULOS, vaya cada
 * uno a la sección que vaya.
 */
export const CAPITULOS_LIBRES = 5;

export function capituloLibre(n: number): boolean {
  return n < CAPITULOS_LIBRES;
}

export function nivelesConMuestra(): Nivel[] {
  return ["N5", "N4", "N3", "N2", "N1"];
}
