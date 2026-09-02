"use client";
import Link from "next/link";
import { useState } from "react";
import type { Lectura } from "@/lib/tipos";
import { useAjustes } from "./Ajustes";
import { JpHtml, JpEnLinea, BotonVoz } from "./Jp";
import { Ordenar } from "./Ordenar";
import { enFrases, soloTexto } from "@/lib/voz";
import { IcDerecha, IcIzquierda } from "./Iconos";
import { anotarLectura } from "@/lib/progreso";
import { significado as sig } from "@/lib/idioma";

type Palabra = { id: number; escritura: string; lectura: string; es: string; en: string };

/**
 * Un capítulo del libro: primero las palabras, después la historia.
 *
 * Ese orden es el sentido de todo esto. La página de vocabulario no es un
 * anexo: es lo que hace que el capítulo siguiente se entienda sin diccionario,
 * que es exactamente lo que separa leer de descifrar.
 */
export function Libro({ nivel, n, total, unidad, vocabulario, lectura }: {
  nivel: string; n: number; total: number;
  unidad: { id: string; ja: string; es: string; en: string; seccion: string };
  vocabulario: Palabra[];
  lectura: Lectura | null;
}) {
  const { t, idioma } = useAjustes();
  const [traducir, setTraducir] = useState(false);
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
      <section className="tarjeta" style={{ padding: 18, marginBottom: 14 }}>
        <p className="etiqueta" style={{ marginTop: 0 }}>{t("lib2.antes")}</p>
        <div style={{ display: "grid", gap: 8 }}>
          {vocabulario.map((w) => (
            <div key={w.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="jp" style={{ fontSize: 16, minWidth: 104 }}>{w.escritura}</span>
              <span className="tenue" style={{ minWidth: 88 }}>{w.lectura}</span>
              <span style={{ fontSize: 13, color: "var(--tinta-2)" }}>{sig(w, idioma)}</span>
            </div>
          ))}
        </div>
      </section>

      {lectura ? (
        <>
          <article className="tarjeta">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}><JpEnLinea html={lectura.titulo} /></h2>
              <BotonVoz texto={soloTexto(lectura.cuerpo)} />
            </div>
            <JpHtml html={lectura.cuerpo} clase="jp-medio" />
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
