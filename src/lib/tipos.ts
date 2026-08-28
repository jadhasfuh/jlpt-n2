export type NivelJlpt = "N5" | "N4" | "N2";

export type Palabra = {
  id: number;
  kana: string;
  kanji: string;
  escritura: string;   // lo que se muestra (kanji si lo hay, si no kana)
  lectura: string;     // kana — el furigana
  pos: string;
  en: string;
  es: string;
  es_origen: string;
  registro: string[];   // cortés, coloquial, jerga… separado del significado
  seccion: string;
  subgrupo: string;
  jlpt: NivelJlpt;
};

export type Gramatica = {
  id: string;          // sólo identificador interno; nunca se muestra
  forma: string;       // 〜ばかりか
  lectura: string;     // kana cuando la forma lleva kanji
  en: string;
  es: string;
  tier: number;        // 1 = más simple … 4 = más compleja
  cat: string;
};

export type Nivel = {
  id: string;
  numero: number;
  seccion: string;
  titulo_ja: string;
  titulo_es: string;
  palabras: number[];
  gramatica: string[];
};

export type Subgrupo = { id: string; ja: string; es: string; palabras: number };
export type Seccion = {
  id: string; ja: string; es: string;
  palabras: number; niveles: number;
  subgrupos: Subgrupo[];
};

export type Lectura = {
  nivel_id: string;
  titulo: string;
  cuerpo: string;       // japonés, con <ruby> para el furigana
  traduccion: string;   // español
  preguntas?: { p: string; opciones: string[]; correcta: number }[];
};

export const CATEGORIAS_GRAMATICA: Record<string, string> = {
  conectores: "Conectores",
  tiempo: "Tiempo y secuencia",
  grado: "Grado e intensidad",
  adicion: "Adición y enumeración",
  contraste: "Contraste y concesión",
  causa: "Causa y razón",
  condicion: "Condición",
  grado_limite: "Alcance y límite",
  comparacion: "Comparación",
  modo: "Modo y manera",
  estado_cambio: "Estado y cambio",
  relacion: "Relación y correspondencia",
  punto_vista: "Punto de vista",
  obligacion: "Obligación y prohibición",
  posibilidad: "Posibilidad",
  modal: "Juicio y suposición",
  enfasis: "Énfasis",
  resultado: "Resultado",
  estilo: "Registro y estilo",
};
