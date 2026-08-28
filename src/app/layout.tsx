import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProveedorAjustes } from "@/components/Ajustes";
import { Cabecera } from "@/components/Cabecera";
import { Diccionario } from "@/components/Diccionario";

export const metadata: Metadata = {
  title: "日本語 N2 — curso por niveles",
  description: "Vocabulario y gramática del JLPT N2, en sesiones de 20 palabras.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ProveedorAjustes>
          <Cabecera />
          <main className="envoltorio">{children}</main>
          <Diccionario />
        </ProveedorAjustes>
      </body>
    </html>
  );
}
