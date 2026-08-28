"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, Palabra, Unidad } from "@/lib/tipos";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";
import { PanelGramatica } from "./PanelGramatica";
import { Practica } from "./Practica";
import { Test } from "./Test";
import { LecturaUnidad } from "./LecturaUnidad";
import { estadoItem, leerProgreso, type Progreso } from "@/lib/progreso";

export function VistaUnidad({ unidad, palabras, gramatica, siguiente }: {
  unidad: Unidad; palabras: Palabra[]; gramatica: Gramatica[]; siguiente: string | null;
}) {
  const { significado } = useAjustes();
  const [pestana, setPestana] = useState<"vocabulario" | "gramatica" | "lectura">("vocabulario");
  const [hayLectura, setHayLectura] = useState(false);
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});
  const [escena, setEscena] = useState<null | "practica" | "test">(null);
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

  const est = p?.unidades[unidad.id];

  return (
    <>
      <main className="envoltorio">
        <section style={{ padding: "18px 0 12px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <span className={`pastilla ${unidad.nivel.toLowerCase()}`}>{unidad.nivel}</span>
            <h1 className="jp" style={{ fontSize: 27, margin: "8px 0 0" }}>{unidad.ja}</h1>
            <p className="silencio" style={{ margin: 0 }}>{unidad.es}</p>
          </div>
          <div className="crecer" style={{ flex: 1 }} />
          <BotonesRapidos compacto />
        </section>

        {est && (
          <p className="tenue" style={{ marginTop: 0 }}>
            {est.practicada ? "Practicada" : "Sin practicar"}
            {est.mejor ? ` · mejor test ${est.mejor}%` : ""}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, margin: "6px 0 14px", flexWrap: "wrap" }}>
          <button className={`btn chico ${pestana === "vocabulario" ? "encendido" : ""}`}
                  onClick={() => setPestana("vocabulario")}>
            <span className="jp">語彙</span> {palabras.length}
          </button>
          {gramatica.length > 0 && (
            <button className={`btn chico ${pestana === "gramatica" ? "encendido" : ""}`}
                    onClick={() => setPestana("gramatica")}>
              <span className="jp">文法</span> {gramatica.length}
            </button>
          )}
          <button className={`btn chico ${pestana === "lectura" ? "encendido" : ""}`}
                  onClick={() => setPestana("lectura")}>
            <span className="jp">読解</span>{hayLectura ? " ✓" : ""}
          </button>
        </div>

        {pestana === "lectura" ? (
          <LecturaUnidad unidadId={unidad.id} onEncontrada={setHayLectura} />
        ) : pestana === "gramatica" ? (
          <PanelGramatica items={gramatica} />
        ) : (
          <div className="tarjeta" style={{ padding: "2px 14px" }}>
            <table className="tabla-vocab">
              <tbody>
                {palabras.map((w) => {
                  const visible = significado || abierto[w.id];
                  const estado = estadoItem(p?.palabras[String(w.id)]);
                  return (
                    <tr key={w.id}>
                      <td style={{ width: 14 }}><span className={`punto ${estado}`} /></td>
                      <td style={{ width: "42%" }}>
                        <Jp escritura={w.escritura} lectura={w.lectura} clase="jp-medio" />
                      </td>
                      <td>
                        {visible ? (
                          <>
                            <div style={{ fontSize: 14 }}>{w.es || w.en}</div>
                            <div className="tenue">
                              {w.registro.length > 0 && <em>{w.registro.join(" · ")} — </em>}{w.en}
                            </div>
                          </>
                        ) : (
                          <button className="btn fantasma" style={{ paddingLeft: 0 }}
                                  onClick={() => setAbierto({ ...abierto, [w.id]: true })}>
                            ver significado
                          </button>
                        )}
                      </td>
                      <td style={{ width: 40, textAlign: "right" }}><BotonVoz texto={w.escritura} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {siguiente && (
          <Link href={siguiente} className="btn" style={{ width: "100%", marginTop: 14 }}>
            Siguiente unidad →
          </Link>
        )}
      </main>

      <div className="flotantes">
        <button className="btn primario" onClick={() => setEscena("practica")}>Practicar</button>
        <button className="btn" onClick={() => setEscena("test")}>Test</button>
      </div>
    </>
  );
}
