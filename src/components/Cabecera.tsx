"use client";
import Link from "next/link";
import { useAjustes } from "./Ajustes";

export function Cabecera() {
  const { tema, cambiarTema } = useAjustes();
  const icono = tema === "claro" ? "☀️" : tema === "oscuro" ? "🌙" : "◐";
  return (
    <header className="cabecera">
      <div className="cabecera-fila">
        <Link href="/" className="marca">日本語 <span>N2</span></Link>
        <nav style={{ display: "flex", gap: 4 }}>
          <Link href="/secciones" className="btn fantasma">Secciones</Link>
          <Link href="/repaso" className="btn fantasma">Repaso</Link>
        </nav>
        <div className="crecer" />
        <button className="btn fantasma" onClick={cambiarTema} title={`Tema: ${tema}`}>{icono}</button>
      </div>
    </header>
  );
}
