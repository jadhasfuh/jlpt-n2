"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Palabra, Unidad } from "@/lib/tipos";
import { Jp } from "./Jp";
import { BotonFurigana } from "./Ajustes";
import { anotar, medalla, registrarTest } from "@/lib/progreso";

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

  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [guardado, setGuardado] = useState(false);
  // Las falladas se reponen al final de la misma tanda.
  const [repesca, setRepesca] = useState<number[]>([]);

  if (!preguntas.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro"><p>Esta unidad no tiene palabras con definición.</p></div>
      </div>
    );
  }

  if (n >= preguntas.length) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    if (!guardado) { registrarTest(unidad.id, pct); setGuardado(true); }
    const m = medalla(pct);
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 52 }}>{m || (pct >= 50 ? "👍" : "💪")}</div>
          <h2 style={{ margin: 0, fontSize: 30 }}>{pct}%</h2>
          <p className="silencio" style={{ margin: 0 }}>
            {aciertos} de {preguntas.length}
            {pct >= 80 ? " · ¡aprobado!" : " · repasa y vuelve a intentarlo"}
          </p>
          {repesca.length > 0 && (
            <p className="tenue" style={{ margin: 0 }}>
              {repesca.length} {repesca.length === 1 ? "palabra vuelve" : "palabras vuelven"} pronto en Repaso
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn" onClick={cerrar}>Volver a la unidad</button>
            {siguiente && pct >= 80 && (
              <Link className="btn primario" href={siguiente}>Siguiente unidad →</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const q = preguntas[n];
  const responder = (op: Palabra) => {
    if (elegida !== null) return;
    setElegida(op.id);
    const bien = op.id === q.palabra.id;
    if (bien) setAciertos((a) => a + 1);
    anotar("palabras", q.palabra.id, bien);
    if (!bien && !repesca.includes(q.palabra.id)) setRepesca((r) => [...r, q.palabra.id]);
    // Acertar sigue solo; fallar espera a que mires cuál era.
    if (bien) setTimeout(() => { setElegida(null); setN((v) => v + 1); }, 480);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="btn fantasma" onClick={cerrar}>✕</button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / preguntas.length) * 100}%` }} />
        </div>
        <BotonFurigana />
        <span className="tenue">{n + 1}/{preguntas.length}</span>
      </div>

      <div className="escena-centro">
        {/* Al responder se enseña la lectura y el color aunque estén apagados:
            si fallas, lo útil es ver la palabra entera, no media. */}
        <Jp escritura={q.palabra.escritura} lectura={q.palabra.lectura}
            clase="jp-grande" revelar={elegida !== null} />
      </div>

      <div className="opciones" style={{ margin: "0 auto" }}>
        {elegida !== null && elegida !== q.palabra.id && (
          <button className="btn primario" style={{ minHeight: 50 }}
                  onClick={() => { setElegida(null); setN((v) => v + 1); }}>
            Siguiente →
          </button>
        )}
        {q.opciones.map((op) => {
          const correcta = op.id === q.palabra.id;
          const clase = elegida === null ? "" : correcta ? "bien" : elegida === op.id ? "mal" : "";
          return (
            <button key={op.id} className={`opcion ${clase}`} onClick={() => responder(op)}>
              {op.es || op.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
