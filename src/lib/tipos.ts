export type Nivel = "N5" | "N4" | "N3" | "N2" | "N1";
export const NIVELES: Nivel[] = ["N5", "N4", "N3", "N2", "N1"];

export type Palabra = {
  id: number;
  kana: string; kanji: string;
  escritura: string;   // lo que se muestra
  lectura: string;     // el furigana
  pos: string;
  en: string; es: string;
  registro: string[];  // cortés, coloquial…
  seccion: string; subgrupo: string;
  jlpt: Nivel;
};

export type Gramatica = {
  id: string;          // identificador interno, nunca se muestra
  nivel: Nivel;
  forma: string; lectura: string;
  en: string; es: string;
  tier: number; cat: string;
};

export type Unidad = {
  id: string;          // "N5/hito/familia-1"
  tipo: "vocabulario" | "gramatica";
  nivel: Nivel;
  seccion: string; subgrupo: string;
  parte: number; partes: number;
  ja: string; es: string;
  palabras: number[]; gramatica: string[]; kanji: string[];
};

export type UnidadMeta = {
  id: string; ja: string; es: string; tipo: string;
  items: number;      // palabras
  gramatica: number;  // puntos de gramática que trae la unidad
  kanji: number;
};
export type SeccionCurso = {
  id: string; ja: string; es: string;
  palabras: number; gramatica: number; kanji: number;
  unidades: UnidadMeta[];
};
export type NivelCurso = {
  id: Nivel; secciones: SeccionCurso[];
  palabras: number; gramatica: number; unidades: number; kanji: number;
};

export type Kanji = {
  char: string;
  nivel: string;      // nivel JLPT oficial del kanji ("" si está fuera del JLPT)
  curso: string;      // nivel del curso donde aparece por primera vez
  trazos: number | null;
  grado: number | null;
  freq: number | null;
  en: string[]; es: string;
  on: string[]; kun: string[];
  radicales: string[];
  radicales_es?: string[];
  palabras: number[]; n_palabras: number;
};

export type Lectura = {
  unidad_id: string;
  titulo: string; cuerpo: string;
  /** La traducción de apoyo, frase a frase: `Ordenar` empareja cada oración
   *  del cuerpo con la suya, así que ambas versiones tienen que llevar el
   *  mismo número de frases. Están las 602 en los dos idiomas; el opcional
   *  sólo cubre el hueco de una lectura recién escrita. */
  traduccion: string; traduccion_en?: string;
  preguntas?: { p: string; opciones: string[]; correcta: number }[];
};

/** La rampa va del acento al rojo de la marca: cuanto más alto el nivel, más rojo. */
export const COLOR_NIVEL: Record<Nivel, string> = {
  N5: "var(--n5)", N4: "var(--n4)", N3: "var(--n3)",
  N2: "var(--n2)", N1: "var(--n1)",
};
/** El numeral kanji que va de fondo en cada fila de nivel. */
export const NUMERAL_NIVEL: Record<Nivel, string> = {
  N5: "五", N4: "四", N3: "三", N2: "二", N1: "一",
};
export const DESC_NIVEL: Record<Nivel, string> = {
  N5: "Los primeros pasos", N4: "Base cotidiana", N3: "El salto intermedio",
  N2: "Nivel avanzado", N1: "El nivel más alto",
};
