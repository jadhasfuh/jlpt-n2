"use client";
import { useState } from "react";
import type { Kanji } from "@/lib/tipos";
import { Leyenda } from "./Jp";
import { TestKanji } from "./TestKanji";
import { useAjustes } from "./Ajustes";

export function PanelKanji({ kanji, titulo }: { kanji: Kanji[]; titulo: string }) {
  const [sel, setSel] = useState<Kanji | null>(null);
  const [test, setTest] = useState(false);
  const { colores } = useAjustes();

  if (test) return <TestKanji kanji={kanji} titulo={titulo} cerrar={() => setTest(false)} />;
  if (!kanji.length) return <p className="silencio">Aquí no hay kanji todavía.</p>;

  return (
    <>
      <Leyenda />
      <div className={`kanjis ${colores ? "" : "sin-colores"}`}>
        {kanji.map((k) => (
          <button key={k.char} className={sel?.char === k.char ? "sel" : ""}
                  onClick={() => setSel(sel?.char === k.char ? null : k)}>
            <span className={`k ${(k.nivel || k.curso).toLowerCase()}`}>{k.char}</span>
          </button>
        ))}
      </div>

      {sel && (
        <article className="tarjeta" style={{ marginTop: 14 }}>
          <div className="ficha-kanji">
            <div className={`grande ${colores ? "" : "sin-colores"}`}>
              <span className={`k ${(sel.nivel || sel.curso).toLowerCase()}`}>{sel.char}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {sel.nivel && <span className={`pastilla ${sel.nivel.toLowerCase()}`}>{sel.nivel}</span>}
                <span className="tenue">
                  {sel.trazos} trazos{sel.freq ? ` · frecuencia ${sel.freq}` : ""}
                  {sel.n_palabras ? ` · en ${sel.n_palabras} palabras` : ""}
                </span>
              </div>
              <p style={{ margin: "8px 0 4px", fontSize: 16 }}>{sel.es || sel.en.join(", ")}</p>
              <p className="tenue" style={{ margin: 0 }}>
                <span className="jp">音</span> {sel.on.join("・") || "—"}　
                <span className="jp">訓</span> {sel.kun.join("・") || "—"}
              </p>
            </div>
          </div>
        </article>
      )}

      <button className="btn primario" style={{ width: "100%", marginTop: 14 }}
              onClick={() => setTest(true)}>
        <span className="jp">漢字</span> Test de kanji ({kanji.length})
      </button>
    </>
  );
}
