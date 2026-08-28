"use client";
import { useEffect, useState } from "react";
import type { Lectura } from "@/lib/tipos";
import { JpHtml, JpEnLinea, BotonVoz } from "./Jp";

const sinRuby = (h: string) => h.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");

export function LecturaUnidad({ unidadId, onEncontrada }: {
  unidadId: string; onEncontrada?: (hay: boolean) => void;
}) {
  const [l, setL] = useState<Lectura | null>(null);
  const [cargando, setCargando] = useState(true);
  const [traducir, setTraducir] = useState(false);
  const [resp, setResp] = useState<Record<number, number>>({});

  useEffect(() => {
    let vivo = true;
    fetch(`/api/lectura/${unidadId}`)
      .then((r) => r.json())
      .then((d) => { if (vivo) { setL(d.lectura); onEncontrada?.(!!d.lectura); } })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [unidadId, onEncontrada]);

  if (cargando) return <div className="tarjeta" style={{ height: 140 }} />;
  if (!l) {
    return (
      <div className="tarjeta">
        <p style={{ margin: 0 }}>Esta unidad todavía no tiene lectura.</p>
        <p className="tenue" style={{ marginBottom: 0 }}>
          Las lecturas se escriben por tandas y usan sólo el vocabulario y la gramática
          que ya viste hasta aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      <article className="tarjeta">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}><JpEnLinea html={l.titulo} /></h2>
          <BotonVoz texto={sinRuby(l.cuerpo)} />
        </div>
        <JpHtml html={l.cuerpo} clase="jp-medio" />
        <button className="btn chico" onClick={() => setTraducir(!traducir)} style={{ marginTop: 10 }}>
          {traducir ? "Ocultar" : "Ver"} traducción
        </button>
        {traducir && <p className="silencio" style={{ marginBottom: 0 }}>{l.traduccion}</p>}
      </article>

      {l.preguntas?.length ? (
        <div className="tarjeta" style={{ marginTop: 12 }}>
          <p className="etiqueta">Comprensión</p>
          {l.preguntas.map((q, i) => (
            <div key={i} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 17 }}><JpEnLinea html={q.p} /></div>
              <div className="opciones" style={{ marginTop: 8 }}>
                {q.opciones.map((o, j) => {
                  const dada = resp[i];
                  const clase = dada === undefined ? "" : j === q.correcta ? "bien" : dada === j ? "mal" : "";
                  return (
                    <button key={j} className={`opcion ${clase}`}
                            onClick={() => setResp({ ...resp, [i]: j })}>
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
  );
}
