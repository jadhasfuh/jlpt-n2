"use client";
import { useState } from "react";
import type { Gramatica } from "@/lib/tipos";
import { Jp } from "./Jp";
import { useAjustes } from "./Ajustes";

const CAT: Record<string, string> = {
  conectores: "Conectores", tiempo: "Tiempo y secuencia", grado: "Grado e intensidad",
  adicion: "Adición y enumeración", contraste: "Contraste y concesión", causa: "Causa y razón",
  condicion: "Condición", grado_limite: "Alcance y límite", comparacion: "Comparación",
  modo: "Modo y manera", estado_cambio: "Estado y cambio", relacion: "Relación y correspondencia",
  punto_vista: "Punto de vista", obligacion: "Obligación y prohibición", posibilidad: "Posibilidad",
  modal: "Juicio y suposición", enfasis: "Énfasis", resultado: "Resultado", estilo: "Registro y estilo",
};

export function PanelGramatica({ items, agrupar = false }: { items: Gramatica[]; agrupar?: boolean }) {
  const { significado } = useAjustes();
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
          {cat && <p className="etiqueta" style={{ margin: "16px 0 6px" }}>{CAT[cat] ?? cat}</p>}
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
                            <div style={{ fontSize: 14 }}>{g.es}</div>
                            <div className="tenue">{g.en}</div>
                          </>
                        ) : (
                          <button className="btn fantasma" style={{ paddingLeft: 0 }}
                                  onClick={() => setAbierto({ ...abierto, [g.id]: true })}>
                            ver significado
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
