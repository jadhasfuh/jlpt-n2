import { NextResponse } from "next/server";
import { buscarDiccionario, buscarLibre } from "@/lib/contenido";

/**
 * Diccionario interno. Sin `libre`, resuelve una selección exacta dentro de un
 * texto; con `libre=1`, la búsqueda que se escribe a mano en la cabecera.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ resultados: [] });
  const libre = url.searchParams.get("libre") === "1";
  return NextResponse.json({ resultados: libre ? buscarLibre(q) : buscarDiccionario(q) });
}
