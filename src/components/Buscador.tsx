"use client";
import { useEffect, useRef, useState } from "react";
import type { Palabra } from "@/lib/tipos";
import { Jp } from "./Jp";
import { IcCerrar } from "./Iconos";

/**
 * Buscador del diccionario interno. Acepta japonés (kanji o kana) y también
 * español: buscar «lluvia» y encontrar 雨 es la mitad de para qué sirve.
 */
export function Buscador({ alCerrar }: { alCerrar: () => void }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Palabra[]>([]);
  const caja = useRef<HTMLInputElement>(null);

  useEffect(() => { caja.current?.focus(); }, []);

  useEffect(() => {
    const cerrarConEsc = (e: KeyboardEvent) => { if (e.key === "Escape") alCerrar(); };
    window.addEventListener("keydown", cerrarConEsc);
    return () => window.removeEventListener("keydown", cerrarConEsc);
  }, [alCerrar]);

  useEffect(() => {
    const texto = q.trim();
    if (!texto) { setRes([]); return; }
    let vivo = true;
    // Espera a que se deje de teclear: una consulta por pulsación sobra.
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/diccionario?libre=1&q=${encodeURIComponent(texto)}`);
        const { resultados } = (await r.json()) as { resultados: Palabra[] };
        if (vivo) setRes(resultados);
      } catch { /* sin conexión: se queda como estaba */ }
    }, 180);
    return () => { vivo = false; clearTimeout(t); };
  }, [q]);

  return (
    <div className="velo" onClick={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="globo" style={{ position: "relative", padding: "18px 18px 8px" }}>
        <button className="globo-cerrar" onClick={alCerrar} aria-label="Cerrar"><IcCerrar size={18} /></button>
        <input
          ref={caja} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="漢字, かな o español…"
          aria-label="Buscar una palabra"
          style={{
            width: "100%", padding: "10px 12px", fontSize: 15, fontFamily: "var(--jp)",
            background: "transparent", color: "var(--tinta)", marginTop: 6,
            border: "1px solid var(--linea)", borderRadius: "var(--radio-sm)",
          }}
        />
        <div style={{ marginTop: 10 }}>
          {q.trim() && res.length === 0 && (
            <p className="tenue" style={{ padding: "10px 2px" }}>Sin resultados.</p>
          )}
          {res.map((p) => (
            <div key={p.id} style={{ padding: "9px 2px", borderTop: "1px solid var(--linea)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <Jp escritura={p.kanji || p.kana} lectura={p.kana} clase="jp-medio" revelar />
                {p.jlpt && <span className={`pastilla ${p.jlpt.toLowerCase()}`}>{p.jlpt}</span>}
              </div>
              <div style={{ fontSize: 13 }}>{p.es}</div>
              {p.en && <div className="tenue">{p.en}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
