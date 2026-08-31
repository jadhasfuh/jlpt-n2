"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Palabra, Unidad } from "@/lib/tipos";
import { anotar } from "@/lib/progreso";
import { BotonFurigana } from "./Ajustes";
import { alCargarVoces, callar, decir, hayVozJaponesa } from "@/lib/voz";
import { IcCerrar, IcDerecha, IcOtraVez, IcReproducir } from "./Iconos";
import { useAjustes } from "./Ajustes";
import { significado as sig } from "@/lib/idioma";

// Alturas de la onda. Fijas a propósito: es una figura, no un medidor — no
// tenemos progreso real del sintetizador y fingirlo sería mentir.
const ONDA = [14, 22, 33, 26, 40, 31, 19, 36, 24, 38, 28, 17, 30, 21, 12];

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/**
 * Ejercicio de oído. Alterna dos cosas distintas:
 *   · escuchar y elegir el SIGNIFICADO  (¿lo entiendo?)
 *   · escuchar y elegir la ESCRITURA    (¿sé qué palabra es?)
 * La segunda es la que descubre las palabras que uno «reconoce» sólo por verlas.
 */
export function Escucha({ unidad, palabras, cerrar }: {
  unidad: Unidad; palabras: Palabra[]; cerrar: () => void;
}) {
  const { idioma, t } = useAjustes();
  const [hayVoz, setHayVoz] = useState(true);
  useEffect(() => alCargarVoces(() => setHayVoz(hayVozJaponesa())), []);
  useEffect(() => () => callar(), []);

  const preguntas = useMemo(() => {
    const utiles = palabras.filter((p) => sig(p, idioma).trim());
    return mezclar(utiles).map((correcta, i) => ({
      correcta,
      modo: i % 2 === 0 ? ("significado" as const) : ("escritura" as const),
      opciones: mezclar([correcta, ...mezclar(utiles.filter((o) => o.id !== correcta.id)).slice(0, 3)]),
    }));
  }, [palabras, idioma]);

  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [rendida, setRendida] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [sonando, setSonando] = useState(false);
  const [lento, setLento] = useState(false);
  const q = preguntas[n];

  const reproducir = useCallback((rate?: number) => {
    if (!q) return;
    setSonando(true);
    decir(q.correcta.escritura, { rate, alTerminar: () => setSonando(false) });
  }, [q]);

  // Al entrar en cada palabra suena una vez sola. Depende sólo de `n` a
  // propósito: si escuchara a `reproducir` o a `lento`, cambiar la velocidad
  // volvería a disparar el audio por su cuenta.
  useEffect(() => { reproducir(lento ? 0.55 : undefined); }, [n]);

  const cabeza = (
    <div className="escena-cabeza">
      <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
    </div>
  );

  if (!hayVoz) {
    return (
      <div className="escena">
        {cabeza}
        <div className="escena-centro">
          <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--tinta-3)" }}>無音</span>
          <h2 style={{ margin: 0, fontSize: 19 }}>{t("esc.sinVoz")}</h2>
          <p style={{ maxWidth: 380, fontSize: 13, color: "var(--tinta-2)" }}>
            {t("esc.sinVozSub")}
          </p>
          <button className="btn primario" onClick={cerrar}>{t("com.volver")}</button>
        </div>
      </div>
    );
  }

  if (!preguntas.length) {
    return (
      <div className="escena">
        {cabeza}
        <div className="escena-centro"><p>{t("test.sinDefinicion")}</p></div>
      </div>
    );
  }

  if (n >= preguntas.length) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    return (
      <div className="escena">
        {cabeza}
        <div className="escena-centro">
          <div className="halo" />
          <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--acento)" }}>聴解</span>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>{pct}%</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
            {t("esc.deOido", { a: aciertos, n: preguntas.length })}
          </p>
          <button className="btn primario" style={{ marginTop: 14 }} onClick={cerrar}>{t("com.volver")}</button>
        </div>
      </div>
    );
  }

  const resuelta = elegida !== null || rendida;

  const responder = (op: Palabra) => {
    if (resuelta) return;
    setElegida(op.id);
    const bien = op.id === q.correcta.id;
    if (bien) setAciertos((a) => a + 1);
    anotar("palabras", q.correcta.id, bien);
    // Sin salto automático: aquí lo valioso es mirar la respuesta con calma.
  };

  const rendirse = () => {
    if (resuelta) return;
    setRendida(true);
    anotar("palabras", q.correcta.id, false);
  };

  const siguiente = () => { setElegida(null); setRendida(false); setN((v) => v + 1); };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / preguntas.length) * 100}%` }} />
        </div>
        <BotonFurigana />
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>{n + 1}/{preguntas.length}</span>
        <span className="pastilla"><span className="jp">聴解</span></span>
      </div>

      <div className="escena-centro" style={{ flex: "0 0 auto", padding: "12px 0" }}>
        <div className="halo" style={{ width: 300, height: 300 }} />
        <span className="etiqueta">
          {t(q.modo === "significado" ? "esc.elegirSig" : "esc.elegirPal")}
        </span>
        <button
          onClick={() => reproducir(lento ? 0.55 : undefined)}
          aria-label={t("com.reproducir")}
          style={{
            width: 112, height: 112, borderRadius: "50%", display: "grid", placeItems: "center",
            border: "1px solid var(--acento)",
            background: "color-mix(in srgb, var(--acento) 12%, transparent)",
            color: "var(--acento)", marginTop: 4,
          }}
        >
          <IcReproducir size={38} weight="fill" />
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40, marginTop: 4 }}>
          {ONDA.map((h, k) => (
            <i key={k} style={{
              display: "block", width: 3, height: h, borderRadius: 2,
              background: `color-mix(in srgb, var(--acento) ${100 - k * 5}%, var(--acento-900))`,
              opacity: sonando ? 1 : .45,
              transition: "opacity .2s ease-out",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button className="btn chico" onClick={() => reproducir(lento ? 0.55 : undefined)}>
            <IcOtraVez size={14} /> {t("com.otraVez")}
          </button>
          <button className={`btn chico ${lento ? "encendido" : ""}`}
                  onClick={() => { setLento(!lento); reproducir(lento ? undefined : 0.55); }}>
            0,75×
          </button>
        </div>

        {resuelta && (
          <div className="revelado" style={{ textAlign: "center", marginTop: 6 }}>
            <p className="jp" style={{ fontSize: 26, margin: 0, fontWeight: 500 }}>
              {q.correcta.escritura}
              {q.correcta.lectura !== q.correcta.escritura && (
                <span className="tenue">　{q.correcta.lectura}</span>
              )}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 14 }}>{sig(q.correcta, idioma)}</p>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="opciones" style={{ margin: "0 auto" }}>
          {q.opciones.map((op) => {
            const bien = op.id === q.correcta.id;
            const clase = !resuelta ? "" : bien ? "bien" : elegida === op.id ? "mal" : "";
            return (
              <button key={op.id} className={`opcion ${clase}`} onClick={() => responder(op)}>
                {/* Nunca la lectura en kana: delataría la respuesta antes de oírla. */}
                {q.modo === "significado"
                  ? <span>{sig(op, idioma)}</span>
                  : <span className="jp" style={{ fontSize: 21 }}>{op.escritura}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {resuelta ? (
        <button className="btn primario" style={{ width: "100%", minHeight: 46, marginTop: 10 }}
                onClick={siguiente}>
          {t("com.siguiente")} <IcDerecha size={15} />
        </button>
      ) : (
        <button className="btn fantasma" style={{ width: "100%", marginTop: 10, fontSize: 12 }}
                onClick={rendirse}>
          {t("esc.noReconozco")}
        </button>
      )}
    </div>
  );
}
