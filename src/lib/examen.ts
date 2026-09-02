/**
 * Mini exámenes JLPT. La estructura sale de `docs/JLPT-EXAMEN.md`.
 *
 * Los ítems son **originales**: los exámenes pasados tienen derechos de autor y
 * no se copia ni uno. Lo que se reproduce es la estructura oficial (qué tipos
 * de pregunta hay y en qué proporción), que es información funcional publicada.
 */
import type { Nivel } from "./tipos";

export type Seccion = "moji_goi" | "bunpou" | "dokkai" | "choukai";

export type TipoItem =
  // 文字・語彙
  | "kanji_yomi" | "hyouki" | "gokeisei" | "bunmyaku" | "iikae" | "youhou"
  // 文法
  | "bunpou1" | "bunpou2" | "bunshou_bunpou"
  // 読解
  | "tanbun" | "chuubun" | "chobun" | "tougou" | "shuchou" | "jouhou"
  // 聴解
  | "kadai" | "point" | "gaiyou" | "hatsuwa" | "sokuji" | "tougou_choukai";

export const SECCION_DE: Record<TipoItem, Seccion> = {
  kanji_yomi: "moji_goi", hyouki: "moji_goi", gokeisei: "moji_goi",
  bunmyaku: "moji_goi", iikae: "moji_goi", youhou: "moji_goi",
  bunpou1: "bunpou", bunpou2: "bunpou", bunshou_bunpou: "bunpou",
  tanbun: "dokkai", chuubun: "dokkai", chobun: "dokkai",
  tougou: "dokkai", shuchou: "dokkai", jouhou: "dokkai",
  kadai: "choukai", point: "choukai", gaiyou: "choukai",
  hatsuwa: "choukai", sokuji: "choukai", tougou_choukai: "choukai",
};

/** Cómo se llama cada cosa, en japonés y en las dos lenguas de la interfaz. */
export const NOMBRE_TIPO: Record<TipoItem, { ja: string; es: string; en: string }> = {
  kanji_yomi: { ja: "漢字読み", es: "Lectura de kanji", en: "Kanji reading" },
  hyouki:     { ja: "表記", es: "Escritura en kanji", en: "Kanji writing" },
  gokeisei:   { ja: "語形成", es: "Formación de palabras", en: "Word formation" },
  bunmyaku:   { ja: "文脈規定", es: "Palabra según contexto", en: "Contextual word" },
  iikae:      { ja: "言い換え類義", es: "Sinónimos", en: "Paraphrase" },
  youhou:     { ja: "用法", es: "Uso correcto", en: "Correct usage" },
  bunpou1:    { ja: "文の文法1", es: "Forma gramatical", en: "Grammar form" },
  bunpou2:    { ja: "文の文法2", es: "Ordenar la frase", en: "Sentence order" },
  bunshou_bunpou: { ja: "文章の文法", es: "Gramática de texto", en: "Text grammar" },
  tanbun:     { ja: "短文", es: "Texto corto", en: "Short passage" },
  chuubun:    { ja: "中文", es: "Texto medio", en: "Medium passage" },
  chobun:     { ja: "長文", es: "Texto largo", en: "Long passage" },
  tougou:     { ja: "統合理解", es: "Comparar textos", en: "Integrated reading" },
  shuchou:    { ja: "主張理解", es: "Tesis del autor", en: "Author's argument" },
  jouhou:     { ja: "情報検索", es: "Buscar información", en: "Information search" },
  kadai:      { ja: "課題理解", es: "Qué hace después", en: "Task comprehension" },
  point:      { ja: "ポイント理解", es: "Escucha dirigida", en: "Point comprehension" },
  gaiyou:     { ja: "概要理解", es: "Idea general", en: "Gist" },
  hatsuwa:    { ja: "発話表現", es: "Qué se dice", en: "Verbal expression" },
  sokuji:     { ja: "即時応答", es: "Respuesta inmediata", en: "Quick response" },
  tougou_choukai: { ja: "統合理解", es: "Escucha integrada", en: "Integrated listening" },
};

export const NOMBRE_SECCION: Record<Seccion, { ja: string; es: string; en: string }> = {
  moji_goi: { ja: "文字・語彙", es: "Vocabulario", en: "Vocabulary" },
  bunpou:   { ja: "文法", es: "Gramática", en: "Grammar" },
  dokkai:   { ja: "読解", es: "Lectura", en: "Reading" },
  choukai:  { ja: "聴解", es: "Escucha", en: "Listening" },
};

