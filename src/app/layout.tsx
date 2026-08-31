import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProveedorAjustes } from "@/components/Ajustes";
import { Diccionario } from "@/components/Diccionario";
import { BarraInferior } from "@/components/BarraInferior";
import { Lateral } from "@/components/Lateral";

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

export const metadata: Metadata = {
  title: "jlptest — japonés del N5 al N1",
  description: "Vocabulario y gramática del JLPT, del N5 al N1, en unidades de 20 palabras.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "jlptest" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#161826" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7fd" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <ProveedorAjustes>
          <Lateral />
          <div className="con-lateral">{children}</div>
          <Diccionario />
          <BarraInferior />
        </ProveedorAjustes>
      </body>
    </html>
  );
}
