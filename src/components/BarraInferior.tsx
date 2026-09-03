"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contarPendientes, leerProgreso } from "@/lib/progreso";
import { IcCurso, IcExamen, IcPerfil, IcRepaso } from "./Iconos";
import { ConmutadoresJp, useAjustes } from "./Ajustes";

const ENLACES = [
  { href: "/", Icono: IcCurso, clave: "nav.curso" },
  { href: "/examen", Icono: IcExamen, clave: "nav.examen" },
  { href: "/repaso", Icono: IcRepaso, clave: "nav.repaso" },
  { href: "/perfil", Icono: IcPerfil, clave: "nav.perfil" },
] as const;

/** Dónde van los interruptores.
 *
 *  En las pantallas de estudio —tests, repaso, sesión de cinco minutos— van
 *  arriba, en la fila del progreso, que es donde está la mano. Aquí abajo van
 *  en las de navegar y leer, que no tienen esa fila. Estar en los dos sitios
 *  a la vez es lo que hacía que en una pantalla salieran arriba y en la de al
 *  lado abajo. */
const conJapones = (ruta: string) =>
  ruta.startsWith("/u/") || ruta.startsWith("/n/") || ruta.startsWith("/libro");

export function BarraInferior() {
  const { t } = useAjustes();
  const ruta = usePathname();
  const [vencidas, setVencidas] = useState(0);
  const jp = conJapones(ruta);

  // La barra crece una fila cuando lleva los interruptores. Se avisa por el
  // <html> porque `--barra` la usan los botones flotantes y el hueco que deja
  // cada página al final; si sólo creciera la barra, taparía el contenido.
  useEffect(() => {
    document.documentElement.dataset.jp = jp ? "1" : "";
    return () => { document.documentElement.dataset.jp = ""; };
  }, [jp]);

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
    <nav className={`barra-inferior ${jp ? "con-jp" : ""}`}>
      {jp && <ConmutadoresJp />}
      {ENLACES.map(({ href, Icono, clave }) => (
        <Link key={href} href={href} className={activo(href) ? "activo" : ""}>
          <Icono size={22} />
          {t(clave)}
          {href === "/repaso" && vencidas > 0 && (
            <span className="senal">{vencidas > 99 ? "99+" : vencidas}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