/**
 * Cuántos ítems de cada tipo lleva un examen completo de cada nivel.
 * Salido de los PDF oficiales; ver `docs/JLPT-EXAMEN.md`.
 */
export const REPARTO: Record<Nivel, Partial<Record<TipoItem, number>>> = {
  N5: { kanji_yomi: 7, hyouki: 5, bunmyaku: 6, iikae: 3,
        bunpou1: 9, bunpou2: 4, bunshou_bunpou: 4,
        tanbun: 2, chuubun: 2, jouhou: 1,
        kadai: 7, point: 6, hatsuwa: 5, sokuji: 6 },
  N4: { kanji_yomi: 7, hyouki: 5, bunmyaku: 8, iikae: 4, youhou: 4,
        bunpou1: 13, bunpou2: 4, bunshou_bunpou: 4,
        tanbun: 3, chuubun: 3, jouhou: 2,
        kadai: 8, point: 7, hatsuwa: 5, sokuji: 8 },
  N3: { kanji_yomi: 8, hyouki: 6, bunmyaku: 11, iikae: 5, youhou: 5,
        bunpou1: 13, bunpou2: 5, bunshou_bunpou: 5,
        tanbun: 4, chuubun: 6, chobun: 4, jouhou: 2,
        kadai: 6, point: 6, gaiyou: 3, hatsuwa: 4, sokuji: 9 },
  N2: { kanji_yomi: 5, hyouki: 5, gokeisei: 5, bunmyaku: 7, iikae: 5, youhou: 5,
        bunpou1: 12, bunpou2: 5, bunshou_bunpou: 5,
        tanbun: 5, chuubun: 9, tougou: 2, shuchou: 3, jouhou: 2,
        kadai: 5, point: 6, gaiyou: 5, sokuji: 12, tougou_choukai: 4 },
  N1: { kanji_yomi: 6, bunmyaku: 7, iikae: 6, youhou: 6,
        bunpou1: 10, bunpou2: 5, bunshou_bunpou: 5,
        tanbun: 4, chuubun: 9, chobun: 4, tougou: 3, shuchou: 4, jouhou: 2,
        kadai: 5, point: 6, gaiyou: 5, sokuji: 11, tougou_choukai: 3 },
};

export type Item = {
  id: string;
  nivel: Nivel;
  tipo: TipoItem;
  instruccion_ja: string;
  enunciado: string;
  objetivo?: string;
  opciones: string[];
  respuesta: number;               // índice de la correcta
  logica_distractores?: string[];  // por qué falla cada una
  explicacion: { es: string; en: string };
  puntos?: string[];               // frase clave → reformulación (聴解)
  pasaje?: { texto: string; notas?: { termino: string; glosa: string }[]; cita?: string };
  guion?: { intro: string; turnos: { quien: "M" | "F"; texto: string }[];
            pregunta: string; opciones_habladas: boolean };
  audio?: string;
  etiquetas?: string[];
  dificultad?: number;
};

// ------------------------------------------------------- armar un mini examen

/** Lo que el usuario elige antes de empezar. */
export type Ajuste = {
  nivel: Nivel;
  /** Vacío = examen completo, con todas las secciones. */
  secciones: Seccion[];
  minutos: 5 | 10 | 15 | 30 | 105;
  /** Ver la corrección al momento o guardarla toda para el final. */
  correccion: "al momento" | "al final";
};

/**
 * Cuántos ítems caben en el tiempo elegido. Los ritmos salen del examen real:
 * en N2 son 105 min para 75 ítems de lengua y lectura, y 50 min para 32 de
 * escucha — pero la lectura se come el tiempo y el vocabulario vuela, así que
 * cada sección tiene su propio ritmo en vez de un promedio que engañaría.
 */
export const SEGUNDOS_POR_ITEM: Record<Seccion, number> = {
  moji_goi: 20,
  bunpou: 35,
  dokkai: 150,   // incluye leer el texto, repartido entre sus preguntas
  choukai: 60,   // el audio manda; no se puede acelerar
};

/**
 * Reparte los ítems de un mini examen respetando la proporción oficial y, sobre
 * todo, el reloj.
 *
 * Reparto por restos mayores, no redondeo suelto: en cinco minutos no caben los
 * diecinueve tipos del N2 — sólo las preguntas de lectura ya se comerían veinte
 * minutos —, así que un examen corto **muestrea** tipos en lugar de incluirlos
 * todos. Los que más pesan en el examen real son los que más papeletas tienen.
 */
