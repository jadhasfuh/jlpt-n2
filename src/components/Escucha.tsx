"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Palabra, Unidad } from "@/lib/tipos";
import { anotar } from "@/lib/progreso";
import { BotonFurigana } from "./Ajustes";
import { alCargarVoces, callar, decir, hayVozJaponesa } from "@/lib/voz";

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
  const [hayVoz, setHayVoz] = useState(true);
  useEffect(() => alCargarVoces(() => setHayVoz(hayVozJaponesa())), []);
  useEffect(() => () => callar(), []);

  const preguntas = useMemo(() => {
    const utiles = palabras.filter((p) => (p.es || p.en).trim());
    return mezclar(utiles).map((correcta, i) => ({
      correcta,
      modo: i % 2 === 0 ? ("significado" as const) : ("escritura" as const),
      opciones: mezclar([correcta, ...mezclar(utiles.filter((o) => o.id !== correcta.id)).slice(0, 3)]),
    }));
  }, [palabras]);

  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const q = preguntas[n];

  const reproducir = useCallback(() => {
    if (q) decir(q.correcta.escritura);
  }, [q]);

  useEffect(() => { reproducir(); }, [reproducir]);

  if (!hayVoz) {
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 40 }}>🔇</div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Este dispositivo no tiene voz japonesa</h2>
          <p className="silencio" style={{ maxWidth: 380 }}>
            En iPhone y Mac suele venir instalada. En Android se añade desde
            Ajustes → Idiomas → Salida de texto a voz, descargando el paquete de japonés.
          </p>
          <button className="btn primario" onClick={cerrar}>Volver</button>
        </div>
      </div>
    );
  }

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
    return (
      <div className="escena">
        <div className="escena-cabeza"><button className="btn fantasma" onClick={cerrar}>✕</button></div>
        <div className="escena-centro">
          <div style={{ fontSize: 48 }}>{pct >= 80 ? "👂" : "💪"}</div>
          <h2 style={{ margin: 0, fontSize: 30 }}>{pct}%</h2>
          <p className="silencio" style={{ margin: 0 }}>{aciertos} de {preguntas.length} de oído</p>
          <button className="btn primario" style={{ marginTop: 14 }} onClick={cerrar}>Volver</button>
        </div>
      </div>
    );
  }

  const responder = (op: Palabra) => {
    if (elegida !== null) return;
    setElegida(op.id);
    const bien = op.id === q.correcta.id;
    if (bien) setAciertos((a) => a + 1);
    anotar("palabras", q.correcta.id, bien);
    setTimeout(() => { setElegida(null); setN((v) => v + 1); }, bien ? 500 : 1400);
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
        <span className="etiqueta">
          {q.modo === "significado" ? "Escucha y elige el significado" : "Escucha y elige la palabra"}
        </span>
        <button className="btn primario" style={{ width: 96, height: 96, borderRadius: "50%", fontSize: 38 }}
                onClick={reproducir} aria-label="Repetir">🔊</button>
        <button className="btn fantasma" onClick={() => decir(q.correcta.escritura, { rate: 0.55 })}>
          más despacio
        </button>
        {elegida !== null && (
          <p className="jp revelado" style={{ fontSize: 26, margin: 0 }}>
            {q.correcta.escritura}
            {q.correcta.lectura !== q.correcta.escritura && (
              <span className="tenue">　{q.correcta.lectura}</span>
            )}
          </p>
        )}
      </div>

      <div className="opciones" style={{ margin: "0 auto" }}>
        {q.opciones.map((op) => {
          const bien = op.id === q.correcta.id;
          const clase = elegida === null ? "" : bien ? "bien" : elegida === op.id ? "mal" : "";
          return (
            <button key={op.id} className={`opcion ${clase}`} onClick={() => responder(op)}>
              {q.modo === "significado"
                ? (op.es || op.en)
                : <span className="jp" style={{ fontSize: 22 }}>{op.escritura}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
