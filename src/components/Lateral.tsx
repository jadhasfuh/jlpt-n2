"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contarPendientes, leerProgreso, resumen } from "@/lib/progreso";
import { Marca } from "./Marca";
import { Buscador } from "./Buscador";
import {
  IcAuto, IcCurso, IcDiccionario, IcExamen, IcLuna, IcPerfil, IcRepaso, IcSol,
} from "./Iconos";
import { useAjustes } from "./Ajustes";

/**
 * La navegación de escritorio. En móvil no existe (la barra inferior hace su
 * papel); a partir de 900px sustituye a la cabecera, que se oculta por CSS.
 */
export function Lateral() {
  const ruta = usePathname();
  const { tema, cambiarTema, t } = useAjustes();
  const [vencidas, setVencidas] = useState(0);
  const [r, setR] = useState<ReturnType<typeof resumen> | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const recalcular = () => {
      const p = leerProgreso();
      setVencidas(contarPendientes(p).vencidas);
      setR(resumen(p));
    };
    recalcular();
    window.addEventListener("progreso", recalcular);
    return () => window.removeEventListener("progreso", recalcular);
  }, []);

  const activo = (h: string) =>
    h === "/" ? ruta === "/" || ruta.startsWith("/n/") || ruta.startsWith("/u/") : ruta.startsWith(h);

  const Tema = tema === "claro" ? IcSol : tema === "oscuro" ? IcLuna : IcAuto;
  const nombreTema = t("com.tema", {
    v: t(tema === "claro" ? "tema.claro" : tema === "oscuro" ? "tema.oscuro" : "tema.auto"),
  });

  return (
    <>
      <aside className="lateral">
        <Marca tam={22} />
        <nav>
          <Link href="/" className={activo("/") ? "activo" : ""}>
            <IcCurso size={19} /> {t("nav.curso")}
          </Link>
          <Link href="/examen" className={activo("/examen") ? "activo" : ""}>
            <IcExamen size={19} /> {t("nav.examen")}
          </Link>
          <Link href="/repaso" className={activo("/repaso") ? "activo" : ""}>
            <IcRepaso size={19} /> {t("nav.repaso")}
            {vencidas > 0 && <span className="senal">{vencidas > 99 ? "99+" : vencidas}</span>}
          </Link>
          <button onClick={() => setBuscando(true)} style={{ textAlign: "left" }}>
            <IcDiccionario size={19} /> {t("nav.dicc")}
          </button>
          <Link href="/perfil" className={activo("/perfil") ? "activo" : ""}>
            <IcPerfil size={19} /> {t("nav.perfil")}
          </Link>
        </nav>

        {r && (
          <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
            {([
              [`${r.xp}`, t("inicio.xp")],
              [`${r.racha}`, t("inicio.dias")],
              [`${r.dominadas}`, t("inicio.dominadas")],
              [`${r.unidades}`, t("inicio.unidades")],
            ] as const).map(([v, etiqueta]) => (
              <div key={etiqueta} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <b style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</b>
                <i className="etiqueta" style={{ fontStyle: "normal" }}>{etiqueta}</i>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button className="icono-btn" onClick={cambiarTema} aria-label={nombreTema} title={nombreTema}>
          <Tema size={17} />
        </button>
      </aside>
      {buscando && <Buscador alCerrar={() => setBuscando(false)} />}
    </>
  );
}