export function armarReparto(a: Ajuste): Partial<Record<TipoItem, number>> {
  const completo = REPARTO[a.nivel];
  const quiere = (t: TipoItem) =>
    a.secciones.length === 0 || a.secciones.includes(SECCION_DE[t]);

  const tipos = (Object.keys(completo) as TipoItem[]).filter(quiere);
  if (!tipos.length) return {};

  const segundos = (t: TipoItem) => SEGUNDOS_POR_ITEM[SECCION_DE[t]];
  const coste = (t: TipoItem) => (completo[t] ?? 0) * segundos(t);
  const total = tipos.reduce((s, t) => s + coste(t), 0);
  const presupuesto = a.minutos * 60;
  const factor = presupuesto / total;

  const salida: Partial<Record<TipoItem, number>> = {};
  const cuota = new Map<TipoItem, number>();
  let gastado = 0;
  for (const t of tipos) {
    const ideal = (completo[t] ?? 0) * factor;
    const enteros = Math.floor(ideal);
    if (enteros > 0) { salida[t] = enteros; gastado += enteros * segundos(t); }
    cuota.set(t, ideal - enteros);
  }

  // El tiempo que sobra se rifa entre los que quedaron con más resto.
  for (const [t] of [...cuota].sort((x, y) => y[1] - x[1])) {
    if (gastado + segundos(t) > presupuesto) continue;
    salida[t] = (salida[t] ?? 0) + 1;
    gastado += segundos(t);
  }

  // Un examen vacío no sirve de nada: si ni el más barato cabe, uno y ya.
  if (cuantosItems(salida) === 0) {
    const barato = tipos.reduce((a2, b) => (segundos(a2) <= segundos(b) ? a2 : b));
    salida[barato] = 1;
  }
  return salida;
}

export function cuantosItems(r: Partial<Record<TipoItem, number>>): number {
  return Object.values(r).reduce((s: number, n) => s + (n ?? 0), 0);
}

// ------------------------------- las indicaciones, explicadas

/**
 * Cada 大問 lleva su instrucción en japonés, como en el examen de verdad. Pero
 * quien está empezando no puede leerla, y quedarse atascado en la instrucción
 * en vez de en la pregunta no enseña nada. Aquí está cada una con furigana y
 * traducida, para el botón de ayuda.
 */
