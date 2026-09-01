import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { usuario } from "@/lib/sesion";

const TIPOS = ["vocabulario", "gramatica", "lectura", "item"] as const;
const MOTIVOS = ["traduccion", "lectura", "ejemplo", "otro"] as const;

type Cuerpo = {
  tipo?: string; ref?: string; visto?: string; idioma?: string;
  motivo?: string; sugerencia?: string;
};

const recorta = (s: unknown, n: number) =>
  typeof s === "string" && s.trim() ? s.trim().slice(0, n) : null;

/**
 * Un usuario avisa de que una traducción o un dato está mal.
 *
 * Se inserta desde el servidor con la llave secreta y la tabla no tiene
 * políticas RLS: así nadie puede leer los avisos ajenos ni escribir saltándose
 * esta validación. Funciona sin cuenta a propósito — quien encuentra el error
 * suele ser alguien que aún no se ha registrado, y pedirle que lo haga es la
 * mejor forma de no enterarse nunca.
 */
export async function POST(req: Request) {
  let c: Cuerpo;
  try {
    c = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo ilegible" }, { status: 400 });
  }

  const tipo = TIPOS.find((t) => t === c.tipo);
  const motivo = MOTIVOS.find((m) => m === c.motivo);
  const ref = recorta(c.ref, 120);
  if (!tipo || !motivo || !ref) {
    return NextResponse.json({ error: "faltan datos" }, { status: 400 });
  }

  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });

  const u = await usuario();

  // Un mismo aviso repetido no aporta nada y ensucia la lista de pendientes.
  // Con cuenta se puede comprobar; sin ella se acepta, porque el coste de un
  // duplicado es menor que el de perder un aviso legítimo.
  if (u) {
    const { data: ya } = await sb.from("reportes")
      .select("id").eq("tipo", tipo).eq("ref", ref).eq("perfil", u.id)
      .eq("estado", "abierto").limit(1);
    if (ya?.length) return NextResponse.json({ ok: true, repetido: true });
  }

  const { error } = await sb.from("reportes").insert({
    tipo, ref, motivo,
    visto: recorta(c.visto, 300),
    idioma: c.idioma === "en" ? "en" : "es",
    sugerencia: recorta(c.sugerencia, 300),
    perfil: u?.id ?? null,
  });
  if (error) {
    console.error("reporte:", error.message);
    return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
