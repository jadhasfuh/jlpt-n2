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
