import type { MetadataRoute } from "next";
import { sitio } from "@/lib/sitio";

// Se calcula en cada petición: el valor del dominio sólo existe al arrancar
// el contenedor, no cuando se construye la imagen.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const SITIO = sitio();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nada que indexar y todo detrás de sesión: sólo gasta rastreo.
      disallow: ["/api/", "/auth/", "/perfil", "/entrar"],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
