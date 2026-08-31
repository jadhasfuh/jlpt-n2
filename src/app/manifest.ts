import type { MetadataRoute } from "next";

/**
 * El manifiesto es lo que convierte la web en algo instalable: Android ofrece
 * «añadir a la pantalla de inicio» y arranca sin barra del navegador. También
 * es el punto de partida de la TWA con la que se sube a Google Play.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "jlptest — japonés del N5 al N1",
    short_name: "jlptest",
    description:
      "Vocabulario, kanji, gramática y mini exámenes del JLPT, del N5 al N1.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#161826",
    theme_color: "#161826",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
