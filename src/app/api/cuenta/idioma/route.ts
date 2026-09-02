import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { usuario } from "@/lib/sesion";
import { esIdioma } from "@/lib/idioma";

/**
 * Guardar el idioma elegido en la cuenta.
 *
 * La cookie ya lo recuerda en este aparato; esto es para que la preferencia
 * viaje con la cuenta y el móvil no vuelva a abrirse en español porque sí.
 * Sin sesión no hay nada que guardar y se contesta que sí: elegir idioma sin
 * cuenta tiene que seguir funcionando, y la cookie ya se ha puesto.
 */
export async function POST(req: Request) {
  const u = await usuario();
  if (!u) return NextResponse.json({ ok: true, guardado: false });

  let idioma: unknown;
  try { ({ idioma } = await req.json()); } catch { idioma = null; }
  if (!esIdioma(idioma)) {
    return NextResponse.json({ error: "idioma desconocido" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !secreta) return NextResponse.json({ error: "sin base" }, { status: 500 });

  const admin = createClient(url, secreta, { auth: { persistSession: false } });
  const { error } = await admin.from("perfiles").update({ idioma }).eq("id", u.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, guardado: true });
}
