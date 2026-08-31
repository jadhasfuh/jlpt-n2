"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, Kanji, Palabra, Unidad } from "@/lib/tipos";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";
import { PanelGramatica } from "./PanelGramatica";
import { PanelKanji } from "./PanelKanji";
import { Practica } from "./Practica";
import { Test } from "./Test";
import { Escucha } from "./Escucha";
import { LecturaUnidad } from "./LecturaUnidad";
import { estadoItem, leerProgreso, type Progreso } from "@/lib/progreso";
import { IcDerecha, IcEscucha } from "./Iconos";

type Pestana = "vocabulario" | "kanji" | "gramatica" | "lectura";

export function VistaUnidad({ unidad, palabras, gramatica, kanji, siguiente, indice, total }: {
  unidad: Unidad; palabras: Palabra[]; gramatica: Gramatica[];
  kanji: Kanji[]; siguiente: string | null; indice: number; total: number;
}) {
  const { significado } = useAjustes();
  const [pestana, setPestana] = useState<Pestana>("vocabulario");
  const [hayLectura, setHayLectura] = useState(false);
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});
  const [escena, setEscena] = useState<null | "practica" | "test" | "escucha">(null);
  const [p, setP] = useState<Progreso | null>(null);

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  if (escena === "practica")
    return <Practica unidad={unidad} palabras={palabras} gramatica={gramatica}
                     cerrar={() => setEscena(null)} />;
  if (escena === "test")
    return <Test unidad={unidad} palabras={palabras} cerrar={() => setEscena(null)}
                 siguiente={siguiente} />;
  if (escena === "escucha")
    return <Escucha unidad={unidad} palabras={palabras} cerrar={() => setEscena(null)} />;

  const est = p?.unidades[unidad.id];
  const hechas = palabras.filter((w) => estadoItem(p?.palabras[String(w.id)]) !== "nueva").length;

  const pestanas: { id: Pestana; ja: string; n?: number | string }[] = [
    { id: "vocabulario", ja: "語彙", n: palabras.length },
    ...(kanji.length ? [{ id: "kanji" as const, ja: "漢字", n: kanji.length }] : []),
    ...(gramatica.length ? [{ id: "gramatica" as const, ja: "文法", n: gramatica.length }] : []),
    { id: "lectura", ja: "読解", n: hayLectura ? "✓" : undefined },
  ];

  return (
    <>
      <main className="envoltorio con-flotantes">
        <section style={{ padding: "14px 0 10px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span className={`pastilla ${unidad.nivel.toLowerCase()}`}>{unidad.nivel}</span>
              <h1 className="jp" style={{ fontSize: 27, fontWeight: 500, margin: "8px 0 2px", lineHeight: 1.25 }}>
                {unidad.ja}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
                {unidad.es}
                {total > 1 && ` · unidad ${indice} de ${total}`}
              </p>
            </div>
            <BotonesRapidos compacto />
          </div>
        </section>

        {/* Cuánto llevas de esta unidad, sin tener que contar los puntos a mano. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div className="barra" style={{ flex: 1 }}>
            <i style={{ width: `${palabras.length ? (hechas / palabras.length) * 100 : 0}%` }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--tinta-3)", flex: "0 0 auto" }}>
            {est?.practicada ? "practicada" : `${hechas}/${palabras.length}`}
            {est?.mejor ? ` · mejor test ${est.mejor}%` : ""}
          </span>
        </div>

        <div className="filtros" style={{ marginBottom: 12 }}>
          {pestanas.map((t) => (
            <button key={t.id} className={`btn chico ${pestana === t.id ? "encendido" : ""}`}
                    onClick={() => setPestana(t.id)}>
              <span className="jp">{t.ja}</span>
              {t.n !== undefined && (
                <span style={{ fontSize: 11, opacity: .7 }}>{t.n}</span>
              )}
            </button>
          ))}
        </div>

        {pestana === "kanji" ? (
          <PanelKanji kanji={kanji} titulo={`${unidad.ja} · ${unidad.nivel}`} />
        ) : pestana === "lectura" ? (
          <LecturaUnidad unidadId={unidad.id} onEncontrada={setHayLectura} />
        ) : pestana === "gramatica" ? (
          <PanelGramatica items={gramatica} />
        ) : (
          <>
            <div className="lista-vocab">
              {palabras.map((w) => {
                const visible = significado || abierto[w.id];
                const mem = p?.palabras[String(w.id)];
                const estado = estadoItem(mem);
                const vencida = !!mem?.proximo && mem.proximo <= Date.now() && estado !== "nueva";
                return (
                  <div key={w.id}
                       style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px" }}>
                    <span className={`punto ${vencida ? "vencida" : estado}`} />
                    <div style={{ width: 112, flex: "0 0 auto" }}>
                      <Jp escritura={w.escritura} lectura={w.lectura} clase="jp-medio" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {visible ? (
                        // Se puede volver a tapar tocándolo, salvo que esté
                        // encendido el interruptor global de 意味.
                        <button className="revelado-td" disabled={significado}
                                onClick={() => setAbierto({ ...abierto, [w.id]: false })}>
                          <span style={{ fontSize: 13.5 }}>{w.es || w.en}</span>
                          <span style={{ display: "block", fontSize: 11, color: "var(--tinta-3)" }}>
                            {w.registro.length > 0 && <em>{w.registro.join(" · ")} — </em>}{w.en}
                          </span>
                        </button>
                      ) : (
                        <button className="btn fantasma chico" style={{ paddingLeft: 0 }}
                                onClick={() => setAbierto({ ...abierto, [w.id]: true })}>
                          ver significado
                        </button>
                      )}
                    </div>
                    <BotonVoz texto={w.escritura} />
                  </div>
                );
              })}
            </div>

            <div className="leyenda" style={{ marginTop: 10 }}>
              {([
                ["dominada", "dominada", "var(--acento)"],
                ["aprendiendo", "en curso", "var(--acento-700)"],
                ["nueva", "nueva", "var(--pista)"],
                ["vencida", "vencida", "var(--rojo)"],
              ] as const).map(([k, texto, color]) => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--tinta-3)" }}>
                  <i style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "block" }} />
                  {texto}
                </span>
              ))}
            </div>
          </>
        )}

        {siguiente && (
          <Link href={siguiente} className="btn" style={{ width: "100%", marginTop: 14 }}>
            Siguiente unidad <IcDerecha size={14} />
          </Link>
        )}
      </main>

      <div className="flotantes">
        <button className="btn primario" onClick={() => setEscena("practica")}>Practicar</button>
        <button className="btn" onClick={() => setEscena("test")}>Test</button>
        <button className="btn cuadrado" onClick={() => setEscena("escucha")}
                title="Ejercicio de oído" aria-label="Escucha">
          <IcEscucha size={19} />
        </button>
      </div>
    </>
  );
}
