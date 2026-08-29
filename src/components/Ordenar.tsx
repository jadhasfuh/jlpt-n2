"use client";
import { useMemo, useState } from "react";
import { useAjustes } from "./Ajustes";
import { colorearHtml } from "@/lib/colores";

/**
 * Ordenar la frase con fichas. En japonés esto suele exigir un analizador
 * morfológico para partir por palabras… salvo que el texto ya venga con
 * <ruby>, que es justo nuestro caso: las fronteras están marcadas.
 */
function trocear(html: string): string[] {
  // Cada ficha es un grupo <ruby> junto con el kana que le sigue: así 住まいは
  // queda entero en vez de partirse en 「住」+「まいは」, y salen unas siete
  // fichas por frase en vez de catorce.
  const piezas: string[] = [];
  const rx = /<ruby>.*?<\/ruby>/g;
  let ultimo = 0;
  let sueltoInicial = "";
  const casos = [...html.matchAll(rx)];

  if (!casos.length) return [html];

  for (let k = 0; k < casos.length; k++) {
    const m = casos[k];
    const antes = html.slice(ultimo, m.index);
    if (k === 0 && antes.trim()) sueltoInicial = antes;
    else if (antes.trim()) piezas.push(antes);      // kana entre dos kanji: va suelto

    const fin = (m.index ?? 0) + m[0].length;
    const siguiente = casos[k + 1]?.index ?? html.length;
    const cola = html.slice(fin, siguiente);
    // El kana pegado al kanji (okurigana + partícula) viaja con él.
    const pegado = cola.match(/^[぀-ヿ、。・ー]{0,4}/)?.[0] ?? "";
    piezas.push(m[0] + pegado);
    ultimo = fin + pegado.length;
  }

  const resto = html.slice(ultimo);
  if (resto.trim()) piezas.push(resto);
  if (sueltoInicial) piezas.unshift(sueltoInicial);
  return piezas.filter((p) => p.replace(/<[^>]+>/g, "").trim());
}

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export function Ordenar({ frases, traduccion }: { frases: string[]; traduccion: string }) {
  const [n, setN] = useState(0);

  /**
   * La traducción viene del texto entero. Si tiene tantas frases como el
   * japonés (pasa en 91 de las 97 lecturas), se empareja una a una: enseñar la
   * traducción completa mientras ordenas una sola frase confundía más que
   * ayudaba.
   */
  const pista = useMemo(() => {
    const es = traduccion.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
    return es.length === frases.length ? es[n] : "";
  }, [traduccion, frases.length, n]);
  const correcta = useMemo(() => trocear(frases[n] ?? ""), [frases, n]);
  const [banco, setBanco] = useState<number[]>(() => mezclar(correcta.map((_, i) => i)));
  const [puestas, setPuestas] = useState<number[]>([]);
  const [revisado, setRevisado] = useState<null | boolean>(null);
  const { furigana, colores } = useAjustes();

  const reiniciar = (indice: number) => {
    const t = trocear(frases[indice] ?? "");
    setBanco(mezclar(t.map((_, i) => i)));
    setPuestas([]);
    setRevisado(null);
    setN(indice);
  };

  if (!frases.length) return null;
  if (correcta.length < 3) {
    return <p className="silencio">Esta frase es demasiado corta para ordenarla.</p>;
  }

  const clase = `jp ${furigana ? "" : "sin-furigana"} ${colores ? "" : "sin-colores"}`;
  const poner = (i: number) => {
    if (revisado !== null) return;
    setPuestas([...puestas, i]);
    setBanco(banco.filter((x) => x !== i));
  };
  const quitar = (i: number) => {
    if (revisado !== null) return;
    setPuestas(puestas.filter((x) => x !== i));
    setBanco([...banco, i]);
  };
  const revisar = () => setRevisado(puestas.every((v, k) => v === k) && puestas.length === correcta.length);

  return (
    <div className="tarjeta" style={{ marginTop: 12 }}>
      <p className="etiqueta">Ordena la frase · {n + 1} de {frases.length}</p>
      {pista
        ? <p className="silencio" style={{ marginTop: 4 }}>{pista}</p>
        : <p className="tenue" style={{ marginTop: 4 }}>Reconstruye la frase con las fichas.</p>}

      <div style={{
        minHeight: 64, border: "1px dashed var(--linea)", borderRadius: 12,
        padding: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        background: revisado === true ? "var(--verde-suave)" : revisado === false ? "var(--acento-suave)" : undefined,
      }}>
        {puestas.length === 0 && <span className="tenue">Toca las fichas de abajo…</span>}
        {puestas.map((i) => (
          <button key={i} className="btn chico" onClick={() => quitar(i)}>
            <span className={clase} dangerouslySetInnerHTML={{ __html: colorearHtml(correcta[i]) }} />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {banco.map((i) => (
          <button key={i} className="btn chico" onClick={() => poner(i)}>
            <span className={clase} dangerouslySetInnerHTML={{ __html: colorearHtml(correcta[i]) }} />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {revisado === null ? (
          <button className="btn primario" disabled={banco.length > 0} onClick={revisar}>
            Comprobar
          </button>
        ) : (
          <>
            <span className="btn" style={{ pointerEvents: "none" }}>
              {revisado ? "✓ correcto" : "✗ no era ese orden"}
            </span>
            <button className="btn" onClick={() => reiniciar(n)}>Otra vez</button>
            {n < frases.length - 1 && (
              <button className="btn primario" onClick={() => reiniciar(n + 1)}>Siguiente frase</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
