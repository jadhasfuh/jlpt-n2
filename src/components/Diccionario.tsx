"use client";
import { useEffect, useState } from "react";
import type { Palabra } from "@/lib/tipos";
import { useAjustes } from "./Ajustes";

type Caja = { x: number; y: number; palabras: Palabra[]; consulta: string };

/**
 * Diccionario interno: se selecciona cualquier trozo de japonés en la página y
 * aparece el significado. No hace falta salir de la lección.
 */
export function Diccionario() {
  const [caja, setCaja] = useState<Caja | null>(null);
  const { significado } = useAjustes();

  useEffect(() => {
    let cancelado = false;

    const alSoltar = async () => {
      const sel = window.getSelection();
      const texto = sel?.toString().trim() ?? "";
      if (!texto || texto.length > 20 || !/[぀-ヿ一-鿿]/.test(texto)) {
        setCaja(null);
        return;
      }
      const rango = sel!.getRangeAt(0).getBoundingClientRect();
      try {
        const r = await fetch(`/api/diccionario?q=${encodeURIComponent(texto)}`);
        const { resultados } = (await r.json()) as { resultados: Palabra[] };
        if (cancelado) return;
        setCaja(
          resultados.length
            ? { x: rango.left, y: rango.bottom + 8, palabras: resultados, consulta: texto }
            : null,
        );
      } catch { /* sin conexión: no pasa nada */ }
    };

    const alTocarFuera = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".dicc")) setTimeout(alSoltar, 0);
    };

    document.addEventListener("mouseup", alTocarFuera);
    document.addEventListener("touchend", alSoltar);
    return () => {
      cancelado = true;
      document.removeEventListener("mouseup", alTocarFuera);
      document.removeEventListener("touchend", alSoltar);
    };
  }, []);

  if (!caja) return null;
  const x = Math.min(caja.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 320);

  return (
    <div className="dicc" style={{ left: Math.max(12, x), top: caja.y }}>
      {caja.palabras.map((p, i) => (
        <div key={p.id} style={{ marginTop: i ? 12 : 0 }}>
          <div className="jp" style={{ fontSize: 20 }}>
            {p.escritura}
            {p.lectura !== p.escritura && <span className="tenue">　{p.lectura}</span>}
          </div>
          <div style={{ fontSize: 13.5 }}>{p.es || p.en}</div>
          {p.registro.length > 0 && <div className="tenue"><em>{p.registro.join(" · ")}</em></div>}
          {significado && p.es && p.en !== p.es && <div className="tenue">{p.en}</div>}
        </div>
      ))}
      <div className="tenue" style={{ marginTop: 10 }}>
        selección: {caja.consulta}
      </div>
    </div>
  );
}
