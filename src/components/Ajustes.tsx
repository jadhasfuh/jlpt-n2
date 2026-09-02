"use client";
import { configurarSupabase } from "@/lib/supabase";
import { createContext, useContext, useEffect, useState } from "react";
import {
  COOKIE_IDIOMA, IDIOMA_POR_DEFECTO, t as traducir,
  type Clave, type Idioma,
} from "@/lib/idioma";

type Ajustes = {
  furigana: boolean;
  significado: boolean;
  colores: boolean;
  tema: "auto" | "claro" | "oscuro";
  idioma: Idioma;
  /** Si todo está abierto o hace falta suscripción. Lo decide el servidor:
      una NEXT_PUBLIC_ no llega al navegador porque el Dockerfile no pasa
      variables al build, así que el interruptor no se puede leer aquí. */
  accesoAbierto: boolean;
  /** Dentro de la app de Play no puede verse nada de suscripción. */
  enApp: boolean;
  /**
   * Si QUIEN ESTÁ MIRANDO puede abrir lo de pago: o porque el acceso está
   * abierto para todos, o porque tiene suscripción, cortesía o cuenta libre.
   *
   * No es lo mismo que `accesoAbierto`, y confundirlos le ponía un candado a
   * cada sección incluso a quien acababa de pagar.
   */
  tieneAcceso: boolean;
  alternar: (k: "furigana" | "significado" | "colores") => void;
  cambiarTema: () => void;
  cambiarIdioma: (i: Idioma) => void;
  t: (clave: Clave, vars?: Record<string, string | number>) => string;
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

export function ProveedorAjustes({
  children, idiomaInicial = IDIOMA_POR_DEFECTO, accesoAbierto = true, enApp = false,
  tieneAcceso = true, supabase,
}: {
  children: React.ReactNode;
  /** Lo resuelve el servidor (cookie o Accept-Language) para que no parpadee. */
  idiomaInicial?: Idioma;
  /** También del servidor: ver el comentario del tipo Ajustes. */
  accesoAbierto?: boolean;
  enApp?: boolean;
  tieneAcceso?: boolean;
  /** Credenciales del cliente de Supabase, leídas por el servidor al arrancar.
      Se configura antes de pintar nada para que cualquier hijo que hable con
      Supabase ya encuentre el cliente montado. */
  supabase?: { url: string; key: string } | null;
}) {
  configurarSupabase(supabase?.url, supabase?.key);
  // El furigana empieza apagado a propósito: primero se intenta leer sin ayuda.
  const [furigana, setFurigana] = useState(false);
  const [significado, setSignificado] = useState(false);
  const [colores, setColores] = useState(true);   // los kanji entran coloreados
  const [tema, setTema] = useState<"auto" | "claro" | "oscuro">("auto");
  const [idioma, setIdioma] = useState<Idioma>(idiomaInicial);

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

  // En cookie, no en localStorage: el servidor tiene que poder leerlo para
  // mandar la página ya traducida.
  const cambiarIdioma = (i: Idioma) => {
    setIdioma(i);
    document.documentElement.lang = i;
    document.cookie = `${COOKIE_IDIOMA}=${i}; path=/; max-age=31536000; samesite=lax`;
  };

  const t = (clave: Clave, vars?: Record<string, string | number>) =>
    traducir(clave, idioma, vars);

  return (
    <Ctx.Provider value={{ accesoAbierto, enApp, tieneAcceso,
      furigana, significado, colores, tema, idioma,
      alternar, cambiarTema, cambiarIdioma, t,
    }}>
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
  const { furigana, alternar, t } = useAjustes();
  return (
    <button className={`btn chico ${furigana ? "encendido" : ""}`}
            onClick={() => alternar("furigana")}
            title={t("aj.furigana")}>
      <span className="jp">ふりがな</span>
    </button>
  );
}

/** Los dos botones rápidos. Van en cada paso de cada sección. */
export function BotonesRapidos({ compacto = false }: { compacto?: boolean }) {
  const { furigana, significado, colores, alternar, t } = useAjustes();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        className={`btn ${furigana ? "encendido" : ""}`}
        onClick={() => alternar("furigana")}
        title={t("aj.furigana")}
      >
        <span className="jp">ふりがな</span>
      </button>
      <button
        className={`btn ${significado ? "encendido" : ""}`}
        onClick={() => alternar("significado")}
        title={t("aj.significado")}
      >
        {compacto ? <span className="jp">意味</span> : <><span className="jp">意味</span> · {t("aj.significadoLargo")}</>}
      </button>
      <button
        className={`btn ${colores ? "encendido" : ""}`}
        onClick={() => alternar("colores")}
        title={t("aj.colores")}
      >
        <span className="jp">色</span>
      </button>
    </div>
  );
}
