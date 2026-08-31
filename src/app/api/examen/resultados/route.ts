import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { usuario } from "@/lib/sesion";

type Linea = { item_id: string; acierto: boolean; segundos?: number | null };

/**
 * Guarda lo contestado en un mini examen.
 *
 * Sin cuenta no hay dónde guardarlo y se responde 204: la rotación sigue
 * viviendo en el localStorage del aparato, que es lo único que hay. Con
 * cuenta, esto es lo que hace que el examen no se repita al cambiar de
 * teléfono, y lo que alimentará el «más de lo que fallas».
 */
export async function POST(req: Request) {
  const u = await usuario();
  if (!u) return new NextResponse(null, { status: 204 });

  const sb = supabaseServidor();
  if (!sb) return new NextResponse(null, { status: 204 });

  let cuerpo: { lineas?: Linea[] };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo ilegible" }, { status: 400 });
  }

  const lineas = (cuerpo.lineas ?? [])
    .filter((l) => l && typeof l.item_id === "string" && typeof l.acierto === "boolean")
    .slice(0, 200)
    .map((l) => ({
      perfil: u.id,
      item_id: l.item_id,
      acierto: l.acierto,
      segundos: typeof l.segundos === "number" && l.segundos >= 0 ? Math.round(l.segundos) : null,
    }));
  if (!lineas.length) return new NextResponse(null, { status: 204 });

  const { error } = await sb.from("resultados").insert(lineas);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
