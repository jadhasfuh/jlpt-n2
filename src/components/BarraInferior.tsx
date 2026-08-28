"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/", icono: "⛩", texto: "Curso" },
  { href: "/repaso", icono: "🔁", texto: "Repaso" },
  { href: "/perfil", icono: "🎌", texto: "Perfil" },
];

export function BarraInferior() {
  const ruta = usePathname();
  const activo = (h: string) => (h === "/" ? ruta === "/" || ruta.startsWith("/n/") || ruta.startsWith("/u/") : ruta.startsWith(h));
  return (
    <nav className="barra-inferior">
      {ENLACES.map((e) => (
        <Link key={e.href} href={e.href} className={activo(e.href) ? "activo" : ""}>
          <i>{e.icono}</i>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
