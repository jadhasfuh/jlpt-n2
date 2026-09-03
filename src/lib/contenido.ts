import "server-only";
import type {
  Palabra, Gramatica, Unidad, NivelCurso, Lectura, Kanji,
} from "./tipos";
import ordenLibroJson from "@/../data/fuente/orden_libro.json";
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
 * Las palabras del capítulo que se estudian en OTRO capítulo, de cualquier nivel.
 *
 * La página de vocabulario enseña las de su unidad, y sólo ésas. Pero un
 * capítulo usa además palabras que se estudian mucho después —山 sale en el
 * primero y se estudia en el 95— y otras que ni siquiera son de su nivel:
 * こたつ es N1 y sale en el libro de N5. El lector se queda mirando algo que
 * no está en ninguna lista. Aquí se sacan del propio texto, con su nivel a la
 * vista, para que estén a mano sin romper el orden del curso.
 *
 * Se busca de más largo a más corto, como el diccionario: así 大通り se
 * encuentra entera en vez de saltar sobre 大 y 通り por separado.
 */
export function palabrasDeFuera(html: string, propias: number[]): Palabra[] {
  const texto = html.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");
  const suyas = new Set(propias);
  const fuera: Palabra[] = [];
  const vistas = new Set<number>();
  const KATA = (c: string) => /[ァ-ヶー]/.test(c ?? "");
  const KAN  = (c: string) => /[一-鿿]/.test(c ?? "");
  const KANA = (c: string) => /[ぁ-ゖ]/.test(c ?? "");

  for (let i = 0; i < texto.length; i++) {
    for (let n = Math.min(8, texto.length - i); n >= 1; n--) {
      const trozo = texto.slice(i, i + n);
      const cand = indice.get(trozo);
      if (!cand) continue;
      const p = cand.find((w) => !suyas.has(w.id) && !vistas.has(w.id));
      const ant = texto[i - 1] ?? "";
      const sig = texto[i + n] ?? "";

      // Sin analizador morfológico, buscar de largo a corto parte mal las
      // palabras. Tres reglas cazan casi todo lo que se colaba:
      //   · una palabra en katakana ocupa TODA la racha: de アパート salía
      //     パート, y de テーブル, ブル;
      //   · un kanji suelto con otro kanji al lado es parte de un compuesto
      //     —de 毎日 salía 日— y con kana detrás es la raíz de un verbo;
      //   · una raíz con okurigana seguida de más kana está a medias: de
      //     教えて salía 教え.
      const soloKata = [...trozo].every(KATA);
      let vale: boolean;
      if (soloKata) vale = !KATA(ant) && !KATA(sig);
      else if (n === 1 && KAN(trozo)) vale = !KAN(ant) && !KAN(sig) && !KANA(sig);
      else if (/[一-鿿]/.test(trozo) && KANA(trozo[trozo.length - 1])) vale = !KANA(sig);
      else vale = /[一-鿿]/.test(trozo) || trozo.length >= 3;

      if (p && vale) { fuera.push(p); vistas.add(p.id); i += n - 1; }
      break;
    }
  }
  return fuera;
}

/**
 * La gramática que un capítulo USA pero enseña otro.
 *
 * N5 tiene 84 puntos de gramática y el libro 103 capítulos, así que 19 se
 * quedaban con la hoja de la izquierda a medias. No es que sobre gramática sin
 * colocar —los 84 están todos repartidos, uno por unidad—: es que hay más
 * capítulos que puntos.
 *
 * Pero ninguno de esos 19 está limpio de gramática: usan から, とき, ている,
 * でしょう… sólo que se enseñan en otro capítulo. Así que se busca en el texto
 * y se enseña abajo, diciendo dónde se vio. Es lo mismo que ya se hace con el
 * vocabulario, y el hueco deja de parecer un olvido.
 */
export function gramaticaDeFuera(
  html: string, nivel: string, propia: string[],
): { punto: Gramatica; capitulo: number }[] {
  const texto = html.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  const suyos = new Set(propia);
  const orden = capitulos(nivel);
  const dondeSeVe = new Map<string, number>();
  orden.forEach((u, i) => u.gramatica.forEach((g) => dondeSeVe.set(g, i + 1)));

  const fuera: { punto: Gramatica; capitulo: number }[] = [];
  for (const g of GRAMATICA) {
    if (g.nivel !== nivel || suyos.has(g.id)) continue;
    // La forma del catálogo trae ～, corchetes y alternativas con / o ・.
    const formas = g.forma
      .replace(/[～〜]/g, "").replace(/\[[^\]]*\]/g, "")
      .split(/\s*\/\s*|・/)
      .map((f) => f.trim())
      .filter((f) => f.length >= 2 && /^[ぁ-ヿ一-鿿]+$/.test(f));
    if (formas.some((f) => texto.includes(f))) {
      fuera.push({ punto: g, capitulo: dondeSeVe.get(g.id) ?? 0 });
    }
  }
  // Primero lo que ya se ha visto, que es lo que se puede recordar.
  return fuera.sort((a, b) => a.capitulo - b.capitulo).slice(0, 6);
}

/**
 * El orden en que se lee el libro, que **no** es el del curso.
 *
 * El curso ordena por tema —人と体, 暮らし, 時間…— porque así se estudia. La
 * historia va por cuándo pasan las cosas. Mientras el libro heredó el orden
 * del curso, se leía noviembre antes de que llegara el otoño, y el vuelo a
 * Japón caía en el capítulo 8, cuando Carlos ya había llegado, empezado la
 * escuela y conocido a la clase.
 *
 * La secuencia vive en `data/fuente/orden_libro.json`. Lo que no esté ahí se
 * va al final en el orden del curso: añadir una unidad no rompe el libro, sólo
 * la deja sin sitio hasta que se le dé uno.
 */
const ORDEN_LIBRO = ordenLibroJson as Record<string, string[] | string>;

export function capitulos(nivel: string): Unidad[] {
  const guion = ORDEN_LIBRO[nivel];
  const puesto = new Map(
    (Array.isArray(guion) ? guion : []).map((id, i) => [id, i]),
  );
  return UNIDADES
    .filter((u) => u.nivel === nivel)
    .sort((a, b) =>
      (puesto.get(a.id) ?? Infinity) - (puesto.get(b.id) ?? Infinity) ||
      a.seccion.localeCompare(b.seccion) ||
      a.subgrupo.localeCompare(b.subgrupo) ||
      a.parte - b.parte);
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
