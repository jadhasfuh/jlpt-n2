"use client";

/**
 * Avisos del navegador: «tienes 23 palabras esperando».
 *
 * El permiso se pide UNA vez en la vida del navegador. Si el usuario dice que
 * no, no hay forma de volver a preguntar —ni recargando, ni borrando nada—,
 * así que no se pide al entrar: se ofrece cuando ya ha terminado un repaso y
 * sabe para qué sirve.
 *
 * La suscripción es por aparato, no por cuenta: el mismo perfil puede tener el
 * móvil y el portátil, y cada uno con su hora.
 */

export type EstadoAvisos = "no-soportado" | "sin-permiso" | "denegado" | "activo";

export function soporta(): boolean {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export async function estado(): Promise<EstadoAvisos> {
  if (!soporta()) return "no-soportado";
  if (Notification.permission === "denied") return "denegado";
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sus = await reg?.pushManager.getSubscription().catch(() => null);
  if (sus) return "activo";
  return "sin-permiso";
}

/** La clave pública de VAPID viaja en base64url y el navegador la quiere en bytes. */
function aBytes(base64url: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const b64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(b64);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

/**
 * La hora local que elige el usuario, pasada a UTC.
 *
 * Se guarda ya convertida para que el cron sólo tenga que mirar su propio
 * reloj: sin husos horarios en el servidor, que es donde siempre se rompen.
 * Se recalcula cada vez que se cambia la hora, así que un viaje o el cambio de
 * hora se arreglan solos la próxima vez que se toque el ajuste.
 */
export function aHoraUtc(horaLocal: number): number {
  const d = new Date();
  d.setHours(horaLocal, 0, 0, 0);
  return d.getUTCHours();
}

export async function activar(perfil: string, horaLocal: number, idioma = "es"): Promise<EstadoAvisos> {
  if (!soporta()) return "no-soportado";
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return permiso === "denied" ? "denegado" : "sin-permiso";

  const reg = await navigator.serviceWorker.ready;
  const clave = document.documentElement.dataset.vapid;
  if (!clave) return "no-soportado";

  const sus = await reg.pushManager.getSubscription()
    ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: aBytes(clave) as BufferSource,
    });

  const j = sus.toJSON();
  await fetch("/api/avisos/suscribir", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      perfil,
      endpoint: sus.endpoint,
      p256dh: j.keys?.p256dh,
      auth: j.keys?.auth,
      horaUtc: aHoraUtc(horaLocal),
      idioma,
    }),
  });
  return "activo";
}

export async function desactivar(): Promise<EstadoAvisos> {
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sus = await reg?.pushManager.getSubscription().catch(() => null);
  if (sus) {
    await fetch("/api/avisos/suscribir", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sus.endpoint }),
    }).catch(() => {});
    await sus.unsubscribe().catch(() => {});
  }
  return "sin-permiso";
}

/** Cambiar la hora sin volver a pedir permiso. */
export async function cambiarHora(horaLocal: number) {
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sus = await reg?.pushManager.getSubscription().catch(() => null);
  if (!sus) return;
  await fetch("/api/avisos/suscribir", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: sus.endpoint, horaUtc: aHoraUtc(horaLocal) }),
  }).catch(() => {});
}
