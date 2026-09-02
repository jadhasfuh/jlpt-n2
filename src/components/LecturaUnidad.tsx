"use client";
import { useAjustes } from "./Ajustes";
import { useEffect, useState } from "react";
import type { Lectura } from "@/lib/tipos";
import { JpHtml, JpEnLinea, BotonVoz } from "./Jp";
import { callar, decir, enFrases, pausar, reanudar, soloTexto } from "@/lib/voz";
import { Ordenar } from "./Ordenar";
import { IcDerecha, IcEscucha, IcIzquierda, IcParar, IcPausa, IcReproducir } from "./Iconos";
import { anotarLectura } from "@/lib/progreso";

/** Reproductor frase a frase, con el texto oculto. */
function LectorCiego({ texto, frase, setFrase }: {
  texto: string; frase: number; setFrase: (n: number) => void;
}) {
  const { t, idioma } = useAjustes();
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
        aria-label={estado === "sonando" ? t("com.pausar") : t("com.reproducir")}
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
            <IcParar size={14} weight="fill" /> {t("com.detener")}
          </button>
        </div>
      )}
      <p className="tenue" style={{ marginBottom: 6 }}>
        {t("lec.frase", { i: frase + 1, n: frases.length })}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn chico" disabled={frase === 0} onClick={() => reproducir(frase - 1)}>
          <IcIzquierda size={13} /> {t("lec.anterior")}
        </button>
        <button className="btn chico"
                onClick={() => { setEstado("sonando"); decir(frases[frase], { rate: 0.55, alTerminar: () => setEstado("parado") }); }}>
          0,75×
        </button>
        <button className="btn chico" disabled={frase >= frases.length - 1}
                onClick={() => reproducir(frase + 1)}>
          {t("lec.siguiente")} <IcDerecha size={13} />
        </button>
      </div>
      <button className="btn chico" style={{ marginTop: 10 }}
              onClick={() => { setEstado("sonando"); decir(frases.join(""), { alTerminar: () => setEstado("parado") }); }}>
        {t("lec.todoSeguido")}
      </button>
    </div>
  );
}

export function LecturaUnidad({ unidadId }: { unidadId: string }) {
  const { t, idioma } = useAjustes();
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
      .then((d) => { if (vivo) setL(d.lectura); })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [unidadId]);

  // Contestar cuenta como estudio: suma al día, a la racha y —al terminar
  // todas— deja la unidad cubierta, igual que las tarjetas o el test.
  const contestadas = Object.keys(resp).length;
  const contestar = (i: number, j: number, correcta: number) => {
    if (resp[i] !== undefined) return;
    setResp({ ...resp, [i]: j });
    anotarLectura(unidadId, j === correcta, contestadas + 1 === l?.preguntas?.length);
  };

  if (cargando) return <div className="tarjeta" style={{ height: 140 }} />;
  if (!l) {
    return (
      <div className="tarjeta">
        <p style={{ margin: 0 }}>{t("lec.sinLectura")}</p>
        <p className="tenue" style={{ marginBottom: 0 }}>{t("lec.porTandas")}</p>
      </div>
    );
  }


  // La traducción de apoyo, en el idioma de la interfaz. Están las 602 en los
  // dos idiomas; el respaldo al español sólo cubre una lectura recién escrita.
  const trad = (idioma === "en" && l.traduccion_en) ? l.traduccion_en : l.traduccion;


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
            <IcEscucha size={15} /> {ciega ? t("lec.verTexto") : t("lec.sinLeer")}
          </button>
          {!ciega && (
            <button className="btn chico" onClick={() => setTraducir(!traducir)}>
              {traducir ? t("lec.ocultarTrad") : t("lec.verTrad")}
            </button>
          )}
        </div>
        {traducir && <p className="silencio" style={{ marginBottom: 0 }}>{trad}</p>}
      </article>

      {ciega && (
        <p className="tenue" style={{ marginTop: 10 }}>{t("lec.deOido")}</p>
      )}

      <Ordenar frases={enFrases(l.cuerpo)} traduccion={trad} />

      {l.preguntas?.length ? (
        <div className="tarjeta" style={{ marginTop: 12 }}>
          <p className="etiqueta">{t("lec.comprension")}</p>
          {l.preguntas.map((q, i) => (
            <div key={i} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 17 }}><JpEnLinea html={q.p} /></div>
              <div className="opciones" style={{ marginTop: 8 }}>
                {q.opciones.map((o, j) => {
                  const dada = resp[i];
                  const clase = dada === undefined ? "" : j === q.correcta ? "bien" : dada === j ? "mal" : "";
                  return (
                    <button key={j} className={`opcion ${clase}`}
                            // Una respuesta por pregunta: si se puede cambiar
                            // después de ver el color, el ejercicio no mide nada.
                            disabled={dada !== undefined}
                            onClick={() => contestar(i, j, q.correcta)}>
                      <JpEnLinea html={o} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {contestadas === l.preguntas.length && (
            <p className="tenue" style={{ margin: "14px 0 0" }}>
              {t("lec.aciertos", {
                a: l.preguntas.filter((q, i) => resp[i] === q.correcta).length,
                n: l.preguntas.length,
              })}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
