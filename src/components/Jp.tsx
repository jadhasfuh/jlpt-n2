"use client";
import { useEffect, useState } from "react";
import { useAjustes } from "./Ajustes";
import { colorearHtml } from "@/lib/colores";

/** Texto japonés con furigana y kanji coloreados por nivel. Nunca romaji. */
export function Jp({
  escritura, lectura, clase = "", tam, revelar = false,
}: {
  escritura: string; lectura?: string; clase?: string;
  tam?: "grande" | "medio";
  /** Enseña la lectura y el color aunque estén apagados: al «ver significado»
   *  uno quiere ver la palabra entera, no media. Se apaga solo en la siguiente. */
  revelar?: boolean;
}) {
  const { furigana, colores } = useAjustes();
  const verFurigana = furigana || revelar;
  const verColores = colores || revelar;
  const cls = `jp ${tam ? `jp-${tam}` : ""} ${clase} ${verFurigana ? "" : "sin-furigana"} ${verColores ? "" : "sin-colores"}`;
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

/**
 * Lee en voz alta con la voz japonesa del navegador. El mismo botón para y
 * reanuda: en un texto largo, no poder callarlo era desesperante.
 */
export function BotonVoz({ texto, etiqueta }: { texto: string; etiqueta?: string }) {
  const [estado, setEstado] = useState<"parado" | "hablando" | "pausado">("parado");

  // Si se cambia de pantalla mientras habla, que no siga sonando.
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const alternar = () => {
    const s = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!s) return;
    if (estado === "hablando") { s.pause(); setEstado("pausado"); return; }
    if (estado === "pausado") { s.resume(); setEstado("hablando"); return; }
    s.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "ja-JP";
    u.rate = 0.85;
    u.onend = () => setEstado("parado");
    u.onerror = () => setEstado("parado");
    setEstado("hablando");
    s.speak(u);
  };

  const parar = () => {
    window.speechSynthesis?.cancel();
    setEstado("parado");
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <button className="btn fantasma" onClick={alternar}
              title={estado === "hablando" ? "Pausar" : estado === "pausado" ? "Seguir" : "Escuchar"}
              aria-label={estado === "hablando" ? "Pausar" : "Escuchar"}>
        {estado === "hablando" ? "⏸" : estado === "pausado" ? "▶️" : "🔊"}
        {etiqueta && <span style={{ marginLeft: 6, fontSize: 13 }}>{etiqueta}</span>}
      </button>
      {estado !== "parado" && (
        <button className="btn fantasma" onClick={parar} title="Detener" aria-label="Detener">⏹</button>
      )}
    </span>
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
