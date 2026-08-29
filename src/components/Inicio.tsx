"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_NIVEL, DESC_NIVEL, type Nivel } from "@/lib/tipos";
import { contarPendientes, leerProgreso, resumen } from "@/lib/progreso";
import { Anillo } from "./Anillo";
import { ACCESO_ABIERTO } from "@/lib/acceso";

type Resumen = { id: Nivel; palabras: number; gramatica: number; unidades: number; secciones: number };

export function Inicio({ niveles, totales }: {
  niveles: Resumen[];
  totales: { palabras: number; gramatica: number; unidades: number };
}) {
  const [r, setR] = useState<ReturnType<typeof resumen> | null>(null);
  const [pend, setPend] = useState({ vencidas: 0, hoy: 0 });
  const [avance, setAvance] = useState<Record<string, number>>({});

  useEffect(() => {
    const recalcular = () => {
      const p = leerProgreso();
      setR(resumen(p));
      setPend(contarPendientes(p));
      // avance por nivel = unidades practicadas de ese nivel / total
      const a: Record<string, number> = {};
      for (const n of niveles) {
        const hechas = Object.entries(p.unidades)
          .filter(([id, u]) => u.practicada && id.startsWith(`${n.id}/`)).length;
        a[n.id] = n.unidades ? hechas / n.unidades : 0;
      }
      setAvance(a);
    };
    recalcular();
    window.addEventListener("progreso", recalcular);
    return () => window.removeEventListener("progreso", recalcular);
  }, [niveles]);

  return (
    <>
      <section style={{ padding: "22px 0 18px" }}>
        <h1 className="jp" style={{ fontSize: 30, margin: "0 0 2px" }}>日本語能力試験</h1>
        <p className="silencio" style={{ margin: 0 }}>
          {totales.palabras.toLocaleString("es")} palabras y {totales.gramatica} puntos de
          gramática, en unidades de 20. Elige por dónde empezar.
        </p>
      </section>

      {r && (
        <section className="tarjeta" style={{ marginBottom: 18, display: "flex", gap: 18, flexWrap: "wrap" }}>
          {[
            [`${r.xp}`, "XP"],
            [r.racha ? `${r.racha} 🔥` : "0", "días seguidos"],
            [`${r.dominadas}`, "dominadas"],
            [`${r.unidades}`, "unidades"],
          ].map(([v, t]) => (
            <div key={t} style={{ minWidth: 68 }}>
              <div style={{ fontSize: 21, fontWeight: 700 }}>{v}</div>
              <div className="tenue">{t}</div>
            </div>
          ))}
        </section>
      )}

      {pend.vencidas > 0 && (
        <Link href="/repaso" className="fila" style={{ marginBottom: 14, borderColor: "var(--acento)" }}>
          <div className="anillo" style={{ ["--pct" as string]: 100, ["--tono" as string]: "var(--acento)" }}>
            <span>{pend.vencidas}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Te toca repasar</div>
            <div className="tenue">
              {pend.vencidas} {pend.vencidas === 1 ? "palabra vencida" : "palabras vencidas"}
              {pend.hoy > 0 && ` · ${pend.hoy} más hoy`}
            </div>
          </div>
          <span className="flecha">›</span>
        </Link>
      )}

      <div className="lista">
        {niveles.map((n) => (
          <Link key={n.id} href={`/n/${n.id}`} className="fila">
            <Anillo pct={avance[n.id] ?? 0} tono={COLOR_NIVEL[n.id]} texto={n.id} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{DESC_NIVEL[n.id]}</div>
              <div className="tenue">
                {n.palabras.toLocaleString("es")} palabras
                {n.gramatica ? ` · ${n.gramatica} gramática` : ""} · {n.secciones} secciones
              </div>
            </div>
            <span className="flecha">›</span>
          </Link>
        ))}
      </div>

      {!ACCESO_ABIERTO && (
        <p className="tenue" style={{ marginTop: 18 }}>
          La sección 人と体 de cada nivel es libre. Para el resto hará falta una cuenta.
        </p>
      )}
    </>
  );
}
