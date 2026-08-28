import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProveedorAjustes } from "@/components/Ajustes";
import { Diccionario } from "@/components/Diccionario";
import { BarraInferior } from "@/components/BarraInferior";

export const metadata: Metadata = {
  title: "jlptest — japonés del N5 al N1",
  description: "Vocabulario y gramática del JLPT, del N5 al N1, en unidades de 20 palabras.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "jlptest" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ProveedorAjustes>
          {children}
          <Diccionario />
          <BarraInferior />
        </ProveedorAjustes>
      </body>
    </html>
  );
}
