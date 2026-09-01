"use client";
import { useState } from "react";
import type { Gramatica } from "@/lib/tipos";
import { Jp } from "./Jp";
import { useAjustes } from "./Ajustes";
import { significado as sig, significadoSecundario as sigSec } from "@/lib/idioma";
import { Reportar } from "./Reportar";

const CAT: Record<string, { es: string; en: string }> = {
  conectores:   { es: "Conectores",                 en: "Connectors" },
  tiempo:       { es: "Tiempo y secuencia",         en: "Time and sequence" },
  grado:        { es: "Grado e intensidad",         en: "Degree and intensity" },
  adicion:      { es: "Adición y enumeración",      en: "Addition and listing" },
  contraste:    { es: "Contraste y concesión",      en: "Contrast and concession" },
  causa:        { es: "Causa y razón",              en: "Cause and reason" },
  condicion:    { es: "Condición",                  en: "Condition" },
  grado_limite: { es: "Alcance y límite",           en: "Scope and limit" },
  comparacion:  { es: "Comparación",                en: "Comparison" },
  modo:         { es: "Modo y manera",              en: "Means and manner" },
  estado_cambio:{ es: "Estado y cambio",            en: "State and change" },
  relacion:     { es: "Relación y correspondencia", en: "Relation and correspondence" },
  punto_vista:  { es: "Punto de vista",             en: "Point of view" },
  obligacion:   { es: "Obligación y prohibición",   en: "Obligation and prohibition" },
  posibilidad:  { es: "Posibilidad",                en: "Possibility" },
  modal:        { es: "Juicio y suposición",        en: "Judgement and supposition" },
  enfasis:      { es: "Énfasis",                    en: "Emphasis" },
  resultado:    { es: "Resultado",                  en: "Result" },
  estilo:       { es: "Registro y estilo",          en: "Register and style" },
};
export function PanelGramatica({ items, agrupar = false }: { items: Gramatica[]; agrupar?: boolean }) {
  const { significado, idioma, t } = useAjustes();
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});

  const grupos = agrupar
    ? Object.entries(items.reduce<Record<string, Gramatica[]>>((acc, g) => {
        (acc[g.cat] ??= []).push(g); return acc;
      }, {}))
    : [["", items] as [string, Gramatica[]]];

  return (
    <div style={{ marginBottom: 14 }}>
      {grupos.map(([cat, lista]) => (
        <div key={cat}>
          {cat && <p className="etiqueta" style={{ margin: "16px 0 6px" }}>{CAT[cat]?.[idioma] ?? cat}</p>}
          <div className="tarjeta" style={{ padding: "4px 14px" }}>
            <table className="tabla-vocab">
              <tbody>
                {lista.map((g) => {
                  const visible = significado || abierto[g.id];
                  return (
                    <tr key={g.id}>
                      <td style={{ width: "44%" }}>
                        <Jp escritura={g.forma} lectura={g.lectura} clase="jp-medio" />
                      </td>
                      <td>
                        {visible ? (
                          <>
                            <button className="revelado-td" disabled={significado}
                                    onClick={() => setAbierto({ ...abierto, [g.id]: false })}>
                              <span style={{ fontSize: 14 }}>{sig(g, idioma)}</span>
                              <span className="tenue" style={{ display: "block" }}>{sigSec(g, idioma)}</span>
                            </button>
                            <Reportar tipo="gramatica" ref_={g.id} compacto
                                      visto={`${g.forma} — ${sig(g, idioma)}`} />
                          </>
                        ) : (
                          <button className="btn fantasma" style={{ paddingLeft: 0 }}
                                  onClick={() => setAbierto({ ...abierto, [g.id]: true })}>
                            {t("com.verSig")}
                          </button>
                        )}
                      </td>
                      <td className="tenue" style={{ width: 34, textAlign: "right" }}>{g.tier}/4</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
