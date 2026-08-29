"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Ajustes = {
  furigana: boolean;
  significado: boolean;
  colores: boolean;
  tema: "auto" | "claro" | "oscuro";
  alternar: (k: "furigana" | "significado" | "colores") => void;
  cambiarTema: () => void;
};

const Ctx = createContext<Ajustes | null>(null);
export const useAjustes = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAjustes fuera del proveedor");
  return c;
};

const leer = <T,>(k: string, def: T): T => {
  if (typeof window === "undefined") return def;
  try {
    const v = localStorage.getItem(k);
    return v === null ? def : (JSON.parse(v) as T);
  } catch { return def; }
};

export function ProveedorAjustes({ children }: { children: React.ReactNode }) {
  // El furigana empieza apagado a propósito: primero se intenta leer sin ayuda.
  const [furigana, setFurigana] = useState(false);
  const [significado, setSignificado] = useState(false);
  const [colores, setColores] = useState(true);   // los kanji entran coloreados
  const [tema, setTema] = useState<"auto" | "claro" | "oscuro">("auto");

  useEffect(() => {
    setFurigana(leer("jlpt.furigana", false));
    setSignificado(leer("jlpt.significado", false));
    setColores(leer("jlpt.colores", true));
    setTema(leer("jlpt.tema", "auto"));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.tema = tema === "auto" ? "" : tema;
    try { localStorage.setItem("jlpt.tema", JSON.stringify(tema)); } catch {}
  }, [tema]);

  const alternar = (k: "furigana" | "significado" | "colores") => {
    const set = k === "furigana" ? setFurigana : k === "significado" ? setSignificado : setColores;
    const valor = !(k === "furigana" ? furigana : k === "significado" ? significado : colores);
    set(valor);
    try { localStorage.setItem(`jlpt.${k}`, JSON.stringify(valor)); } catch {}
  };

  const cambiarTema = () =>
    setTema((t) => (t === "auto" ? "claro" : t === "claro" ? "oscuro" : "auto"));

  return (
    <Ctx.Provider value={{ furigana, significado, colores, tema, alternar, cambiarTema }}>
      {children}
    </Ctx.Provider>
  );
}

/**
 * Sólo el interruptor de furigana, para las pantallas a pantalla completa:
 * dentro de un test no se puede ir al menú a activarlo, y quedarse atascado
 * en una palabra por no ver la lectura no enseña nada.
 */
export function BotonFurigana() {
  const { furigana, alternar } = useAjustes();
  return (
    <button className={`btn chico ${furigana ? "encendido" : ""}`}
            onClick={() => alternar("furigana")}
            title="Mostrar u ocultar la lectura en kana">
      <span className="jp">ふりがな</span>
    </button>
  );
}

/** Los dos botones rápidos. Van en cada paso de cada sección. */
export function BotonesRapidos({ compacto = false }: { compacto?: boolean }) {
  const { furigana, significado, colores, alternar } = useAjustes();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        className={`btn ${furigana ? "encendido" : ""}`}
        onClick={() => alternar("furigana")}
        title="Mostrar u ocultar la lectura en kana"
      >
        <span className="jp">ふりがな</span>
      </button>
      <button
        className={`btn ${significado ? "encendido" : ""}`}
        onClick={() => alternar("significado")}
        title="Mostrar u ocultar el significado"
      >
        {compacto ? <span className="jp">意味</span> : <><span className="jp">意味</span> · significado</>}
      </button>
      <button
        className={`btn ${colores ? "encendido" : ""}`}
        onClick={() => alternar("colores")}
        title="Colorear los kanji según su nivel JLPT"
      >
        <span className="jp">色</span>
      </button>
    </div>
  );
}
