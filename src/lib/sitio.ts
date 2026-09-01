/**
 * De dónde se sirve la app. Hace falta para las URL absolutas de Open Graph,
 * del sitemap y del robots.txt: sin base, Next las deja relativas y quien
 * comparta un enlace en WhatsApp no ve la tarjeta.
 *
 * Sólo la lee código de servidor, así que el prefijo NEXT_PUBLIC_ no hace
 * falta — se acepta igualmente porque es el nombre que ya está puesto en
 * Railway. Ojo: el Dockerfile no pasa variables al `npm run build`, de modo
 * que esto sólo tiene valor en tiempo de ejecución; por eso robots.ts y
 * sitemap.ts son dinámicos y no se prerrenderizan.
 */
export function sitio(): string {
  return (
    process.env.SITIO_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITIO?.replace(/\/$/, "") ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "") ||
    "http://localhost:3000"
  );
}

/**
 * A dónde devolver al usuario, visto desde fuera.
 *
 * `new URL(req.url).origin` NO sirve: detrás del proxy de Railway la petición
 * llega a la dirección interna del contenedor, así que salía una redirección a
 * https://0.0.0.0:8080 y el navegador se quedaba en blanco. Lo que hay que
 * mirar es la cabecera Host, que es la dirección que el usuario tecleó.
 *
 * El esquema se fuerza a https salvo en local: el proxy habla http con el
 * contenedor, y devolver http provocaría un salto extra o un aviso del
 * navegador.
 */
export function origenPublico(req: Request): string {
  const host = req.headers.get("host");
  if (!host) return sitio();
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${host}`;
}
