"use client";
import { useMemo, useState } from "react";
import type { Gramatica, Palabra, Unidad } from "@/lib/tipos";
import { Jp, BotonVoz } from "./Jp";
import { BotonFurigana } from "./Ajustes";
import { anotar, terminarPractica, XP_NUEVA, XP_UNIDAD } from "@/lib/progreso";

type Carta =
  | { tipo: "palabra"; id: number; frente: string; lectura: string; reverso: string; extra: string }
  | { tipo: "gramatica"; id: string; frente: string; lectura: string; reverso: string; extra: string };

/** Práctica: tarjetas con autoevaluación. Entra vocabulario y, si la unidad la
 *  trae, también la gramática — que es donde de verdad se afianza. */
export function Practica({ unidad, palabras, gramatica, cerrar }: {
  unidad: Unidad; palabras: Palabra[]; gramatica: Gramatica[]; cerrar: () => void;
}) {
  const cartas = useMemo<Carta[]>(() => [
    ...palabras.map((p) => ({
      tipo: "palabra" as const, id: p.id, frente: p.escritura, lectura: p.lectura,
      reverso: p.es || p.en, extra: p.en,
    })),
    ...gramatica.map((g) => ({
      tipo: "gramatica" as const, id: g.id, frente: g.forma, lectura: g.lectura,
      reverso: g.es, extra: g.en,
    })),
  ], [palabras, gramatica]);

  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [ganado, setGanado] = useState(0);
  // Lo que fallas vuelve a salir antes de terminar: es lo que más fija.
  const [cola, setCola] = useState<Carta[]>([]);
  const [segundaVuelta, setSegundaVuelta] = useState(false);

  const mazo = segundaVuelta ? cola : cartas;

  // Al acabar la primera pasada, si quedaron fallos se repasan.
  if (!segundaVuelta && i >= cartas.length && cola.length > 0) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 44 }}>🔁</div>
          <h2 style={{ margin: 0 }}>Quedan {cola.length} por afianzar</h2>
          <p className="silencio" style={{ margin: 0 }}>
            Las que no te salieron vuelven ahora, antes de cerrar.
          </p>
          <button className="btn primario" style={{ marginTop: 12 }}
                  onClick={() => { setSegundaVuelta(true); setI(0); setVisible(false); }}>
            Repasarlas
          </button>
        </div>
      </div>
    );
  }

  if (i >= mazo.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 48 }}>🎌</div>
          <h2 style={{ margin: 0 }}>Práctica terminada</h2>
          <p className="silencio" style={{ margin: 0 }}>
            {cartas.length} tarjetas · +{ganado + XP_UNIDAD} XP
            {cola.length > 0 && ` · ${cola.length} para la próxima`}
          </p>
          <button className="btn primario" style={{ marginTop: 12 }}
                  onClick={() => { terminarPractica(unidad.id); cerrar(); }}>
            Volver a la unidad
          </button>
        </div>
      </div>
    );
  }

  const c = mazo[i];
  const responder = (acierto: boolean) => {
    anotar(c.tipo === "palabra" ? "palabras" : "gramatica", c.id, acierto);
    if (acierto) {
      setGanado((g) => g + XP_NUEVA);
      if (segundaVuelta) setCola((q) => q.filter((x) => x.id !== c.id));
    } else if (!segundaVuelta && !cola.some((x) => x.id === c.id)) {
      setCola((q) => [...q, c]);
    }
    setVisible(false);
    setI(i + 1);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="btn fantasma" onClick={cerrar}>✕</button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(i / mazo.length) * 100}%` }} />
        </div>
        <BotonFurigana />
        <span className="tenue">
          {segundaVuelta && "🔁 "}{i + 1}/{mazo.length}
        </span>
      </div>

      <div className="escena-centro">
        {c.tipo === "gramatica" && <span className="etiqueta">文法</span>}
        <Jp escritura={c.frente} lectura={c.lectura} clase="jp-grande" revelar={visible} />
        <BotonVoz texto={c.frente} />
        {visible && (
          <>
            <p style={{ fontSize: 18, margin: "6px 0 0" }}>{c.reverso}</p>
            <p className="tenue" style={{ margin: 0 }}>{c.extra}</p>
          </>
        )}
      </div>

      <div className="opciones" style={{ margin: "0 auto", flexDirection: "row" }}>
        {visible ? (
          <>
            <button className="btn" style={{ flex: 1 }} onClick={() => responder(false)}>No la sabía</button>
            <button className="btn primario" style={{ flex: 1 }} onClick={() => responder(true)}>La sabía</button>
          </>
        ) : (
          <button className="btn primario" style={{ flex: 1 }} onClick={() => setVisible(true)}>
            Ver significado
          </button>
        )}
      </div>
    </div>
  );
}
