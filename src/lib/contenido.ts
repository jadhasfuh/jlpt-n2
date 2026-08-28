import "server-only";
import type { Palabra, Gramatica, Nivel, Seccion, Lectura } from "./tipos";
import vocabularioJson from "../../data/dist/vocabulario.json";
import gramaticaJson from "../../data/dist/gramatica.json";
import nivelesJson from "../../data/dist/niveles.json";
import seccionesJson from "../../data/dist/secciones.json";
import lecturasJson from "../../data/dist/lecturas.json";
import { supabaseServidor } from "./supabase";

// El contenido vive en la base; los JSON del repo son el respaldo con el que
// la app arranca aunque Supabase todavía no esté configurado.
const VOCABULARIO = vocabularioJson as Palabra[];
const GRAMATICA = gramaticaJson as Gramatica[];
const NIVELES = nivelesJson as Nivel[];
const SECCIONES = seccionesJson as Seccion[];
const LECTURAS = new Map((lecturasJson as Lectura[]).map((l) => [l.nivel_id, l]));

const porIdPalabra = new Map(VOCABULARIO.map((p) => [p.id, p]));
const porIdGramatica = new Map(GRAMATICA.map((g) => [g.id, g]));
const porIdNivel = new Map(NIVELES.map((n) => [n.id, n]));

export function secciones(): Seccion[] { return SECCIONES; }
export function niveles(): Nivel[] { return NIVELES; }
export function nivel(id: string): Nivel | undefined { return porIdNivel.get(id); }
export function palabras(ids: number[]): Palabra[] {
  return ids.map((i) => porIdPalabra.get(i)).filter(Boolean) as Palabra[];
}
export function gramaticas(ids: string[]): Gramatica[] {
  return ids.map((i) => porIdGramatica.get(i)).filter(Boolean) as Gramatica[];
}
export function totalPalabras(): number { return VOCABULARIO.length; }
export function totalGramatica(): number { return GRAMATICA.length; }

// Índice del diccionario interno (se consulta desde /api/diccionario).
const indice = new Map<string, Palabra[]>();
for (const p of VOCABULARIO) {
  for (const clave of [p.kanji, p.kana]) {
    if (!clave) continue;
    const lista = indice.get(clave);
    if (lista) lista.push(p); else indice.set(clave, [p]);
  }
}

/** Busca la selección: prueba la cadena entera y luego prefijos más cortos. */
export function buscarDiccionario(seleccion: string): Palabra[] {
  const texto = seleccion.replace(/\s+/g, "").slice(0, 12);
  for (let n = texto.length; n >= 1; n--) {
    const hallado = indice.get(texto.slice(0, n));
    if (hallado) return hallado.slice(0, 4);
  }
  return [];
}

/**
 * Lecturas: primero la base (ahí caen las generadas por lotes); si no hay
 * ninguna, las escritas a mano que viajan en el repo.
 */
export async function lectura(nivelId: string): Promise<Lectura | null> {
  const sb = supabaseServidor();
  if (sb) {
    const { data } = await sb
      .from("lecturas").select("*").eq("nivel_id", nivelId).maybeSingle();
    if (data) return data as Lectura;
  }
  return LECTURAS.get(nivelId) ?? null;
}
