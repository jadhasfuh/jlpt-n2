import "server-only";
import { alDia, perfil } from "./sesion";
import { esLibre } from "./acceso";

/**
 * La puerta de acceso, del lado que manda.
 *
 * El candado de la lista de secciones es un dibujo: quien teclee la URL de la
 * unidad entra igual. Mientras todo es gratis da lo mismo, pero el día que se
 * cobre, un muro que sólo existe en el navegador no es un muro. Estas dos
 * funciones son las que deciden de verdad, y se llaman desde las páginas y
 * desde las rutas de API.
 *
 * La variable NO lleva prefijo NEXT_PUBLIC_ a propósito: el Dockerfile no pasa
 * variables al `npm run build`, así que una NEXT_PUBLIC_ llegaría vacía al
 * navegador y el interruptor no haría nada. Es el mismo fallo que tuvimos con
 * el sitemap; aquí habría sido peor, porque el día del lanzamiento parecería
 * que se ha cerrado el acceso cuando en realidad sigue abierto.
 */
export function accesoAbierto(): boolean {
  const v = process.env.ACCESO_ABIERTO ?? process.env.NEXT_PUBLIC_ACCESO_ABIERTO;
  return v !== "0";
}

/** ¿Puede esta persona abrir esta sección? */
export async function puedeVer(seccion: string): Promise<boolean> {
  if (accesoAbierto()) return true;
  if (esLibre(seccion)) return true;
  return alDia(await perfil());
}

/** Para lo que no cuelga de una sección (el examen, por ejemplo). */
export async function puedeVerTodo(): Promise<boolean> {
  if (accesoAbierto()) return true;
  return alDia(await perfil());
}
