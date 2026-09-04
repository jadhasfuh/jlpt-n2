"use client";
import Link from "next/link";
import { capituloLibre } from "@/lib/acceso";
import { useState } from "react";
import type { Gramatica, Lectura } from "@/lib/tipos";
import { useAjustes } from "./Ajustes";
import { Jp, JpHtml, JpEnLinea, BotonVoz } from "./Jp";
import { PanelGramatica } from "./PanelGramatica";
import { Ordenar } from "./Ordenar";
import { enFrases, soloTexto } from "@/lib/voz";
import { IcDerecha, IcIzquierda } from "./Iconos";
import { anotarLectura } from "@/lib/progreso";
import { significado as sig } from "@/lib/idioma";

type Palabra = { id: number; escritura: string; lectura: string; es: string; en: string };
type Fuera = Palabra & { jlpt: string; capitulo: number };
type PuntoFuera = Punto & { capitulo: number };
type Punto = { id: string; forma: string; lectura: string; es: string; en: string };

/**
 * Un capítulo del libro: primero las palabras, después la historia.
 *
 * Ese orden es el sentido de todo esto. La página de vocabulario no es un
 * anexo: es lo que hace que el capítulo siguiente se entienda sin diccionario,
 * que es exactamente lo que separa leer de descifrar.
 */
