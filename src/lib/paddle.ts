import "server-only";
import crypto from "node:crypto";

/**
 * Pasarela de pago.
 *
 * Se cobra en la web, nunca dentro de la app de las tiendas: así Apple y
 * Google no se llevan su comisión. Ver docs/TIENDAS.md.
 *
 * Paddle actúa como merchant of record, o sea que el IVA de la UE, de UK y de
 * Japón lo declara y lo paga Paddle, no nosotros. Ese es el motivo de
 * elegirlo por encima de cobrar con tarjeta directamente.
 *
 * Ninguna de estas variables lleva el prefijo NEXT_PUBLIC_ a propósito: el
 * Dockerfile no pasa variables al `npm run build`, así que una NEXT_PUBLIC_
 * quedaría vacía en el paquete del navegador. Las tres que el navegador
 * necesita se leen aquí, en el servidor, y bajan como props.
 */

export const ENTORNO = process.env.PADDLE_ENTORNO === "production" ? "production" : "sandbox";
const API = ENTORNO === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

/** Lo que el navegador necesita para abrir la ventana de pago. */
export function ajustesNavegador() {
  const token = process.env.PADDLE_TOKEN ?? "";
  const precio = process.env.PADDLE_PRECIO ?? "";
  return { token, precio, entorno: ENTORNO, listo: Boolean(token && precio) };
}

export function hayPasarela(): boolean {
  return Boolean(process.env.PADDLE_API_KEY && process.env.PADDLE_TOKEN && process.env.PADDLE_PRECIO);
}

/**
 * Comprueba la firma de un aviso.
 *
 * La cabecera llega como `ts=1234;h1=abcd…` y lo que se firma es
 * `${ts}:${cuerpo crudo}` con HMAC-SHA256. El cuerpo tiene que ser el texto
 * exacto que llegó: si se parsea y se vuelve a serializar, la firma no cuadra.
 */
export function firmaValida(cabecera: string | null, crudo: string): boolean {
  const secreto = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secreto || !cabecera) return false;

  const partes = Object.fromEntries(
    cabecera.split(";").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const ts = partes.ts, h1 = partes.h1;
  if (!ts || !h1) return false;

  // Un aviso muy viejo es un reenvío grabado por alguien: se descarta. Cinco
  // minutos, no cinco segundos, porque el contenedor puede estar arrancando.
  const edad = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(edad) || edad > 300) return false;

  const mio = crypto.createHmac("sha256", secreto).update(`${ts}:${crudo}`).digest("hex");
  const a = Buffer.from(mio, "utf8");
  const b = Buffer.from(h1, "utf8");
  // timingSafeEqual exige la misma longitud; si no lo son, ya es un no.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function llamar(ruta: string, init?: RequestInit) {
  const clave = process.env.PADDLE_API_KEY;
  if (!clave) throw new Error("falta PADDLE_API_KEY");
  const r = await fetch(`${API}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${clave}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`paddle ${ruta}: ${r.status} ${await r.text()}`);
  return r.json();
}

type Portal = {
  data: {
    urls: {
      general: { overview: string };
      subscriptions: { id: string; cancel_subscription: string;
                       update_subscription_payment_method: string }[];
    };
  };
};

/**
 * Enlaces al portal del cliente: gestionar el pago y cancelar.
 *
 * Los enlaces llevan un token temporal, así que se piden en el momento y no
 * se guardan en ningún sitio.
 */
export async function portal(clienteId: string, suscripcionId?: string | null) {
  const cuerpo = suscripcionId ? { subscription_ids: [suscripcionId] } : {};
  const j = (await llamar(`/customers/${clienteId}/portal-sessions`, {
    method: "POST", body: JSON.stringify(cuerpo),
  })) as Portal;
  const suya = j.data.urls.subscriptions.find((s) => s.id === suscripcionId)
            ?? j.data.urls.subscriptions[0];
  return {
    general: j.data.urls.general.overview,
    cancelar: suya?.cancel_subscription ?? null,
    cambiarPago: suya?.update_subscription_payment_method ?? null,
  };
}

type Precio = {
  data: {
    unit_price: { amount: string; currency_code: string };
    billing_cycle: { interval: string; frequency: number } | null;
  };
};

/**
 * El precio, tal como está puesto en Paddle.
 *
 * Se lee de allí en vez de escribirlo aquí a mano para que no puedan
 * desacordarse: si algún día se sube el precio, se cambia en un sitio y la
 * página lo refleja. `amount` viene en la unidad más pequeña de la moneda
 * (7900 = 79,00 MXN) y como cadena, no como número.
 *
 * Se cachea una hora: el precio no cambia a diario y no tiene sentido llamar
 * a Paddle en cada visita.
 */
/**
 * Lo que cuesta, mientras Paddle no lo diga.
 *
 * Paddle no verifica el dominio si al entrar en la página de suscripción no
 * encuentra una cifra, y esa página no puede consultar la API hasta que las
 * credenciales existan — que es justo lo que no se tiene todavía. Así que
 * mientras tanto se enseña el precio acordado, que además es el que dicen los
 * términos y el que se declaró en la solicitud.
 *
 * En cuanto PADDLE_PRECIO y PADDLE_API_KEY estén puestas, manda Paddle y esto
 * deja de usarse. Si algún día se sube el precio, se cambia en Paddle y aquí
 * sólo hay que acordarse de tocar este número si se vuelve a quedar sin
 * credenciales.
 */
const PRECIO_ANUNCIADO = { cantidad: 79, moneda: "MXN", intervalo: "month" };

function formatear(cantidad: number, moneda: string, idioma: "es" | "en") {
  return new Intl.NumberFormat(idioma === "es" ? "es-MX" : "en-US", {
    style: "currency", currency: moneda, maximumFractionDigits: 0,
  }).format(cantidad);
}

export async function precio(idioma: "es" | "en" = "es") {
  const id = process.env.PADDLE_PRECIO;
  const clave = process.env.PADDLE_API_KEY;
  if (!id || !clave) {
    return {
      texto: formatear(PRECIO_ANUNCIADO.cantidad, PRECIO_ANUNCIADO.moneda, idioma),
      intervalo: PRECIO_ANUNCIADO.intervalo,
    };
  }
  try {
    const r = await fetch(`${API}/prices/${id}`, {
      headers: { Authorization: `Bearer ${clave}` },
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as Precio;
    const cantidad = Number(j.data.unit_price.amount) / 100;
    const moneda = j.data.unit_price.currency_code;
    return {
      texto: formatear(cantidad, moneda, idioma),
      intervalo: j.data.billing_cycle?.interval ?? null,
    };
  } catch {
    // Si Paddle no contesta, mejor el precio anunciado que un hueco: la página
    // sin cifra es la que hace que rechacen la verificación del dominio.
    return {
      texto: formatear(PRECIO_ANUNCIADO.cantidad, PRECIO_ANUNCIADO.moneda, idioma),
      intervalo: PRECIO_ANUNCIADO.intervalo,
    };
  }
}
