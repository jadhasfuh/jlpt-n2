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
    // Sólo en los avisos de ajuste (reembolsos y contracargos).
    action?: string;
    type?: string;
    subscription_id?: string | null;
  };
};

/**
 * Un ajuste que tiene que cortar el acceso.
 *
 * Un reembolso no cancela la suscripción en Paddle, y nosotros sólo
 * escuchábamos los avisos `subscription.*`: devolver el dinero dejaba la
 * cuenta con el año entero pagado. Pasó de verdad con la compra de prueba.
 *
 * Sólo se corta con el reembolso ya aprobado, no con el que está esperando
 * respuesta: Paddle puede rechazarlo, y quitarle el acceso a alguien mientras
 * se decide es peor que esperar un día. Los contracargos sí cortan en cuanto
 * aparecen — ahí el dinero ya no está.
 */
function cortaElAcceso(d: Evento["data"]): boolean {
  const a = d.action;
  if (a === "chargeback" || a === "chargeback_warning") return true;
  // Un reembolso parcial no tiene por qué acabar con el acceso: puede ser el
  // ajuste de un cambio de plan.
  return a === "refund" && d.status === "approved" && d.type === "full";
}

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

  const d = ev.data;

  // --- reembolsos y contracargos -----------------------------------------
  if (ev.event_type.startsWith("adjustment.")) {
    if (!cortaElAcceso(d)) return NextResponse.json({ ok: true });
    const corte = {
      membresia: "caducada" as const,
      vence_en: new Date().toISOString(),
      actualizado: new Date().toISOString(),
    };
    // El ajuste no trae custom_data, así que se localiza por la suscripción
    // o, si el reembolso no venía de una, por el cliente.
    const donde = sb.from("perfiles").update(corte);
    const { error: eAjuste } = d.subscription_id
      ? await donde.eq("suscripcion_id", d.subscription_id)
      : d.customer_id ? await donde.eq("cliente_pago", d.customer_id)
      : { error: new Error("ajuste sin suscripción ni cliente") };
    if (eAjuste) return NextResponse.json({ error: String(eAjuste) }, { status: 500 });
    return NextResponse.json({ ok: true, cortado: true });
  }

  if (!ev.event_type.startsWith("subscription.")) return NextResponse.json({ ok: true });
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
