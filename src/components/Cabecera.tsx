"use client";
import Link from "next/link";
import { useAjustes } from "./Ajustes";

export function Cabecera({ atras, titulo }: { atras?: string; titulo?: string }) {
  const { tema, cambiarTema } = useAjustes();
  const icono = tema === "claro" ? "☀️" : tema === "oscuro" ? "🌙" : "◐";
  return (
    <header className="cabecera">
      <div className="cabecera-fila">
        {atras ? (
          <Link href={atras} className="atras">← <span>{titulo ?? "Atrás"}</span></Link>
        ) : (
          <Link href="/" className="marca">jlp<span>test</span></Link>
        )}
        <div className="crecer" />
        <nav className="solo-escritorio">
          <Link href="/" className="btn fantasma">Curso</Link>
          <Link href="/repaso" className="btn fantasma">Repaso</Link>
          <Link href="/perfil" className="btn fantasma">Perfil</Link>
        </nav>
        <button className="btn fantasma" onClick={cambiarTema} aria-label="Cambiar tema">{icono}</button>
      </div>
    </header>
  );
}
