"use client";
import { useAjustes } from "./Ajustes";
import { colorearHtml } from "@/lib/colores";

/** Texto japonés con furigana y kanji coloreados por nivel. Nunca romaji. */
export function Jp({
  escritura, lectura, clase = "", tam,
}: { escritura: string; lectura?: string; clase?: string; tam?: "grande" | "medio" }) {
  const { furigana, colores } = useAjustes();
  const cls = `jp ${tam ? `jp-${tam}` : ""} ${clase} ${furigana ? "" : "sin-furigana"} ${colores ? "" : "sin-colores"}`;
  const hayKanji = /[一-鿿]/.test(escritura);
  const base = colorearHtml(escritura);

  if (!lectura || !hayKanji || lectura === escritura) {
    return <span className={cls} dangerouslySetInnerHTML={{ __html: base }} />;
  }
  return (
    <span
      className={cls}
      dangerouslySetInnerHTML={{ __html: `<ruby>${base}<rt>${lectura}</rt></ruby>` }}
    />
  );
}

/** Bloque de texto que ya trae <ruby> y <em class="g"> dentro (las lecturas). */
export function JpHtml({ html, clase = "" }: { html: string; clase?: string }) {
  const { furigana, colores } = useAjustes();
  return (
    <div
      className={`jp ${clase} ${furigana ? "" : "sin-furigana"} ${colores ? "" : "sin-colores"}`}
      dangerouslySetInnerHTML={{ __html: colorearHtml(html) }}
    />
  );
}

/** Igual pero en línea: títulos, preguntas y opciones. */
export function JpEnLinea({ html, clase = "" }: { html: string; clase?: string }) {
  const { furigana, colores } = useAjustes();
  return (
    <span
      className={`jp ${clase} ${furigana ? "" : "sin-furigana"} ${colores ? "" : "sin-colores"}`}
      dangerouslySetInnerHTML={{ __html: colorearHtml(html) }}
    />
  );
}

/** Lee en voz alta con la voz japonesa del navegador, si la hay. */
export function BotonVoz({ texto }: { texto: string }) {
  const hablar = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "ja-JP";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  return (
    <button className="btn fantasma" onClick={hablar} title="Escuchar" aria-label="Escuchar">🔊</button>
  );
}

/** Leyenda de colores: qué nivel es cada uno. */
export function Leyenda() {
  const { colores } = useAjustes();
  if (!colores) return null;
  return (
    <div className="leyenda">
      {(["N5", "N4", "N3", "N2", "N1"] as const).map((n) => (
        <span key={n} className={`k ${n.toLowerCase()}`}>{n}</span>
      ))}
      <span className="tenue" style={{ fontWeight: 400 }}>nivel de cada kanji</span>
    </div>
  );
}
