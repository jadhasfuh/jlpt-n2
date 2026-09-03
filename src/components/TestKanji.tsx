"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Kanji } from "@/lib/tipos";
import { anotar, registrarTest } from "@/lib/progreso";
import { ConmutadoresJp, useAjustes } from "./Ajustes";
import { significado as sigIdioma } from "@/lib/idioma";
import { IcCerrar, IcDerecha } from "./Iconos";

const SEGUNDOS = 3;

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** 「いと.しい」 -> 「いとしい」; las lecturas kun traen el punto del okurigana. */
const limpiar = (l: string) => l.replace(/\./g, "").replace(/[-~]/g, "");
const lecturas = (k: Kanji) => [...k.on, ...k.kun].map(limpiar).filter(Boolean);

/**
 * Test de kanji en dos mitades:
 *   1. el significado, sin prisa  -> medio punto
 *   2. la lectura, con 3 segundos -> el otro medio
 * Saber qué significa y saber cómo suena son dos cosas distintas, y la segunda
 * es la que se cae en el examen si no se practica con reloj.
 */
export function TestKanji({ kanji, titulo, cerrar }: {
  kanji: Kanji[]; titulo: string; cerrar: () => void;
}) {
  const { t, idioma } = useAjustes();
  const preguntas = useMemo(() => {
    const utiles = kanji.filter((k) => (k.es || k.en.join(", ")).trim());   // hay significado en algún idioma
    const conLectura = utiles.filter((k) => lecturas(k).length);
    return mezclar(utiles).slice(0, 20).map((correcto) => ({
      correcto,
      opciones: mezclar([correcto, ...mezclar(utiles.filter((o) => o.char !== correcto.char)).slice(0, 3)]),
      hayLectura: lecturas(correcto).length > 0,
      lecturaBuena: lecturas(correcto)[0] ?? "",
      opcionesLectura: mezclar([
        lecturas(correcto)[0] ?? "",
        ...mezclar(conLectura.filter((o) => o.char !== correcto.char))
          .slice(0, 3).map((o) => lecturas(o)[0]),
      ].filter(Boolean)),
    }));
  }, [kanji]);

  const [n, setN] = useState(0);
  const [fase, setFase] = useState<"significado" | "esperando" | "lectura">("significado");
  const [elegido, setElegido] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [guardado, setGuardado] = useState(false);

  const q = preguntas[n];

  const siguiente = useCallback(() => {
    setElegido(null);
    setFase("significado");
    setN((v) => v + 1);
  }, []);

  // La cuenta atrás de la fase de lectura.
  useEffect(() => {
    if (fase !== "lectura" || elegido !== null) return;
    const t = setTimeout(() => {
      setElegido("__tiempo__");
      if (q) anotar("gramatica", `kanji-lectura:${q.correcto.char}`, false);
      setTimeout(siguiente, 1100);
    }, SEGUNDOS * 1000);
    return () => clearTimeout(t);
  }, [fase, elegido, q, siguiente]);

  if (!preguntas.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button></div>
        <div className="escena-centro"><p>{t("kan.sinTest")}</p></div>
      </div>
    );
  }

  if (n >= preguntas.length) {
    const pct = Math.round((puntos / preguntas.length) * 100);
    if (!guardado) { registrarTest(`kanji:${titulo}`, pct); setGuardado(true); }
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button></div>
        <div className="escena-centro">
          <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--acento)" }}>
            {pct >= 70 ? "合格" : "再挑戦"}
          </span>
          <h2 style={{ margin: 0, fontSize: 30 }}>{pct}%</h2>
          <p className="silencio" style={{ margin: 0 }}>
            {t("kan.puntos", { a: puntos, n: preguntas.length })}
          </p>
          <button className="btn primario" style={{ marginTop: 14 }} onClick={cerrar}>{t("com.volver")}</button>
        </div>
      </div>
    );
  }

  const sig = (k: Kanji) => sigIdioma(k, idioma);

  const responderSignificado = (op: Kanji) => {
    if (elegido !== null) return;
    setElegido(op.char);
    const bien = op.char === q.correcto.char;
    if (bien) setPuntos((p) => p + 0.5);
    anotar("gramatica", `kanji:${q.correcto.char}`, bien);
    if (bien) {
      setTimeout(() => {
        setElegido(null);
        if (q.hayLectura) setFase("esperando"); else siguiente();
      }, 420);
    }
    // Si falla, se queda para que vea el acierto y pulse él.
  };

  const responderLectura = (l: string) => {
    if (elegido !== null) return;
    setElegido(l);
    const bien = l === q.lecturaBuena;
    if (bien) setPuntos((p) => p + 0.5);
    anotar("gramatica", `kanji-lectura:${q.correcto.char}`, bien);
    if (bien) setTimeout(siguiente, 420);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / preguntas.length) * 100}%` }} />
        </div>
        <ConmutadoresJp />
        <span className="tenue">{puntos} pt · {n + 1}/{preguntas.length}</span>
      </div>

      <div className="escena-centro">
        <span className="etiqueta">
          {fase === "significado" ? "¿Qué significa?"
            : fase === "esperando" ? "Bien. ¿Y cómo se lee?"
            : `¡${SEGUNDOS} segundos!`}
        </span>
        <div className="jp jp-grande" style={{ fontSize: 78 }}>{q.correcto.char}</div>
        {fase !== "significado" && (
          <p className="silencio" style={{ margin: 0 }}>{sig(q.correcto)}</p>
        )}
        {elegido !== null && (
          <p className="tenue revelado" style={{ margin: 0 }}>
            <span className="jp">音</span> {q.correcto.on.join("・") || "—"}　
            <span className="jp">訓</span> {q.correcto.kun.join("・") || "—"}
          </p>
        )}
        {fase === "lectura" && (
          <div className={`cuenta ${elegido === null ? "corriendo" : ""}`}><i /></div>
        )}
      </div>

      <div className="opciones" style={{ margin: "0 auto" }}>
        {elegido !== null && elegido !== q.correcto.char && elegido !== q.lecturaBuena && (
          <button className="btn primario" style={{ minHeight: 50 }}
                  onClick={() => {
                    setElegido(null);
                    if (fase === "significado" && q.hayLectura) setFase("esperando");
                    else siguiente();
                  }}>
            Siguiente <IcDerecha size={15} />
          </button>
        )}
        {fase === "significado" && q.opciones.map((op) => {
          const bien = op.char === q.correcto.char;
          const clase = elegido === null ? "" : bien ? "bien" : elegido === op.char ? "mal" : "";
          return (
            <button key={op.char} className={`opcion ${clase}`} onClick={() => responderSignificado(op)}>
              {sig(op)}
            </button>
          );
        })}

        {fase === "esperando" && (
          <button className="btn primario" style={{ minHeight: 54 }} onClick={() => setFase("lectura")}>
            Ver las opciones de lectura
          </button>
        )}

        {fase === "lectura" && q.opcionesLectura.map((l) => {
          const bien = l === q.lecturaBuena;
          const clase = elegido === null ? "" : bien ? "bien" : elegido === l ? "mal" : "";
          return (
            <button key={l} className={`opcion revelado ${clase}`} onClick={() => responderLectura(l)}>
              <span className="jp" style={{ fontSize: 22 }}>{l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
