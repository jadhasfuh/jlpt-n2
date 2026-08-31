import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProveedorAjustes } from "@/components/Ajustes";
import { Diccionario } from "@/components/Diccionario";
import { BarraInferior } from "@/components/BarraInferior";
import { Lateral } from "@/components/Lateral";
import { RegistrarSW } from "@/components/RegistrarSW";
import { idiomaActual } from "@/lib/idioma-servidor";
import { sitio } from "@/lib/sitio";

// Inter va autoalojada: el subconjunto latino es pequeño y así no depende de
// Google en tiempo de ejecución. Noto Sans JP no: sus glifos japoneses pesan
// demasiado para meterlos en el build, y Google los sirve troceados por
// unicode-range, de modo que el navegador sólo baja los kanji que aparecen.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fuente-ui",
  display: "swap",
});

const TITULO = "jlptest — japonés del N5 al N1";
const DESCRIPCION =
  "Vocabulario, kanji, gramática y mini exámenes del JLPT, del N5 al N1, en unidades de 20 palabras.";

export const metadata: Metadata = {
  // Sin `metadataBase` Next deja las URL de Open Graph relativas y quien
  // comparta un enlace no ve tarjeta ninguna.
  metadataBase: new URL(sitio()),
  title: TITULO,
  description: DESCRIPCION,
  applicationName: "jlptest",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "jlptest" },
  openGraph: {
    type: "website", siteName: "jlptest", title: TITULO, description: DESCRIPCION, url: "/",
  },
  twitter: { card: "summary", title: TITULO, description: DESCRIPCION },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#161826" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7fd" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const idioma = await idiomaActual();
  return (
    <html lang={idioma} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <ProveedorAjustes idiomaInicial={idioma}>
          <Lateral />
          <div className="con-lateral">{children}</div>
          <Diccionario />
          <BarraInferior />
          <RegistrarSW />
        </ProveedorAjustes>
      </body>
    </html>
  );
}
