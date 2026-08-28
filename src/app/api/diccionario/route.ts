import { NextResponse } from "next/server";
import { buscarDiccionario } from "@/lib/contenido";

/** Diccionario interno: se consulta al seleccionar texto japonés. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ resultados: [] });
  return NextResponse.json({ resultados: buscarDiccionario(q) });
}
