import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase-servidor";

/**
 * Alta, baja y cambio de hora de un aparato en los avisos.
 *
 * No pide sesión a propósito: el avance se guarda por `perfil`, que existe
 * también sin cuenta, y quien estudia sin registrarse merece que le avisen
 * igual. Lo único que se guarda es el endpoint que da el navegador —una URL
 * opaca del servicio de push— y sus dos claves, que sin el endpoint no sirven
 * para nada.
 */
export const dynamic = "force-dynamic";

type Alta = {
  perfil?: string; endpoint?: string; p256dh?: string; auth?: string;
  horaUtc?: number; idioma?: string;
};

export async function POST(req: Request) {
  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });

  const b = (await req.json().catch(() => ({}))) as Alta;
  if (!b.perfil || !b.endpoint || !b.p256dh || !b.auth) {
    return NextResponse.json({ error: "faltan datos" }, { status: 400 });
  }
  const hora = Number.isInteger(b.horaUtc) && b.horaUtc! >= 0 && b.horaUtc! <= 23 ? b.horaUtc! : 12;

  const { error } = await sb.from("suscripciones_push").upsert(
    {
      endpoint: b.endpoint, perfil: b.perfil,
      p256dh: b.p256dh, auth: b.auth, hora_utc: hora,
      idioma: b.idioma === "en" ? "en" : "es",
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });
  const b = (await req.json().catch(() => ({}))) as Alta;
  if (!b.endpoint) return NextResponse.json({ error: "faltan datos" }, { status: 400 });
  const hora = Number.isInteger(b.horaUtc) && b.horaUtc! >= 0 && b.horaUtc! <= 23 ? b.horaUtc! : 12;
  await sb.from("suscripciones_push").update({ hora_utc: hora }).eq("endpoint", b.endpoint);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });
  const b = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!b.endpoint) return NextResponse.json({ error: "faltan datos" }, { status: 400 });
  await sb.from("suscripciones_push").delete().eq("endpoint", b.endpoint);
  return NextResponse.json({ ok: true });
}