export function Libro({
  nivel, n, total, unidad, vocabulario, gramatica, deFuera, gramaticaFuera, lectura,
}: {
  nivel: string; n: number; total: number;
  unidad: { id: string; ja: string; es: string; en: string; seccion: string };
  vocabulario: Palabra[];
  gramatica: Gramatica[];
  /** Palabras del texto que se estudian en otro capítulo, con su nivel. */
  deFuera: Fuera[];
  /** Gramática que el capítulo usa pero enseña otro, con cuál. */
  gramaticaFuera: PuntoFuera[];
  lectura: Lectura | null;
}) {
  const { t, idioma, tieneAcceso, significado } = useAjustes();
  const [traducir, setTraducir] = useState(false);
  // Las dos listas iban una debajo de otra dentro de la misma tarjeta, así que
  // se veía una tabla dentro de otra. Las mismas pestañas que las subsecciones.
  const [pestana, setPestana] = useState<"vocabulario" | "gramatica">("vocabulario");
  // 意 tapaba el significado en las subsecciones y aquí no hacía nada. Mismo
  // trato: se tapa hasta pedirlo, salvo que el interruptor global lo abra.
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [resp, setResp] = useState<Record<number, number>>({});

  const trad = (idioma === "en" && lectura?.traduccion_en)
    ? lectura.traduccion_en : lectura?.traduccion ?? "";

  const contestadas = Object.keys(resp).length;
  const contestar = (i: number, j: number, correcta: number) => {
    if (resp[i] !== undefined) return;
    setResp({ ...resp, [i]: j });
    anotarLectura(unidad.id, j === correcta, contestadas + 1 === lectura?.preguntas?.length);
  };

  const ir = (k: number) => `/libro/${nivel}?c=${k}`;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 6px" }}>
        <span className="tenue" style={{ fontSize: 13 }}>{t("lib2.capitulo", { i: n + 1, n: total })}</span>
        {/* Que se vea que la muestra existe ANTES de toparse con el muro. */}
        {!tieneAcceso && capituloLibre(n) && (
          <span className="pastilla gratis">{t("lib2.gratis")}</span>
        )}
        <div style={{ flex: 1, height: 4, borderRadius: 3, background: "var(--pista)" }}>
          <div style={{
            width: `${((n + 1) / total) * 100}%`, height: "100%", borderRadius: 3,
            background: "var(--acento)",
          }} />
        </div>
      </div>

      <h1 className="jp" style={{ fontSize: 25, fontWeight: 500, margin: "0 0 2px", lineHeight: 1.3 }}>
        {unidad.ja}
      </h1>
      <p className="tenue" style={{ margin: "0 0 18px" }}>{idioma === "en" ? unidad.en : unidad.es}</p>

      {/* La página de antes: las palabras que va a usar el capítulo. */}
      <section style={{ marginBottom: 14 }}>
        <p className="etiqueta" style={{ marginTop: 0 }}>{t("lib2.antes")}</p>

        <div className="filtros" style={{ marginBottom: 12 }}>
          {([
            ["vocabulario", "語彙", vocabulario.length],
            ...(gramatica.length ? [["gramatica", "文法", gramatica.length] as const] : []),
          ] as const).map(([id, ja, num]) => (
            <button key={id} className={`btn chico ${pestana === id ? "encendido" : ""}`}
                    onClick={() => setPestana(id as "vocabulario" | "gramatica")}>
              <span className="jp">{ja}</span>
              <span style={{ fontSize: 11, opacity: .7 }}>{num}</span>
            </button>
          ))}
        </div>

        {pestana === "gramatica" ? (
          <>
            <PanelGramatica items={gramatica} />
            {gramaticaFuera.length > 0 && (
              <>
                <p className="etiqueta">{t("lib2.gramFuera")}</p>
                <div className="tarjeta" style={{ padding: "4px 14px" }}>
                  <table className="tabla-vocab">
                    <tbody>
                      {gramaticaFuera.map((g) => (
                        <tr key={g.id}>
                          <td style={{ width: "44%" }}>
                            <Jp escritura={g.forma} lectura={g.lectura} />
                          </td>
                          <td style={{ color: "var(--tinta-2)" }}>{sig(g, idioma)}</td>
                          <td className="tenue" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            {g.capitulo > 0 ? t("lib2.visto", { i: g.capitulo }) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="tarjeta" style={{ padding: "4px 14px" }}>
              <table className="tabla-vocab">
                <tbody>
                  {vocabulario.map((w) => {
                    const visible = significado || abierto[`v${w.id}`];
                    return (
                      <tr key={w.id}>
                        <td style={{ width: "44%" }}>
                          <Jp escritura={w.escritura} lectura={w.lectura} clase="jp-medio" />
                        </td>
                        <td>
                          {visible ? (
                            <button className="revelado-td" disabled={significado}
                                    onClick={() => setAbierto({ ...abierto, [`v${w.id}`]: false })}>
                              <span style={{ color: "var(--tinta-2)" }}>{sig(w, idioma)}</span>
                            </button>
                          ) : (
                            <button className="btn fantasma" style={{ paddingLeft: 0 }}
                                    onClick={() => setAbierto({ ...abierto, [`v${w.id}`]: true })}>
                              {t("com.verSig")}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Las que el capítulo usa pero enseña otro. Van aparte y en
                pequeño: no hay que estudiarlas aquí, sólo poder mirarlas sin
                salir del capítulo. */}
            {deFuera.length > 0 && (
              <>
                <p className="etiqueta" style={{ marginTop: 16 }}>{t("lib2.deFuera")}</p>
                <div className="tarjeta" style={{ padding: "4px 14px" }}>
                  <table className="tabla-vocab">
                    <tbody>
                      {deFuera.map((w) => (
                        <tr key={w.id}>
                          <td style={{ width: "40%" }}>
                            <Jp escritura={w.escritura}
                                lectura={w.lectura !== w.escritura ? w.lectura : undefined} />
                          </td>
                          <td style={{ color: "var(--tinta-2)" }}>
                            {/* El nivel sólo si NO es el del libro: dentro del
                                libro de N5, ver «N5» en cada línea no dice
                                nada; ver «N1» junto a こたつ sí. */}
                            {w.jlpt !== nivel && (
                              <span className={`pastilla ${w.jlpt.toLowerCase()}`}
                                    style={{ fontSize: 10.5, padding: "1px 6px", marginRight: 6 }}>
                                {w.jlpt}
                              </span>
                            )}
                            {sig(w, idioma)}
                          </td>
                          <td className="tenue" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            {w.capitulo > 0 ? t("lib2.visto", { i: w.capitulo }) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {lectura ? (
        <>
          <article className="tarjeta">
            {/* La misma ilustración que lleva el capítulo en papel. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/libro/${unidad.id.replace(/\//g, "_")}.png`} alt=""
                 className="dibujo-capitulo"
                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}><JpEnLinea html={lectura.titulo} /></h2>
              <BotonVoz texto={soloTexto(lectura.cuerpo)} />
            </div>
            <JpHtml html={lectura.cuerpo} clase="jp-medio" permiteVertical />
            <button className="btn chico" style={{ marginTop: 10 }}
                    onClick={() => setTraducir(!traducir)}>
              {traducir ? t("lec.ocultarTrad") : t("lec.verTrad")}
            </button>
            {traducir && <p className="silencio" style={{ marginBottom: 0 }}>{trad}</p>}
          </article>

          <Ordenar frases={enFrases(lectura.cuerpo)} traduccion={trad} />

          {lectura.preguntas?.length ? (
            <div className="tarjeta" style={{ marginTop: 12 }}>
              <p className="etiqueta">{t("lec.comprension")}</p>
              {lectura.preguntas.map((q, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 17 }}><JpEnLinea html={q.p} /></div>
                  <div className="opciones" style={{ marginTop: 8 }}>
                    {q.opciones.map((o, j) => {
                      const dada = resp[i];
                      const clase = dada === undefined ? ""
                        : j === q.correcta ? "bien" : dada === j ? "mal" : "";
                      return (
                        <button key={j} className={`opcion ${clase}`} disabled={dada !== undefined}
                                onClick={() => contestar(i, j, q.correcta)}>
                          <JpEnLinea html={o} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="tenue">{t("lec.sinLectura")}</p>
      )}

      <div style={{ display: "flex", gap: 8, margin: "20px 0 8px" }}>
        {n > 0 && (
          <Link href={ir(n - 1)} className="btn" style={{ flex: 1, minHeight: 46 }}>
            <IcIzquierda size={15} /> {t("lib2.anterior")}
          </Link>
        )}
        {n < total - 1 && (
          <Link href={ir(n + 1)} className="btn primario" style={{ flex: 1, minHeight: 46 }}>
            {t("lib2.siguiente")} <IcDerecha size={15} />
          </Link>
        )}
      </div>
      <Link href={`/u/${unidad.id.split("/")[0]}/${unidad.seccion}/${unidad.id.split("/")[2]}`}
            className="btn fantasma" style={{ width: "100%" }}>
        {t("lib2.irUnidad")}
      </Link>
    </>
  );
}
