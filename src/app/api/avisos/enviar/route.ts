import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseServidor } from "@/lib/supabase-servidor";

/**
 * El cron de los avisos. Se llama una vez por hora desde Railway.
 *
 * Cada aparato guarda a qué hora UTC quiere que le avisen, así que esto sólo
 * mira su propio reloj y pregunta a la base quién toca ahora y con cuántas
 * palabras. Sin husos horarios en el servidor, que es donde siempre se rompen.
 *
 * Un aviso por aparato y día como mucho: `ultimo_aviso` lo garantiza aunque el
 * cron se dispare dos veces, y aunque Railway reintente.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";      // web-push firma con crypto de Node

const TEXTO = {
  es: (n: number) => ({
    titulo: n === 1 ? "1 palabra te espera" : `${n} palabras te esperan`,
    cuerpo: "Un repaso corto ahora vale por media hora la semana que viene.",
  }),
  en: (n: number) => ({
    titulo: n === 1 ? "1 word is waiting" : `${n} words are waiting`,
    cuerpo: "A short review now is worth half an hour next week.",
  }),
};

export async function POST(req: Request) {
  const secreto = process.env.AVISOS_SECRETO;
  const dado = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
            ?? new URL(req.url).searchParams.get("clave");
  if (!secreto || dado !== secreto) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLICA;
  const privada = process.env.VAPID_PRIVADA;
  const contacto = process.env.VAPID_CONTACTO || "mailto:adriancar75@hotmail.com";
  const sb = supabaseServidor();
  if (!publica || !privada || !sb) {
    return NextResponse.json({ error: "sin configurar" }, { status: 500 });
  }
  webpush.setVapidDetails(contacto, publica, privada);

  const hora = new Date().getUTCHours();
  const { data, error } = await sb.rpc("avisos_pendientes", {
    hora, ahora_ms: Date.now(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filas = (data ?? []) as {
    endpoint: string; p256dh: string; auth: string; idioma: string; vencidas: number;
  }[];

  let enviados = 0;
  const caducados: string[] = [];
  const avisados: string[] = [];
  const fallos: Record<string, number> = {};

  for (const f of filas) {
    const t = (TEXTO[f.idioma as "es" | "en"] ?? TEXTO.es)(Number(f.vencidas));
    try {
      await webpush.sendNotification(
        { endpoint: f.endpoint, keys: { p256dh: f.p256dh, auth: f.auth } },
        JSON.stringify({ ...t, url: "/repaso", tipo: "repaso", idioma: f.idioma }),
        { TTL: 6 * 3600 },   // si el móvil está apagado más de seis horas, ya no vale
      );
      enviados++;
      avisados.push(f.endpoint);
    } catch (e) {
      // 404 y 410 significan que ese aparato ya no existe: desinstaló la app,
      // borró los datos del sitio o revocó el permiso. Guardarlo para siempre
      // sólo sirve para reintentar contra una pared.
      const codigo = (e as { statusCode?: number }).statusCode ?? 0;
      fallos[codigo] = (fallos[codigo] ?? 0) + 1;
      if (codigo === 404 || codigo === 410) caducados.push(f.endpoint);
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);
  if (avisados.length) {
    await sb.from("suscripciones_push").update({ ultimo_aviso: hoy }).in("endpoint", avisados);
  }
  if (caducados.length) {
    await sb.from("suscripciones_push").delete().in("endpoint", caducados);
  }

  return NextResponse.json({
    hora, candidatos: filas.length, enviados, caducados: caducados.length,
    // Los códigos de los que fallaron, para poder mirar el log del cron y
    // saber si es un aparato muerto (404/410) o algo nuestro (401/403).
    fallos,
  });
}
