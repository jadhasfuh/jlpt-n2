"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, UnidadMeta } from "@/lib/tipos";
import { leerProgreso, medalla, type Progreso } from "@/lib/progreso";
import { PanelGramatica } from "./PanelGramatica";

export function ListaUnidades({ nivel, unidades, gramatica }: {
  nivel: string; unidades: UnidadMeta[]; gramatica: Gramatica[];
}) {
  const [p, setP] = useState<Progreso | null>(null);
  const [verGram, setVerGram] = useState(false);

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  return (
    <>
      {gramatica.length > 0 && (
        <>
          <button className="btn" style={{ width: "100%", marginBottom: 12 }}
                  onClick={() => setVerGram(!verGram)}>
            <span className="jp">文法</span> · {verGram ? "ocultar" : "ver"} la gramática de esta sección
            ({gramatica.length})
          </button>
          {verGram && <PanelGramatica items={gramatica} />}
        </>
      )}

      <div className="lista">
        {unidades.map((u) => {
          const est = p?.unidades[u.id];
          const idCorto = u.id.split("/").pop()!;
          return (
            <Link key={u.id} href={`/u/${nivel}/${u.id.split("/")[1]}/${idCorto}`} className="fila">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="jp" style={{ fontSize: 19, lineHeight: 1.4 }}>{u.ja}</div>
                <div className="tenue">
                  {u.items} palabras{u.gramatica ? ` · ${u.gramatica} gramática` : ""}
                </div>
              </div>
              {est?.mejor ? <span title={`mejor: ${est.mejor}%`}>{medalla(est.mejor) || `${est.mejor}%`}</span> : null}
              {est?.practicada && !est.mejor ? <span className="punto dominada" /> : null}
              <span className="flecha">›</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
