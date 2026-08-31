import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase";

/** Cuántas preguntas hay por nivel y tipo: la pantalla de ajustes lo enseña
 *  para que nadie pida un examen de 15 minutos de algo que tiene 2 preguntas. */
export async function GET() {
  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ inventario: {} });
  const { data } = await sb.from("items").select("nivel, tipo");
  const inv: Record<string, Record<string, number>> = {};
  for (const r of (data ?? []) as { nivel: string; tipo: string }[]) {
    (inv[r.nivel] ??= {})[r.tipo] = ((inv[r.nivel] ?? {})[r.tipo] ?? 0) + 1;
  }
  return NextResponse.json({ inventario: inv });
}
