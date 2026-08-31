import { NextResponse } from "next/server";
import { perfil } from "@/lib/sesion";
import { portal } from "@/lib/paddle";

/**
 * Devuelve los enlaces del portal del cliente: cancelar y cambiar la tarjeta.
 *
 * Se generan en el momento porque llevan un token temporal. Y se piden desde
 * el servidor con la sesión ya comprobada: así nadie puede pedir el portal de
 * otra persona pasando un id de cliente ajeno.
 */
export async function POST() {
  const p = await perfil();
  if (!p) return NextResponse.json({ error: "sin sesión" }, { status: 401 });

  const cliente = (p as { cliente_pago?: string | null }).cliente_pago;
  if (!cliente) return NextResponse.json({ error: "sin suscripción" }, { status: 404 });

  try {
    const enlaces = await portal(cliente, (p as { suscripcion_id?: string | null }).suscripcion_id);
    return NextResponse.json(enlaces);
  } catch (e) {
    console.error("portal de pago:", e);
    return NextResponse.json({ error: "no se pudo abrir el portal" }, { status: 502 });
  }
}
