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
    // Lleva `?app=1` para que el middleware sepa que la visita viene de la
    // app instalada y esconda todo lo de suscripción: Play no permite llevar a
    // pagar fuera de su facturación.
    start_url: "/?app=1",
    display: "standalone",
    orientation: "portrait",
    background_color: "#161826",
    theme_color: "#161826",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      // Los dos que Play exige, más el enmascarable para que Android no
      // recorte el disco rojo al aplicarle su forma.
      { src: "/icono/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
