"use client";
import { useEffect, useState } from "react";
import type { Lectura } from "@/lib/tipos";
import { JpHtml, JpEnLinea, BotonVoz } from "./Jp";
import { callar, decir, enFrases, pausar, reanudar, soloTexto } from "@/lib/voz";
import { Ordenar } from "./Ordenar";
import { IcDerecha, IcEscucha, IcIzquierda, IcParar, IcPausa, IcReproducir } from "./Iconos";

/** Reproductor frase a frase, con el texto oculto. */
function LectorCiego({ texto, frase, setFrase }: {
  texto: string; frase: number; setFrase: (n: number) => void;
}) {
  const frases = enFrases(texto);
  const [estado, setEstado] = useState<"parado" | "sonando" | "pausado">("parado");

  const reproducir = (i: number) => {
    setFrase(i);
    setEstado("sonando");
    decir(frases[i], { alTerminar: () => setEstado("parado") });
  };

  const botonGrande = () => {
    if (estado === "sonando") { pausar(); setEstado("pausado"); return; }
    if (estado === "pausado") { reanudar(); setEstado("sonando"); return; }
    reproducir(frase);
  };

  return (
    <div style={{ textAlign: "center", padding: "26px 0 10px" }}>
      <button
        onClick={botonGrande}
        aria-label={estado === "sonando" ? "Pausar" : "Reproducir"}
        style={{
          width: 112, height: 112, borderRadius: "50%", display: "grid", placeItems: "center",
          border: "1px solid var(--acento)", color: "var(--acento)",
          background: "color-mix(in srgb, var(--acento) 12%, transparent)",
        }}
      >
        {estado === "sonando" ? <IcPausa size={38} weight="fill" />
         : <IcReproducir size={38} weight="fill" />}
      </button>
      {estado !== "parado" && (
        <div>
          <button className="btn fantasma"
                  onClick={() => { callar(); setEstado("parado"); }}>
            <IcParar size={14} weight="fill" /> detener
          </button>
        </div>
      )}
      <p className="tenue" style={{ marginBottom: 6 }}>
        frase {frase + 1} de {frases.length}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn chico" disabled={frase === 0} onClick={() => reproducir(frase - 1)}>
          <IcIzquierda size={13} /> anterior
        </button>
        <button className="btn chico"
                onClick={() => { setEstado("sonando"); decir(frases[frase], { rate: 0.55, alTerminar: () => setEstado("parado") }); }}>
          0,75×
        </button>
        <button className="btn chico" disabled={frase >= frases.length - 1}
                onClick={() => reproducir(frase + 1)}>
          siguiente <IcDerecha size={13} />
        </button>
      </div>
      <button className="btn chico" style={{ marginTop: 10 }}
              onClick={() => { setEstado("sonando"); decir(frases.join(""), { alTerminar: () => setEstado("parado") }); }}>
        escuchar todo seguido
      </button>
    </div>
  );
}

export function LecturaUnidad({ unidadId, onEncontrada }: {
  unidadId: string; onEncontrada?: (hay: boolean) => void;
}) {
  const [l, setL] = useState<Lectura | null>(null);
  const [cargando, setCargando] = useState(true);
  const [traducir, setTraducir] = useState(false);
  const [resp, setResp] = useState<Record<number, number>>({});
  // Modo «a ciegas»: se oye el texto sin verlo y se contesta. Es lo más
  // parecido al 聴解 del examen que podemos hacer con lo que ya tenemos.
  const [ciega, setCiega] = useState(false);
  const [frase, setFrase] = useState(0);
  useEffect(() => () => callar(), []);

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
          <BotonVoz texto={soloTexto(l.cuerpo)} />
        </div>
        {ciega ? <LectorCiego texto={soloTexto(l.cuerpo)} frase={frase} setFrase={setFrase} />
               : <JpHtml html={l.cuerpo} clase="jp-medio" />}

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button className={`btn chico ${ciega ? "encendido" : ""}`}
                  onClick={() => { callar(); setCiega(!ciega); setFrase(0); }}>
            <IcEscucha size={15} /> {ciega ? "Ver el texto" : "Escuchar sin leer"}
          </button>
          {!ciega && (
            <button className="btn chico" onClick={() => setTraducir(!traducir)}>
              {traducir ? "Ocultar" : "Ver"} traducción
            </button>
          )}
        </div>
        {traducir && <p className="silencio" style={{ marginBottom: 0 }}>{l.traduccion}</p>}
      </article>

      {ciega && (
        <p className="tenue" style={{ marginTop: 10 }}>
          Contesta de oído; luego pulsa «Ver el texto» para comprobarlo.
        </p>
      )}

      <Ordenar frases={enFrases(l.cuerpo)} traduccion={l.traduccion} />

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
