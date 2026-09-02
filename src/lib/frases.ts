"use client";
import { useEffect, useState } from "react";
import type { Lectura } from "./tipos";
import type { Idioma } from "./idioma";
import { soloTexto } from "./voz";

export type Frase = { html: string; texto: string; es?: string };

/**
 * Parte el cuerpo de una lectura en frases, conservando el marcado (furigana y
 * gramática subrayada). El cuerpo es HTML en línea sin bloques, así que cortar
 * por 。 no parte ninguna etiqueta por la mitad.
 */
export function frasesDeLectura(cuerpo: string, traduccion?: string): Frase[] {
  const trozos = cuerpo.split(/(?<=[。！？])/).map((t) => t.trim()).filter(Boolean);
  const es = (traduccion ?? "").split(/(?<=[.!?])\s+/).map((t) => t.trim()).filter(Boolean);
  // Sólo se emparejan si hay tantas traducciones como frases: colgarle a una
  // frase la traducción de otra enseñaría algo falso, y es peor que no poner nada.
  const alineadas = es.length > 0 && es.length === trozos.length;
  return trozos.map((html, i) => ({
    html, texto: soloTexto(html), es: alineadas ? es[i] : undefined,
  }));
}

/** La primera frase de la lectura donde aparece esa palabra. */
export function ejemploDe(frases: Frase[], escritura: string): Frase | null {
  if (!escritura) return null;
  return frases.find((f) => f.texto.includes(escritura)) ?? null;
}

/**
 * Las frases de la lectura de una unidad, para poder enseñar la palabra dentro
 * de una frase de verdad. Salen de la propia lectura de la unidad, así que
 * nunca traen kanji ni gramática por encima de su nivel. Si la unidad todavía
 * no tiene lectura, se devuelve una lista vacía y quien llama no enseña nada.
 */
export function useFrases(unidadId: string, idioma: Idioma = "es"): Frase[] {
  const [frases, setFrases] = useState<Frase[]>([]);
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`/api/lectura/${unidadId}`);
        const { lectura } = (await r.json()) as { lectura: Lectura | null };
        // La frase de ejemplo se traduce al idioma de la interfaz: con la
        // interfaz en inglés, debajo del japonés salía español.
        const trad = idioma === "en" ? (lectura?.traduccion_en || lectura?.traduccion)
                                     : lectura?.traduccion;
        if (vivo && lectura) setFrases(frasesDeLectura(lectura.cuerpo, trad));
      } catch { /* sin lectura, sin ejemplos */ }
    })();
    return () => { vivo = false; };
  }, [unidadId, idioma]);
  return frases;
}
