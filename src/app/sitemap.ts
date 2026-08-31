import type { MetadataRoute } from "next";
import { NIVELES } from "@/lib/tipos";
import { sitio } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * Sólo las páginas que tienen sentido en un buscador: la portada, cada nivel
 * con sus dos índices y las legales. Las unidades son cientos y no aportan
 * nada suelto, así que se quedan fuera.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const SITIO = sitio();
  const ahora = new Date();
  const raiz = [
    { url: `${SITIO}/`, priority: 1 },
    { url: `${SITIO}/examen`, priority: 0.8 },
    { url: `${SITIO}/repaso`, priority: 0.5 },
    { url: `${SITIO}/legal/terminos`, priority: 0.3 },
    { url: `${SITIO}/legal/privacidad`, priority: 0.3 },
  ];
  const niveles = NIVELES.flatMap((n) => [
    { url: `${SITIO}/n/${n}`, priority: 0.9 },
    { url: `${SITIO}/n/${n}/kanji`, priority: 0.6 },
    { url: `${SITIO}/n/${n}/gramatica`, priority: 0.6 },
  ]);
  return [...raiz, ...niveles].map((p) => ({ ...p, lastModified: ahora, changeFrequency: "weekly" as const }));
}
