"use client";
import Link from "next/link";
import { useState } from "react";
import { useAjustes } from "./Ajustes";
import { Marca } from "./Marca";
import { Buscador } from "./Buscador";
import { IcAuto, IcBuscar, IcIzquierda, IcLuna, IcSol } from "./Iconos";

export function Cabecera({ atras, titulo }: { atras?: string; titulo?: string }) {
  const { tema, cambiarTema, t } = useAjustes();
  const [buscando, setBuscando] = useState(false);
  const Tema = tema === "claro" ? IcSol : tema === "oscuro" ? IcLuna : IcAuto;
  const nombreTema = t(tema === "claro" ? "tema.claro" : tema === "oscuro" ? "tema.oscuro" : "tema.auto");

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-fila">
          {atras ? (
            <Link href={atras} className="atras">
              <IcIzquierda size={16} />
              <span>{titulo ?? t("com.atras")}</span>
            </Link>
          ) : (
            <Marca />
          )}
          <div className="crecer" />
          <button className="icono-btn" onClick={cambiarTema}
                  aria-label={t("com.tema", { v: nombreTema })} title={t("com.tema", { v: nombreTema })}>
            <Tema size={17} />
          </button>
          <button className="icono-btn" onClick={() => setBuscando(true)}
                  aria-label={t("com.buscarDicc")} title={t("com.buscar")}>
            <IcBuscar size={17} />
          </button>
        </div>
      </header>
      {buscando && <Buscador alCerrar={() => setBuscando(false)} />}
    </>
  );
}
