"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Nivel } from "@/lib/tipos";
import { leerProgreso } from "@/lib/progreso";

export function Panel({ niveles }: { niveles: Nivel[] }) {
  const [hechos, setHechos] = useState<string[] | null>(null);
  useEffect(() => setHechos(leerProgreso().niveles), []);

  if (hechos === null) return <div className="tarjeta" style={{ height: 132 }} />;

  const siguiente = niveles.find((n) => !hechos.includes(n.id)) ?? niveles[niveles.length - 1];
  const pct = Math.round((hechos.length / niveles.length) * 100);

  return (
    <section className="tarjeta">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="etiqueta">
          {hechos.length ? "Tu siguiente sesión" : "Empieza por aquí"}
        </span>
        <div className="crecer" style={{ flex: 1 }} />
        <span className="tenue">{hechos.length} / {niveles.length} sesiones</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "14px 0 16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--tinta-3)" }}>Sesión {siguiente.numero}</div>
          <div className="jp" style={{ fontSize: 28 }}>{siguiente.titulo_ja}</div>
          <div className="silencio">{siguiente.titulo_es}</div>
        </div>
        <div style={{ flex: 1 }} />
        <Link className="btn primario" href={`/nivel/${siguiente.id}`}>
          {hechos.length ? "Continuar" : "Comenzar"}
        </Link>
      </div>

      <div className="barra"><i style={{ width: `${pct}%` }} /></div>
    </section>
  );
}