export const AYUDA_INSTRUCCION: Partial<Record<TipoItem, { ja: string; es: string; en: string }>> = {
  kanji_yomi: {
    ja: "＿＿の<ruby>言葉<rt>ことば</rt></ruby>の<ruby>読<rt>よ</rt></ruby>み<ruby>方<rt>かた</rt></ruby>として<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 la mejor lectura para la palabra subrayada.",
    en: "Choose the best reading for the underlined word from 1, 2, 3 and 4." },
  hyouki: {
    ja: "＿＿の<ruby>言葉<rt>ことば</rt></ruby>を<ruby>漢字<rt>かんじ</rt></ruby>で<ruby>書<rt>か</rt></ruby>くとき、<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Al escribir en kanji la palabra subrayada, elige la mejor opción entre 1, 2, 3 y 4.",
    en: "When writing the underlined word in kanji, choose the best option from 1, 2, 3 and 4." },
  gokeisei: {
    ja: "（　）に<ruby>入<rt>い</rt></ruby>れるのに<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 lo que mejor encaje en el hueco （　）.",
    en: "Choose what best fits the blank （　） from 1, 2, 3 and 4." },
  bunmyaku: {
    ja: "（　）に<ruby>入<rt>い</rt></ruby>れるのに<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 lo que mejor encaje en el hueco （　）.",
    en: "Choose what best fits the blank （　） from 1, 2, 3 and 4." },
  iikae: {
    ja: "＿＿の<ruby>言葉<rt>ことば</rt></ruby>に<ruby>意味<rt>いみ</rt></ruby>が<ruby>最<rt>もっと</rt></ruby>も<ruby>近<rt>ちか</rt></ruby>いものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 lo más cercano en significado a la palabra subrayada.",
    en: "Choose the closest in meaning to the underlined word from 1, 2, 3 and 4." },
  youhou: {
    ja: "<ruby>次<rt>つぎ</rt></ruby>の<ruby>言葉<rt>ことば</rt></ruby>の<ruby>使<rt>つか</rt></ruby>い<ruby>方<rt>かた</rt></ruby>として<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 la frase que usa correctamente la palabra dada.",
    en: "Choose from 1, 2, 3 and 4 the sentence that uses the given word correctly." },
  bunpou1: {
    ja: "<ruby>次<rt>つぎ</rt></ruby>の<ruby>文<rt>ぶん</rt></ruby>の（　）に<ruby>入<rt>い</rt></ruby>れるのに<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Elige entre 1, 2, 3 y 4 lo que mejor encaje en el hueco de la frase.",
    en: "Choose what best fits the blank in the sentence from 1, 2, 3 and 4." },
  bunpou2: {
    ja: "<ruby>次<rt>つぎ</rt></ruby>の<ruby>文<rt>ぶん</rt></ruby>の ＿★＿ に<ruby>入<rt>はい</rt></ruby>る<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Ordena mentalmente los cuatro fragmentos y elige el que va en la casilla ★.",
    en: "Mentally order the four fragments and choose the one that goes in the ★ slot." },
  tanbun: {
    ja: "<ruby>次<rt>つぎ</rt></ruby>の<ruby>文章<rt>ぶんしょう</rt></ruby>を<ruby>読<rt>よ</rt></ruby>んで、<ruby>後<rt>あと</rt></ruby>の<ruby>問<rt>と</rt></ruby>いに<ruby>対<rt>たい</rt></ruby>する<ruby>答<rt>こた</rt></ruby>えとして<ruby>最<rt>もっと</rt></ruby>もよいものを、1・2・3・4から<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。",
    es: "Lee el texto y elige entre 1, 2, 3 y 4 la mejor respuesta a la pregunta.",
    en: "Read the passage and choose the best answer to the question from 1, 2, 3 and 4." },
  sokuji: {
    ja: "<ruby>問題<rt>もんだい</rt></ruby>では、<ruby>問題<rt>もんだい</rt></ruby><ruby>用紙<rt>ようし</rt></ruby>に<ruby>何<rt>なに</rt></ruby>も<ruby>印刷<rt>いんさつ</rt></ruby>されていません。まず<ruby>文<rt>ぶん</rt></ruby>を<ruby>聞<rt>き</rt></ruby>いてください。それから、それに<ruby>対<rt>たい</rt></ruby>する<ruby>返事<rt>へんじ</rt></ruby>を<ruby>聞<rt>き</rt></ruby>いて、1から3の<ruby>中<rt>なか</rt></ruby>から、<ruby>最<rt>もっと</rt></ruby>もよいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>んでください。",
    es: "Aquí no hay nada impreso. Escucha primero la frase y luego, oyendo las respuestas, elige la mejor de las tres.",
    en: "Nothing is printed here. Listen to the phrase first, then hear the replies and choose the best of the three." },
  kadai: {
    ja: "<ruby>問題<rt>もんだい</rt></ruby>では、まず<ruby>質問<rt>しつもん</rt></ruby>を<ruby>聞<rt>き</rt></ruby>いてください。それから<ruby>話<rt>はなし</rt></ruby>を<ruby>聞<rt>き</rt></ruby>いて、<ruby>問題<rt>もんだい</rt></ruby><ruby>用紙<rt>ようし</rt></ruby>の1から4の<ruby>中<rt>なか</rt></ruby>から、<ruby>最<rt>もっと</rt></ruby>もよいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>んでください。",
    es: "Escucha primero la pregunta. Después oye la conversación y elige la mejor de las cuatro opciones.",
    en: "Listen to the question first. Then hear the conversation and choose the best of the four options." },
};

/**
 * Convierte los guiones bajos del ejercicio de ordenar en casillas de verdad.
 *
 * El enunciado viene como `その決断は　＿＿　＿★＿　＿＿　＿＿　ではない。`: cuatro
 * casillas para cuatro fragmentos, con la estrella en la que hay que
 * contestar. Pintado tal cual se lee como una fila de guiones —hay quien
 * cuenta cinco— y no se entiende que cada hueco es un fragmento.
 *
 * Sólo los ejercicios de ordenar usan ＿, así que se puede aplicar a todo sin
 * mirar el tipo.
 */
export function marcarHuecos(html: string): string {
  return html.replace(/＿+★?＿*/g, (m) =>
    m.includes("★")
      ? '<span class="hueco estrella" aria-label="casilla de la estrella">★</span>'
      : '<span class="hueco"></span>');
}

// 中文 y 長文 comparten la instrucción de 短文.
for (const t of ["chuubun", "chobun", "shuchou"] as TipoItem[]) {
  AYUDA_INSTRUCCION[t] = AYUDA_INSTRUCCION.tanbun;
}
// El resto de la escucha comparte la de 課題理解.
for (const t of ["point", "gaiyou", "tougou_choukai"] as TipoItem[]) {
  AYUDA_INSTRUCCION[t] = AYUDA_INSTRUCCION.kadai;
}
