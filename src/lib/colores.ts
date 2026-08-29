import mapa from "../../data/dist/kanji_niveles.json";

/** kanji -> nivel JLPT ("N5"…"N1"). ~25 KB, va al navegador. */
export const NIVEL_KANJI = mapa as Record<string, string>;

const RX_KANJI = /[一-鿿]/g;

/**
 * Envuelve cada kanji en un <span> con su nivel, respetando el marcado que ya
 * traiga el texto (ruby, em…). El furigana va dentro de <rt> y es kana, así que
 * nunca se toca.
 */
export function colorearHtml(html: string): string {
  return html
    .split(/(<[^>]*>)/)
    .map((trozo) =>
      trozo.startsWith("<")
        ? trozo
        : trozo.replace(RX_KANJI, (c) => {
            const n = NIVEL_KANJI[c];
            return n ? `<span class="k ${n.toLowerCase()}">${c}</span>` : c;
          }),
    )
    .join("");
}

export function nivelDe(kanji: string): string | undefined {
  return NIVEL_KANJI[kanji];
}
