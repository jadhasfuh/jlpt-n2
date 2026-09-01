import { NextResponse } from "next/server";
import { palabras } from "@/lib/contenido";
import { esLibre } from "@/lib/acceso";
import { puedeVerTodo } from "@/lib/acceso-servidor";

/**
 * Devuelve palabras por id (lo usa el repaso, que sólo guarda ids en el
 * navegador).
 *
 * Comprueba el muro. Antes no lo hacía: pedía cualquier id y devolvía la
 * palabra con su significado, así que con cuarenta y una peticiones de
 * doscientos ids se sacaba el catálogo entero sin pagar. El tope de doscientos
 * limita el ruido, no el acceso.
 *
 * Sin suscripción sólo salen las de la sección libre, que es la misma regla
 * que aplican las páginas.
 */
export async function GET(req: Request) {
  const bruto = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = bruto.split(",").map(Number).filter((n) => Number.isInteger(n)).slice(0, 200);
  const todo = await puedeVerTodo();
  const lista = palabras(ids).filter((p) => todo || esLibre(p.seccion));
  return NextResponse.json({ palabras: lista });
}
