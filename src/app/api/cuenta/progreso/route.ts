import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { usuario } from "@/lib/sesion";

/**
 * Borrar el avance de estudio sin borrar la cuenta.
 *
 * El botón «Borrar mi avance» sólo vaciaba el almacenamiento del navegador.
 * Para quien no tiene cuenta eso es todo lo que hay; pero con sesión abierta,
 * la copia de la nube sobrevivía y volvía entera en la siguiente sincronización.
 * O sea que el botón decía una cosa y hacía otra.
 *
 * Aquí se borra el lado del servidor: el progreso y los resultados. La cuenta,
 * el correo y la suscripción se quedan como estaban.
 */
export async function POST() {
  const u = await usuario();
  if (!u) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !secreta) return NextResponse.json({ error: "sin base" }, { status: 500 });

  const admin = createClient(url, secreta, { auth: { persistSession: false } });
  const { error } = await admin.from("progreso").delete().eq("perfil", u.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("resultados").delete().eq("perfil", u.id);

  return NextResponse.json({ ok: true });
}
