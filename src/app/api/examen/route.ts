import { NextResponse } from "next/server";
import { armarExamen } from "@/lib/banco";
import type { Ajuste } from "@/lib/examen";

/** Arma un mini examen. `vistos` va de lo más reciente a lo más antiguo. */
export async function POST(req: Request) {
  const cuerpo = (await req.json()) as { ajuste: Ajuste; vistos?: string[] };
  const items = await armarExamen(cuerpo.ajuste, (cuerpo.vistos ?? []).slice(0, 800));
  return NextResponse.json({ items });
}
