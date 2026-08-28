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
  palabras: number[]; gramatica: string[];
};

export type UnidadMeta = {
  id: string; ja: string; es: string; tipo: string;
  items: number;      // palabras
  gramatica: number;  // puntos de gramática que trae la unidad
};
export type SeccionCurso = {
  id: string; ja: string; es: string;
  palabras: number; gramatica: number;
  unidades: UnidadMeta[];
};
export type NivelCurso = {
  id: Nivel; secciones: SeccionCurso[];
  palabras: number; gramatica: number; unidades: number;
};

export type Lectura = {
  unidad_id: string;
  titulo: string; cuerpo: string; traduccion: string;
  preguntas?: { p: string; opciones: string[]; correcta: number }[];
};

export const COLOR_NIVEL: Record<Nivel, string> = {
  N5: "var(--verde)", N4: "var(--azul)", N3: "var(--morado)",
  N2: "var(--acento)", N1: "var(--dorado)",
};
export const DESC_NIVEL: Record<Nivel, string> = {
  N5: "Los primeros pasos", N4: "Base cotidiana", N3: "El salto intermedio",
  N2: "Tu examen", N1: "El nivel más alto",
};
