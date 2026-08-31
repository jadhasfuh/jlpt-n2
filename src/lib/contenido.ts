import "server-only";
import type {
  Palabra, Gramatica, Unidad, NivelCurso, Lectura, Kanji,
} from "./tipos";
import vocabularioJson from "../../data/dist/vocabulario.json";
import gramaticaJson from "../../data/dist/gramatica.json";
import unidadesJson from "../../data/dist/unidades.json";
import cursoJson from "../../data/dist/curso.json";
import kanjiJson from "../../data/dist/kanji.json";
import { supabaseServidor } from "./supabase-servidor";

const VOCABULARIO = vocabularioJson as Palabra[];
const GRAMATICA = gramaticaJson as Gramatica[];
const UNIDADES = unidadesJson as Unidad[];
const CURSO = cursoJson as NivelCurso[];
const KANJI = kanjiJson as Kanji[];
const porChar = new Map(KANJI.map((k) => [k.char, k]));

const porIdPalabra = new Map(VOCABULARIO.map((p) => [p.id, p]));
const porIdGramatica = new Map(GRAMATICA.map((g) => [g.id, g]));
const porIdUnidad = new Map(UNIDADES.map((u) => [u.id, u]));

export function curso(): NivelCurso[] { return CURSO; }
export function nivelCurso(id: string): NivelCurso | undefined {
  return CURSO.find((n) => n.id === id);
}
export function seccionCurso(nivel: string, seccion: string) {
  return nivelCurso(nivel)?.secciones.find((s) => s.id === seccion);
}
export function unidad(id: string): Unidad | undefined { return porIdUnidad.get(id); }
export function unidades(): Unidad[] { return UNIDADES; }

export function palabras(ids: number[]): Palabra[] {
  return ids.map((i) => porIdPalabra.get(i)).filter(Boolean) as Palabra[];
}
export function gramaticas(ids: string[]): Gramatica[] {
  return ids.map((i) => porIdGramatica.get(i)).filter(Boolean) as Gramatica[];
}

/** Fichas de esos kanji, en el orden del catálogo (frecuencia). */
export function kanjis(chars: string[]): Kanji[] {
  const set = new Set(chars);
  return KANJI.filter((k) => set.has(k.char));
}

/** Los kanji oficiales de un nivel JLPT. */
export function kanjiDeNivel(nivel: string): Kanji[] {
  return KANJI.filter((k) => k.nivel === nivel);
}

/** Los kanji que salen en las palabras de una sección de un nivel. */
export function kanjiDeSeccion(nivel: string, seccion: string): Kanji[] {
  const chars = new Set(
    UNIDADES.filter((u) => u.nivel === nivel && u.seccion === seccion)
            .flatMap((u) => u.kanji));
  return KANJI.filter((k) => chars.has(k.char));
}

export function kanjiPorChar(c: string): Kanji | undefined { return porChar.get(c); }

export const totales = {
  palabras: VOCABULARIO.length,
  gramatica: GRAMATICA.length,
  unidades: UNIDADES.length,
  kanji: KANJI.length,
};

/** Vecinas dentro de la misma sección, y en qué puesto va esta unidad. */
export function vecinas(id: string): {
  anterior?: string; siguiente?: string; indice: number; total: number;
} {
  const u = porIdUnidad.get(id);
  if (!u) return { indice: 0, total: 0 };
  const hermanas = UNIDADES.filter((x) => x.nivel === u.nivel && x.seccion === u.seccion);
  const i = hermanas.findIndex((x) => x.id === id);
  return {
    anterior: hermanas[i - 1]?.id, siguiente: hermanas[i + 1]?.id,
    indice: i + 1, total: hermanas.length,
  };
}

// Índice del diccionario interno (lo consulta /api/diccionario).
const indice = new Map<string, Palabra[]>();
for (const p of VOCABULARIO) {
  for (const clave of [p.kanji, p.kana]) {
    if (!clave) continue;
    const lista = indice.get(clave);
    if (lista) lista.push(p); else indice.set(clave, [p]);
  }
}
export function buscarDiccionario(seleccion: string): Palabra[] {
  const texto = seleccion.replace(/\s+/g, "").slice(0, 12);
  for (let n = texto.length; n >= 1; n--) {
    const hallado = indice.get(texto.slice(0, n));
    if (hallado) return hallado.slice(0, 4);
  }
  return [];
}

export async function lectura(unidadId: string): Promise<Lectura | null> {
  const sb = supabaseServidor();
  if (!sb) return null;
  const { data } = await sb
    .from("lecturas").select("*").eq("unidad_id", unidadId).maybeSingle();
  return (data as Lectura) ?? null;
}

/**
 * Búsqueda libre para el buscador de la cabecera. `buscarDiccionario` sirve
 * para una selección exacta dentro de un texto; aquí se escribe a mano y hace
 * falta tolerar prefijos y buscar también por el significado en español.
 */
export function buscarLibre(consulta: string, tope = 24): Palabra[] {
  const q = consulta.trim().toLowerCase();
  if (q.length < 1) return [];
  const japones = /[぀-ヿ一-鿿]/.test(q);
  const empieza: Palabra[] = [];
  const contiene: Palabra[] = [];

  for (const p of VOCABULARIO) {
    const campos = japones ? [p.kanji, p.kana] : [p.es, p.en];
    let puesto = 0;
    for (const c of campos) {
      if (!c) continue;
      const v = japones ? c : c.toLowerCase();
      if (v.startsWith(q)) { puesto = 2; break; }
      if (v.includes(q)) puesto = 1;
    }
    if (puesto === 2) empieza.push(p);
    else if (puesto === 1) contiene.push(p);
    if (empieza.length >= tope) break;
  }
  return [...empieza, ...contiene].slice(0, tope);
}
