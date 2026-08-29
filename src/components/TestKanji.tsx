"use client";
import { useMemo, useState } from "react";
import type { Kanji } from "@/lib/tipos";
import { anotar, medalla, registrarTest } from "@/lib/progreso";

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** Test de kanji: alterna «¿qué significa?» y «¿cuál es este significado?». */
export function TestKanji({ kanji, titulo, cerrar }: {
  kanji: Kanji[]; titulo: string; cerrar: () => void;
}) {
  const preguntas = useMemo(() => {
    const utiles = kanji.filter((k) => (k.es || k.en.join(", ")).trim());
    return mezclar(utiles).slice(0, 20).map((correcto, i) => ({
      correcto,
      alReves: i % 3 === 2,   // una de cada tres al revés
      opciones: mezclar([correcto, ...mezclar(utiles.filter((o) => o.char !== correcto.char)).slice(0, 3)]),
    }));
  }, [kanji]);

  const [n, setN] = useState(0);
  const [elegido, setElegido] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [guardado, setGuardado] = useState(false);

  if (!preguntas.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro"><p>No hay kanji suficientes para un test.</p></div>
      </div>
    );
  }

  if (n >= preguntas.length) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    if (!guardado) { registrarTest(`kanji:${titulo}`, pct); setGuardado(true); }
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 52 }}>{medalla(pct) || (pct >= 50 ? "👍" : "💪")}</div>
          <h2 style={{ margin: 0, fontSize: 30 }}>{pct}%</h2>
          <p className="silencio" style={{ margin: 0 }}>{aciertos} de {preguntas.length} kanji</p>
          <button className="btn primario" style={{ marginTop: 14 }} onClick={cerrar}>Volver</button>
        </div>
      </div>
    );
  }

  const q = preguntas[n];
  const sig = (k: Kanji) => k.es || k.en.join(", ");
  const responder = (op: Kanji) => {
    if (elegido !== null) return;
    setElegido(op.char);
    const bien = op.char === q.correcto.char;
    if (bien) setAciertos((a) => a + 1);
    anotar("gramatica", `kanji:${q.correcto.char}`, bien);
    setTimeout(() => { setElegido(null); setN((v) => v + 1); }, bien ? 480 : 1200);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="btn fantasma" onClick={cerrar}>✕</button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / preguntas.length) * 100}%` }} />
        </div>
        <span className="tenue">{n + 1}/{preguntas.length}</span>
      </div>

      <div className="escena-centro">
        {q.alReves ? (
          <>
            <span className="etiqueta">¿Qué kanji es?</span>
            <p style={{ fontSize: 22, margin: 0 }}>{sig(q.correcto)}</p>
          </>
        ) : (
          <>
            <span className="etiqueta">¿Qué significa?</span>
            <div className="jp jp-grande" style={{ fontSize: 78 }}>{q.correcto.char}</div>
          </>
        )}
      </div>

      <div className="opciones" style={{ margin: "0 auto" }}>
        {q.opciones.map((op) => {
          const correcto = op.char === q.correcto.char;
          const clase = elegido === null ? "" : correcto ? "bien" : elegido === op.char ? "mal" : "";
          return (
            <button key={op.char} className={`opcion ${clase}`} onClick={() => responder(op)}>
              {q.alReves ? <span className="jp" style={{ fontSize: 30 }}>{op.char}</span> : sig(op)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
