import { NextResponse } from "next/server";
import { firmaValida } from "@/lib/paddle";
import { supabaseServidor } from "@/lib/supabase-servidor";

/** El cuerpo tiene que llegar crudo: parsearlo antes rompería la firma. */
export const dynamic = "force-dynamic";

type Evento = {
  event_id: string;
  event_type: string;
  data: {
    id?: string;
    status?: string;
    customer_id?: string;
    current_billing_period?: { ends_at?: string } | null;
    scheduled_change?: { action?: string; effective_at?: string } | null;
    custom_data?: { perfil?: string } | null;
  };
};

/** Cómo se traduce el estado de Paddle al nuestro. */
function membresiaDe(estado: string | undefined, cancelaPrevista: boolean) {
  if (estado === "active" || estado === "trialing") return cancelaPrevista ? "cancelada" : "activa";
  if (estado === "past_due" || estado === "paused") return "activa";  // aún no se corta el acceso
  if (estado === "canceled") return "caducada";
  return "libre";
}

export async function POST(req: Request) {
  const crudo = await req.text();
  if (!firmaValida(req.headers.get("paddle-signature"), crudo)) {
    // 401 y no 400: que Paddle no lo reintente eternamente si el secreto está mal.
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let ev: Evento;
  try { ev = JSON.parse(crudo); } catch { return NextResponse.json({ error: "json" }, { status: 400 }); }

  const sb = supabaseServidor();
  if (!sb) return NextResponse.json({ error: "sin base" }, { status: 500 });

  // Paddle reintenta lo que no respondió 200. Insertar primero con el event_id
  // como clave primaria hace de cerrojo: si ya estaba, es un reenvío y se sale.
  const { error: repetido } = await sb.from("eventos_pago").insert({
    id: ev.event_id, tipo: ev.event_type,
    perfil: ev.data.custom_data?.perfil ?? null, cuerpo: ev as unknown as object,
  });
  if (repetido) {
    if (repetido.code === "23505") return NextResponse.json({ ok: true, repetido: true });
    return NextResponse.json({ error: repetido.message }, { status: 500 });
  }

  if (!ev.event_type.startsWith("subscription.")) return NextResponse.json({ ok: true });

  const d = ev.data;
  const cancelaPrevista = d.scheduled_change?.action === "cancel";
  const campos = {
    membresia: membresiaDe(d.status, cancelaPrevista),
    vence_en: d.scheduled_change?.effective_at
           ?? d.current_billing_period?.ends_at
           ?? null,
    origen: "web" as const,
    cliente_pago: d.customer_id ?? null,
    suscripcion_id: d.id ?? null,
    actualizado: new Date().toISOString(),
  };

  // A quién. El id del perfil viaja en custom_data desde la ventana de pago;
  // en los avisos posteriores puede no venir, y entonces se busca por la
  // suscripción o por el cliente, que sí quedaron guardados la primera vez.
  const perfilId = d.custom_data?.perfil;
  const q = sb.from("perfiles").update(campos);
  const { error } = perfilId
    ? await q.eq("id", perfilId)
    : d.id ? await q.eq("suscripcion_id", d.id)
    : d.customer_id ? await q.eq("cliente_pago", d.customer_id)
    : { error: new Error("aviso sin forma de identificar al perfil") };

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
