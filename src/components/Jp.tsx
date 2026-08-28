"use client";
import { useAjustes } from "./Ajustes";

/** Texto japonés con furigana opcional. Nunca se muestra romaji. */
export function Jp({
  escritura, lectura, clase = "", tam,
}: { escritura: string; lectura?: string; clase?: string; tam?: "grande" | "medio" }) {
  const { furigana } = useAjustes();
  const cls = `jp ${tam ? `jp-${tam}` : ""} ${clase}`;
  const hayKanji = /[一-鿿]/.test(escritura);

  if (!lectura || !hayKanji || lectura === escritura) {
    return <span className={cls}>{escritura}</span>;
  }
  return (
    <span className={`${cls} ${furigana ? "" : "sin-furigana"}`}>
      <ruby>
        {escritura}
        <rt>{lectura}</rt>
      </ruby>
    </span>
  );
}

/** Bloque de texto que ya viene con <ruby> dentro (las lecturas generadas). */
export function JpHtml({ html, clase = "" }: { html: string; clase?: string }) {
  const { furigana } = useAjustes();
  return (
    <div
      className={`jp ${clase} ${furigana ? "" : "sin-furigana"}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Igual que JpHtml pero en línea: títulos, preguntas y opciones con <ruby>. */
export function JpEnLinea({ html, clase = "" }: { html: string; clase?: string }) {
  const { furigana } = useAjustes();
  return (
    <span
      className={`jp ${clase} ${furigana ? "" : "sin-furigana"}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Lee en voz alta con la voz japonesa del propio navegador (si la hay). */
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
    <button className="btn fantasma" onClick={hablar} title="Escuchar" aria-label="Escuchar">
      🔊
    </button>
  );
}
