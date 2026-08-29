"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, Kanji, UnidadMeta } from "@/lib/tipos";
import { leerProgreso, medalla, type Progreso } from "@/lib/progreso";


export function ListaUnidades({ nivel, seccion, unidades, gramatica, kanji }: {
  nivel: string; seccion: string; unidades: UnidadMeta[];
  gramatica: Gramatica[]; kanji: Kanji[];
}) {
  const [p, setP] = useState<Progreso | null>(null);

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  return (
    <>
      {/* Abren su propia pantalla: desplegarlas aquí empujaba la lista de
          unidades muy abajo y se perdía el sitio donde estabas. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Link className="btn" style={{ flex: 1 }} href={`/n/${nivel}/${seccion}/kanji`}>
          <span className="jp">漢字</span> {kanji.length} ›
        </Link>
        {gramatica.length > 0 && (
          <Link className="btn" style={{ flex: 1 }} href={`/n/${nivel}/${seccion}/gramatica`}>
            <span className="jp">文法</span> {gramatica.length} ›
          </Link>
        )}
      </div>

      <div className="lista">
        {unidades.map((u) => {
          const est = p?.unidades[u.id];
          const idCorto = u.id.split("/").pop()!;
          return (
            <Link key={u.id} href={`/u/${nivel}/${u.id.split("/")[1]}/${idCorto}`} className="fila">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="jp" style={{ fontSize: 19, lineHeight: 1.4 }}>{u.ja}</div>
                <div className="tenue">
                  {u.items} palabras · {u.kanji} kanji
                  {u.gramatica ? ` · ${u.gramatica} gramática` : ""}
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
