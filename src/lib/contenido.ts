import "server-only";
import type {
  Palabra, Gramatica, Unidad, NivelCurso, Lectura, Nivel,
} from "./tipos";
import vocabularioJson from "../../data/dist/vocabulario.json";
import gramaticaJson from "../../data/dist/gramatica.json";
import unidadesJson from "../../data/dist/unidades.json";
import cursoJson from "../../data/dist/curso.json";
import lecturasJson from "../../data/dist/lecturas.json";
import { supabaseServidor } from "./supabase";

const VOCABULARIO = vocabularioJson as Palabra[];
const GRAMATICA = gramaticaJson as Gramatica[];
const UNIDADES = unidadesJson as Unidad[];
const CURSO = cursoJson as NivelCurso[];
const LECTURAS = new Map((lecturasJson as Lectura[]).map((l) => [l.unidad_id, l]));

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

export const totales = {
  palabras: VOCABULARIO.length,
  gramatica: GRAMATICA.length,
  unidades: UNIDADES.length,
};

/** Vecinas dentro de la misma sección, para el botón «siguiente». */
export function vecinas(id: string): { anterior?: string; siguiente?: string } {
  const u = porIdUnidad.get(id);
  if (!u) return {};
  const hermanas = UNIDADES.filter((x) => x.nivel === u.nivel && x.seccion === u.seccion);
  const i = hermanas.findIndex((x) => x.id === id);
  return { anterior: hermanas[i - 1]?.id, siguiente: hermanas[i + 1]?.id };
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
  if (sb) {
    const { data } = await sb
      .from("lecturas").select("*").eq("unidad_id", unidadId).maybeSingle();
    if (data) return data as Lectura;
  }
  return LECTURAS.get(unidadId) ?? null;
}
