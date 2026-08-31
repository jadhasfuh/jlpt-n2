"use client";
import Link from "next/link";
import { useState } from "react";
import { useAjustes } from "./Ajustes";
import { Marca } from "./Marca";
import { Buscador } from "./Buscador";
import { IcAuto, IcBuscar, IcIzquierda, IcLuna, IcSol } from "./Iconos";

export function Cabecera({ atras, titulo }: { atras?: string; titulo?: string }) {
  const { tema, cambiarTema } = useAjustes();
  const [buscando, setBuscando] = useState(false);
  const Tema = tema === "claro" ? IcSol : tema === "oscuro" ? IcLuna : IcAuto;
  const nombreTema = tema === "claro" ? "claro" : tema === "oscuro" ? "oscuro" : "automático";

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-fila">
          {atras ? (
            <Link href={atras} className="atras">
              <IcIzquierda size={16} />
              <span>{titulo ?? "Atrás"}</span>
            </Link>
          ) : (
            <Marca />
          )}
          <div className="crecer" />
          <button className="icono-btn" onClick={cambiarTema}
                  aria-label={`Tema ${nombreTema}; pulsa para cambiarlo`} title={`Tema ${nombreTema}`}>
            <Tema size={17} />
          </button>
          <button className="icono-btn" onClick={() => setBuscando(true)}
                  aria-label="Buscar en el diccionario" title="Buscar una palabra">
            <IcBuscar size={17} />
          </button>
        </div>
      </header>
      {buscando && <Buscador alCerrar={() => setBuscando(false)} />}
    </>
  );
}
