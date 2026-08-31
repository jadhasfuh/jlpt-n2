import "server-only";
import { cookies, headers } from "next/headers";
import { COOKIE_IDIOMA, esIdioma, idiomaDeCabecera, type Idioma } from "./idioma";

/**
 * El idioma de esta petición: lo que el usuario eligió si ya eligió, y si no
 * lo que pide su navegador. Se resuelve en el servidor para que la página
 * llegue ya en su idioma, sin el parpadeo de traducirla después de pintarla.
 */
export async function idiomaActual(): Promise<Idioma> {
  const elegido = (await cookies()).get(COOKIE_IDIOMA)?.value;
  if (esIdioma(elegido)) return elegido;
  return idiomaDeCabecera((await headers()).get("accept-language"));
}
