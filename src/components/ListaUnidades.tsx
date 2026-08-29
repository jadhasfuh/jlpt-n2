"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, Kanji, UnidadMeta } from "@/lib/tipos";
import { leerProgreso, medalla, type Progreso } from "@/lib/progreso";
import { PanelGramatica } from "./PanelGramatica";
import { PanelKanji } from "./PanelKanji";

export function ListaUnidades({ nivel, unidades, gramatica, kanji, titulo }: {
  nivel: string; unidades: UnidadMeta[]; gramatica: Gramatica[];
  kanji: Kanji[]; titulo: string;
}) {
  const [p, setP] = useState<Progreso | null>(null);
  const [abierto, setAbierto] = useState<"" | "gramatica" | "kanji">("");

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${abierto === "kanji" ? "encendido" : ""}`} style={{ flex: 1 }}
                onClick={() => setAbierto(abierto === "kanji" ? "" : "kanji")}>
          <span className="jp">漢字</span> {kanji.length}
        </button>
        {gramatica.length > 0 && (
          <button className={`btn ${abierto === "gramatica" ? "encendido" : ""}`} style={{ flex: 1 }}
                  onClick={() => setAbierto(abierto === "gramatica" ? "" : "gramatica")}>
            <span className="jp">文法</span> {gramatica.length}
          </button>
        )}
      </div>
      {abierto === "kanji" && <div style={{ marginBottom: 16 }}><PanelKanji kanji={kanji} titulo={titulo} /></div>}
      {abierto === "gramatica" && <PanelGramatica items={gramatica} />}

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
