/**
 * De dónde se sirve la app. Hace falta para las URL absolutas de Open Graph,
 * del sitemap y del robots.txt: sin base, Next las deja relativas y quien
 * comparta un enlace en WhatsApp no ve la tarjeta.
 *
 * En Railway se pone `NEXT_PUBLIC_SITIO=https://…`. Mientras no haya dominio
 * propio, Railway inyecta el suyo en `RAILWAY_PUBLIC_DOMAIN`.
 */
export const SITIO =
  process.env.NEXT_PUBLIC_SITIO?.replace(/\/$/, "") ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "") ||
  "http://localhost:3000";
