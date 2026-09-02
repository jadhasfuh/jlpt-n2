"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Gramatica, Kanji, UnidadMeta } from "@/lib/tipos";
import { cubierta, leerProgreso, medalla, type Progreso } from "@/lib/progreso";
import { IcDerecha } from "./Iconos";
import { useAjustes } from "./Ajustes";


export function ListaUnidades({ nivel, seccion, unidades, gramatica, kanji }: {
  nivel: string; seccion: string; unidades: UnidadMeta[];
  gramatica: Gramatica[]; kanji: Kanji[];
}) {
  const { t, idioma } = useAjustes();
  const [p, setP] = useState<Progreso | null>(null);

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  return (
    <>
      {/* Abren su propia pantalla: desplegarlas aquí empujaba la lista de
          unidades muy abajo y se perdía el sitio donde estabas. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Link className="btn" style={{ flex: 1 }} href={`/n/${nivel}/${seccion}/kanji`}>
          <span className="jp">漢字</span> {kanji.length}
        </Link>
        {gramatica.length > 0 && (
          <Link className="btn" style={{ flex: 1 }} href={`/n/${nivel}/${seccion}/gramatica`}>
            <span className="jp">文法</span> {gramatica.length}
          </Link>
        )}
      </div>

      <div className="lista">
        {unidades.map((u) => {
          const est = p?.unidades[u.id];
          const idCorto = u.id.split("/").pop()!;
          return (
            <Link key={u.id} href={`/u/${nivel}/${u.id.split("/")[1]}/${idCorto}`} className="fila">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="jp" style={{ fontSize: 19, lineHeight: 1.4 }}>{u.ja}</div>
                {/* El nombre de la unidad va en japonés arriba; debajo, el
                    del idioma de la interfaz y lo que trae dentro. */}
                <div style={{ fontSize: 12.5, color: "var(--tinta-2)" }}>
                  {idioma === "en" ? u.en : u.es}
                </div>
                <div className="tenue">
                  {t("cur.unidadSub", { palabras: u.items, kanji: u.kanji })}
                  {u.gramatica ? t("cur.masGramCorto", { n: u.gramatica }) : ""}
                </div>
              </div>
              {est?.mejor ? (
                <span className={`pastilla ${medalla(est.mejor) ? "acento" : ""}`}
                      title={t("cur.mejorTestTit", { n: est.mejor })}>{est.mejor}%</span>
              ) : null}
              {cubierta(est) && !est?.mejor ? <span className="punto dominada" /> : null}
              <span className="flecha"><IcDerecha size={14} /></span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
