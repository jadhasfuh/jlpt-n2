"use client";
import { useEffect, useState } from "react";
import type { Item } from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { JpEnLinea } from "./Jp";
import { IcCerrar, IcParar, IcReproducir } from "./Iconos";
import { callar, decirTramos } from "@/lib/voz";

/**
 * La transcripción de una pregunta de escucha, en los resultados.
 *
 * Sin esto, fallar una de 聴解 no enseña nada: se oye una vez, no se entiende,
 * y la corrección dice cuál era la buena sin decir dónde estaba. Aquí se puede
 * volver a oír leyendo, que es como se aprende a escuchar.
 *
 * Va sólo en los resultados y nunca durante el examen, por lo mismo que el QR
 * del libro va al final del capítulo: leer el guion antes de responder es
 * dejar de hacer el ejercicio.
 */

/** El trozo más largo que comparten dos cadenas, si llega a `minimo`. */
function trozoComun(a: string, b: string, minimo = 4): string {
  let mejor = "";
  for (let i = 0; i < a.length; i++) {
    for (let j = a.length; j > i + mejor.length; j--) {
      const cand = a.slice(i, j);
      if (cand.length >= minimo && b.includes(cand) && cand.length > mejor.length) {
        mejor = cand;
        break;
      }
    }
  }
  return mejor;
}

/**
 * Parte el turno en (antes, clave, después).
 *
 * Lo que decide la respuesta se saca de `puntos`, que es el resumen que ya trae
 * cada ítem: 「会社まで 一時間半」 aparece casi tal cual en el turno que lo dice.
 * Es una coincidencia de texto, no un análisis: si no encuentra nada, no
 * resalta y ya está. Prefiero no señalar a señalar donde no es.
 */
function partir(texto: string, puntos: string[]): [string, string, string] {
  let mejor = "";
  for (const p of puntos) {
    const t = trozoComun(texto, p.replace(/\s+/g, ""), 4)
           || trozoComun(texto, p, 4);
    if (t.length > mejor.length) mejor = t;
  }
  const i = mejor ? texto.indexOf(mejor) : -1;
  if (i < 0) return [texto, "", ""];
  return [texto.slice(0, i), mejor, texto.slice(i + mejor.length)];
}

export function Transcripcion({ item, alCerrar }: { item: Item; alCerrar: () => void }) {
  const { t } = useAjustes();
  const [sonando, setSonando] = useState(false);
  const g = item.guion;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") alCerrar(); };
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); callar(); };
  }, [alCerrar]);

  if (!g) return null;
  const puntos = (item as Item & { puntos?: string[] }).puntos ?? [];

  const reproducir = () => {
    if (sonando) { callar(); setSonando(false); return; }
    setSonando(true);
    decirTramos(
      [...(g.intro ? [{ texto: g.intro }] : []),
       ...g.turnos.map((x) => ({ texto: x.texto })),
       ...(g.pregunta ? [{ texto: g.pregunta }] : [])],
      { alTerminar: () => setSonando(false) },
    );
  };

  return (
    <div className="velo" onClick={alCerrar}>
      <div className="globo" onClick={(e) => e.stopPropagation()}
           role="dialog" aria-modal="true">
        <div className="globo-cab">
          <span className="etiqueta">{t("ex.transcripcion")}</span>
          <button className="icono-btn" onClick={alCerrar} aria-label={t("com.cerrar")}>
            <IcCerrar size={16} />
          </button>
        </div>

        <button className="btn primario" style={{ width: "100%", minHeight: 44 }}
                onClick={reproducir}>
          {sonando ? <IcParar size={17} weight="fill" /> : <IcReproducir size={17} weight="fill" />}
          {sonando ? t("com.parar") : t("ex.escuchar")}
        </button>

        <div className="globo-cuerpo">
          {g.intro && (
            <p className="jp tenue" style={{ marginTop: 12 }}>
              <JpEnLinea html={g.intro} />
            </p>
          )}
          {g.turnos.map((turno, i) => {
            const [antes, clave, despues] = partir(turno.texto, puntos);
            return (
              <p key={i} className="jp turno-guion">
                <span className="quien">{turno.quien}</span>
                <span>
                  {antes}
                  {clave && <mark className="clave">{clave}</mark>}
                  {despues}
                </span>
              </p>
            );
          })}
          {g.pregunta && (
            <p className="jp" style={{ fontWeight: 500, marginTop: 10 }}>
              <JpEnLinea html={g.pregunta} />
            </p>
          )}
          {puntos.length > 0 && (
            <div className="globo-pie">
              <span className="etiqueta">{t("ex.loQueDecide")}</span>
              <ul>
                {puntos.map((p, i) => <li key={i} className="jp">{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
