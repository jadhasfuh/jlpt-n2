// Service worker de jlptest.
//
// Objetivo modesto y honesto: que la app abra y se pueda seguir estudiando en
// el metro. No intenta ser una base de datos sin conexión; guarda el caparazón
// y lo que ya se ha visitado, que es lo que de verdad se repasa.
//
// Estrategias:
//   · estáticos de Next (/_next/static) → cache primero: llevan hash, nunca cambian.
//   · páginas y API → red primero, y si no hay red, lo último que se guardó.
//   · fuentes de Google → cache primero: el japonés sin fuente es ilegible.

const VERSION = "v2";   // v2: avisos
const CAPARAZON = `jlptest-shell-${VERSION}`;
const PAGINAS = `jlptest-pag-${VERSION}`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CAPARAZON).then((c) => c.addAll(["/", "/manifest.webmanifest"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((llaves) =>
      Promise.all(llaves.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const cachePrimero = async (req, almacen) => {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(almacen)).put(req, res.clone());
  return res;
};

const redPrimero = async (req, almacen) => {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(almacen)).put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req);
    if (hit) return hit;
    throw err;
  }
};

// ------------------------------------------------------------------ avisos
//
// El aviso llega con su texto ya hecho desde el servidor: el service worker no
// sabe cuántas palabras te tocan ni tiene por qué saberlo.
self.addEventListener("push", (e) => {
  let d = { titulo: "jlptest", cuerpo: "Tienes repaso esperando.", url: "/repaso" };
  try { if (e.data) d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(d.titulo, {
      body: d.cuerpo,
      icon: "/icono/192",
      badge: "/icono/192",
      lang: d.idioma || "es",
      // Una sola notificación viva por tipo: si no se abrió la de ayer, la de
      // hoy la sustituye en vez de amontonarse en la bandeja.
      tag: d.tipo || "repaso",
      renotify: true,
      data: { url: d.url || "/repaso" },
    })
  );
});

// Al tocarla: si la app ya está abierta en alguna pestaña, se usa esa; abrir
// una segunda copia de la misma app es de las cosas que más molestan.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = e.notification.data?.url || "/repaso";
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of abiertas) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        if ("navigate" in c) await c.navigate(destino);
        return;
      }
    }
    await self.clients.openWindow(destino);
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // La sesión no se guarda nunca: un token en caché es un token que sobrevive
  // al cierre de sesión.
  if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/entrar")) return;

  if (url.origin === location.origin && url.pathname.startsWith("/_next/static")) {
    e.respondWith(cachePrimero(req, CAPARAZON));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cachePrimero(req, CAPARAZON));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(redPrimero(req, PAGINAS));
  }
});
