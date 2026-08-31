import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
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
