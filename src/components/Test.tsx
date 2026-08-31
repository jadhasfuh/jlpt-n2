"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Palabra, Unidad } from "@/lib/tipos";
import { Jp, JpEnLinea } from "./Jp";
import { BotonFurigana } from "./Ajustes";
import { anotar, cuandoToca, leerProgreso, medalla, registrarTest } from "@/lib/progreso";
import { ejemploDe, useFrases } from "@/lib/frases";
import { IcBien, IcCerrar, IcDerecha } from "./Iconos";

const LETRAS = ["A", "B", "C", "D"];

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Test: japonés -> significado, cuatro opciones, con nota al final. */
export function Test({ unidad, palabras, cerrar, siguiente }: {
  unidad: Unidad; palabras: Palabra[]; cerrar: () => void; siguiente: string | null;
}) {
  const preguntas = useMemo(() => {
    const utiles = palabras.filter((p) => (p.es || p.en).trim());
    return mezclar(utiles).map((correcta) => ({
      palabra: correcta,
      opciones: mezclar([correcta, ...mezclar(utiles.filter((o) => o.id !== correcta.id)).slice(0, 3)]),
    }));
  }, [palabras]);

  const frases = useFrases(unidad.id);
  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [vuelve, setVuelve] = useState("");
  // Las falladas se reponen al final de la misma tanda.
  const [repesca, setRepesca] = useState<number[]>([]);

  const cabeza = (
    <div className="escena-cabeza">
      <button className="icono-btn" onClick={cerrar} aria-label="Cerrar"><IcCerrar size={16} /></button>
    </div>
  );

  if (!preguntas.length) {
    return (
      <div className="escena">
        {cabeza}
        <div className="escena-centro"><p>Esta unidad no tiene palabras con definición.</p></div>
      </div>
    );
  }

  if (n >= preguntas.length) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    if (!guardado) { registrarTest(unidad.id, pct); setGuardado(true); }
    return (
      <div className="escena">
        {cabeza}
        <div className="escena-centro">
          <div className="halo" />
          <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--acento)" }}>
            {medalla(pct) ? "合格" : "再挑戦"}
          </span>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>{pct}%</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
            {aciertos} de {preguntas.length}
            {pct >= 80 ? " · ¡aprobado!" : " · repasa y vuelve a intentarlo"}
          </p>
          {repesca.length > 0 && (
            <p className="tenue" style={{ margin: 0 }}>
              {repesca.length} {repesca.length === 1 ? "palabra vuelve" : "palabras vuelven"} pronto en Repaso
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn" onClick={cerrar}>Volver a la unidad</button>
            {siguiente && pct >= 80 && (
              <Link className="btn primario" href={siguiente}>Siguiente unidad <IcDerecha size={14} /></Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const q = preguntas[n];
  const ejemplo = ejemploDe(frases, q.palabra.escritura);

  const responder = (op: Palabra) => {
    if (elegida !== null) return;
    setElegida(op.id);
    const bien = op.id === q.palabra.id;
    if (bien) setAciertos((a) => a + 1);
    anotar("palabras", q.palabra.id, bien);
    setVuelve(cuandoToca(leerProgreso().palabras[String(q.palabra.id)]));
    if (!bien && !repesca.includes(q.palabra.id)) setRepesca((r) => [...r, q.palabra.id]);
  };

  const seguir = () => { setElegida(null); setVuelve(""); setN((v) => v + 1); };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="icono-btn" onClick={cerrar} aria-label="Cerrar"><IcCerrar size={16} /></button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / preguntas.length) * 100}%` }} />
        </div>
        <BotonFurigana />
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>{n + 1}/{preguntas.length}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5,
                       color: "var(--acento-300)", fontVariantNumeric: "tabular-nums" }}>
          <IcBien size={13} /> {aciertos}
        </span>
      </div>

      <div className="escena-centro" style={{ flex: "0 0 auto", padding: "18px 0 14px" }}>
        <span className="etiqueta">¿Qué significa?</span>
        {/* Al responder se enseña la lectura y el color aunque estén apagados:
            si fallas, lo útil es ver la palabra entera, no media. */}
        <Jp escritura={q.palabra.escritura} lectura={q.palabra.lectura}
            clase="jp-grande" revelar={elegida !== null} />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="opciones" style={{ margin: "0 auto" }}>
          {q.opciones.map((op, k) => {
            const correcta = op.id === q.palabra.id;
            const clase = elegida === null ? "" : correcta ? "bien" : elegida === op.id ? "mal" : "";
            return (
              <button key={op.id} className={`opcion ${clase}`} onClick={() => responder(op)}>
                <span className="casilla">
                  {clase === "bien" ? <IcBien size={12} weight="bold" />
                   : clase === "mal" ? <IcCerrar size={12} weight="bold" />
                   : LETRAS[k]}
                </span>
                <span>{op.es || op.en}</span>
                {clase && <span className="marca-op">{clase === "bien" ? "correcta" : "tu respuesta"}</span>}
              </button>
            );
          })}
        </div>

        {/* La explicación sale aquí mismo: mandarla a otra pantalla rompía el ritmo. */}
        {elegida !== null && (
          <div className="explica" style={{ margin: "14px auto 0" }}>
            {ejemplo ? (
              <>
                <JpEnLinea html={ejemplo.html} />
                {ejemplo.es && (
                  <div style={{ fontSize: 11.5, color: "var(--tinta-3)", marginTop: 4 }}>{ejemplo.es}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13 }}>{q.palabra.en}</div>
            )}
            {vuelve && (
              <div className="tenue" style={{ marginTop: 6 }}>
                Vuelve {vuelve === "ahora" ? "en este mismo repaso" : `dentro de ${vuelve}`}.
              </div>
            )}
          </div>
        )}
      </div>

      {elegida !== null && (
        <button className="btn primario" style={{ width: "100%", minHeight: 46, marginTop: 10 }} onClick={seguir}>
          Siguiente <IcDerecha size={15} />
        </button>
      )}
    </div>
  );
}
