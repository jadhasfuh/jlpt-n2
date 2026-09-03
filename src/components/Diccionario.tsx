"use client";
import { useEffect, useRef, useState } from "react";
import type { Palabra } from "@/lib/tipos";
import { useAjustes } from "./Ajustes";
import { significado as sig, significadoSecundario as sigSec } from "@/lib/idioma";

type Caja = { x: number; y: number; palabras: Palabra[] };

const JAPONES = /[぀-ヿ一-鿿々ー]/;
/** Cuánto texto se manda: el servidor se queda con la palabra más larga que
 *  empiece ahí, así que sobra con una ventana corta. */
const VENTANA = 10;
/** Nada de diccionario encima de algo en lo que se pulsa para otra cosa. */
const INTERACTIVO = "button, a, input, textarea, select, label, [role='button']";

/** El trozo de japonés que empieza en el carácter tocado.
 *
 *  No basta con el nodo de texto que se ha tocado: el furigana parte la frase
 *  en trozos —`<ruby>話<rt>はな</rt></ruby>しかける` son dos nodos con un `<rt>`
 *  en medio— y el color de los kanji la parte todavía más. Se recorre el
 *  bloque hacia delante, saltándose los `<rt>`, hasta juntar la ventana. */
function desdeElPunto(x: number, y: number): string {
  const d = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  let nodo: Node | null = null;
  let desde = 0;
  if (d.caretRangeFromPoint) {
    const r = d.caretRangeFromPoint(x, y);
    if (r) { nodo = r.startContainer; desde = r.startOffset; }
  } else if (d.caretPositionFromPoint) {
    const p = d.caretPositionFromPoint(x, y);
    if (p) { nodo = p.offsetNode; desde = p.offset; }
  }
  if (!nodo || nodo.nodeType !== Node.TEXT_NODE) return "";
  // El furigana va en su propio <rt>: si se toca ahí, no es la palabra.
  if (nodo.parentElement?.closest("rt")) return "";

  const bloque = nodo.parentElement?.closest("p, li, td, div, span, section, body") ?? document.body;
  const paseo = document.createTreeWalker(bloque, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest("rt") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  let junta = "";
  let visto = false;
  while (paseo.nextNode()) {
    const t = paseo.currentNode;
    if (!visto && t !== nodo) continue;
    const texto = t.textContent ?? "";
    for (let i = (t === nodo && !visto ? desde : 0); i < texto.length; i++) {
      if (!JAPONES.test(texto[i])) return junta;
      junta += texto[i];
      if (junta.length >= VENTANA) return junta;
    }
    visto = true;
  }
  return junta;
}

/**
 * Diccionario interno: aparece el significado sin salir de la lección.
 *
 * En el móvil bastaba con un toque, pero antes había que seleccionar la
 * palabra —pulsación larga, arrastrar los agarraderos— y volver a tocar. Ahora
 * un toque sobre el japonés basta: se mira qué carácter se ha tocado, se manda
 * la decena de caracteres que siguen y el servidor devuelve la palabra más
 * larga que empiece ahí, que es como busca cualquier diccionario emergente.
 * Seleccionar sigue funcionando, que en el escritorio es lo natural.
 */
export function Diccionario() {
  const [caja, setCaja] = useState<Caja | null>(null);
  const { significado, idioma } = useAjustes();
  const ultima = useRef("");

  useEffect(() => {
    let cancelado = false;

    const consultar = async (texto: string, x: number, y: number) => {
      if (!texto || !JAPONES.test(texto)) { setCaja(null); return; }
      try {
        const r = await fetch(`/api/diccionario?q=${encodeURIComponent(texto)}`);
        const { resultados } = (await r.json()) as { resultados: Palabra[] };
        if (cancelado) return;
        setCaja(resultados.length ? { x, y, palabras: resultados } : null);
      } catch { /* sin conexión: no pasa nada */ }
    };

    const alTocar = (e: MouseEvent | TouchEvent) => {
      const destino = e.target as HTMLElement | null;
      if (!destino) return;
      // Tocar dentro del globo no lo cierra ni lo recalcula.
      if (destino.closest?.(".dicc")) return;
      if (destino.closest?.(INTERACTIVO)) { setCaja(null); return; }

      const punto = "changedTouches" in e && e.changedTouches[0]
        ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

      // Si hay algo seleccionado, manda la selección: es lo que se ha pedido.
      const sel = window.getSelection();
      const elegido = sel?.toString().trim() ?? "";
      let texto = "";
      let caret = punto;
      if (elegido && elegido.length <= 20 && JAPONES.test(elegido)) {
        texto = elegido;
        const r = sel!.getRangeAt(0).getBoundingClientRect();
        caret = { x: r.left, y: r.bottom };
      } else {
        texto = desdeElPunto(punto.x, punto.y);
      }
      if (!texto) { setCaja(null); ultima.current = ""; return; }
      // Segundo toque en la misma palabra: se cierra.
      if (texto === ultima.current && caja) { setCaja(null); ultima.current = ""; return; }
      ultima.current = texto;
      void consultar(texto, caret.x, caret.y + 12);
    };

    // `click` cubre ratón y toque; `touchend` no hace falta y duplicaba.
    document.addEventListener("click", alTocar);
    return () => {
      cancelado = true;
      document.removeEventListener("click", alTocar);
    };
  }, [caja]);

  if (!caja) return null;
  const ancho = typeof window !== "undefined" ? window.innerWidth : 400;
  const alto = typeof window !== "undefined" ? window.innerHeight : 800;
  const x = Math.max(12, Math.min(caja.x, ancho - 320));
  // Si no cabe debajo, se pone encima del dedo.
  const y = caja.y > alto - 190 ? Math.max(12, caja.y - 210) : caja.y;

  return (
    <div className="dicc" style={{ left: x, top: y }}>
      {caja.palabras.map((p, i) => (
        <div key={p.id} style={{ marginTop: i ? 12 : 0 }}>
          <div className="jp" style={{ fontSize: 20 }}>
            {p.escritura}
            {p.lectura !== p.escritura && <span className="tenue">　{p.lectura}</span>}
          </div>
          <div style={{ fontSize: 13.5 }}>{sig(p, idioma)}</div>
          {p.registro.length > 0 && <div className="tenue"><em>{p.registro.join(" · ")}</em></div>}
          {significado && sigSec(p, idioma) && <div className="tenue">{sigSec(p, idioma)}</div>}
        </div>
      ))}
    </div>
  );
}
