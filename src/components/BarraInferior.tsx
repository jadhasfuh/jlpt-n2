"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contarPendientes, leerProgreso } from "@/lib/progreso";
import { IcCurso, IcPerfil, IcRepaso } from "./Iconos";

const ENLACES = [
  { href: "/", Icono: IcCurso, texto: "Curso" },
  { href: "/repaso", Icono: IcRepaso, texto: "Repaso" },
  { href: "/perfil", Icono: IcPerfil, texto: "Perfil" },
];

export function BarraInferior() {
  const ruta = usePathname();
  const [vencidas, setVencidas] = useState(0);

  // La señal roja del Repaso: saber que hay cola sin tener que entrar a mirar.
  useEffect(() => {
    const recalcular = () => setVencidas(contarPendientes(leerProgreso()).vencidas);
    recalcular();
    window.addEventListener("progreso", recalcular);
    return () => window.removeEventListener("progreso", recalcular);
  }, []);

  const activo = (h: string) =>
    h === "/" ? ruta === "/" || ruta.startsWith("/n/") || ruta.startsWith("/u/") : ruta.startsWith(h);

  return (
    <nav className="barra-inferior">
      {ENLACES.map(({ href, Icono, texto }) => (
        <Link key={href} href={href} className={activo(href) ? "activo" : ""}>
          <Icono size={22} />
          {texto}
          {href === "/repaso" && vencidas > 0 && (
            <span className="senal">{vencidas > 99 ? "99+" : vencidas}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
