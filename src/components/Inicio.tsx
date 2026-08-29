"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_NIVEL, DESC_NIVEL, type Nivel } from "@/lib/tipos";
import { contarPendientes, leerProgreso, resumen } from "@/lib/progreso";
import { Anillo } from "./Anillo";
import { ACCESO_ABIERTO } from "@/lib/acceso";

type Resumen = { id: Nivel; palabras: number; gramatica: number; unidades: number; secciones: number };
type UnidadOrden = { id: string; ja: string; es: string; nivel: string; p: number; k: number; g: number };

export function Inicio({ niveles, totales, orden }: {
  niveles: Resumen[];
  totales: { palabras: number; gramatica: number; unidades: number };
  orden: UnidadOrden[];
}) {
  const [r, setR] = useState<ReturnType<typeof resumen> | null>(null);
  const [pend, setPend] = useState({ vencidas: 0, hoy: 0 });
  const [siguiente, setSiguiente] = useState<UnidadOrden | null>(null);
  const [avance, setAvance] = useState<Record<string, number>>({});

  useEffect(() => {
    const recalcular = () => {
      const p = leerProgreso();
      setR(resumen(p));
      setPend(contarPendientes(p));
      setSiguiente(orden.find((u) => !p.unidades[u.id]?.practicada) ?? null);
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
  }, [niveles, orden]);

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

      {/* Lo primero al abrir: qué toca hoy y por dónde seguir. Antes esto era
          un catálogo y había que decidir uno mismo cada vez. */}
      {siguiente && (
        <section className="tarjeta" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="jp etiqueta" style={{ fontSize: 13 }}>今日の学習</span>
            <span className="tenue">lo de hoy</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 14px", flexWrap: "wrap" }}>
            <span className={`pastilla ${siguiente.nivel.toLowerCase()}`}>{siguiente.nivel}</span>
            <div style={{ minWidth: 0 }}>
              <div className="jp" style={{ fontSize: 21, lineHeight: 1.3 }}>{siguiente.ja}</div>
              <div className="tenue">
                {siguiente.p} palabras · {siguiente.k} kanji
                {siguiente.g > 0 && ` · ${siguiente.g} gramática`}
                {pend.vencidas > 0 && ` · ${pend.vencidas} repasos`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn primario" style={{ flex: 1, minWidth: 160 }}
                  href={`/u/${siguiente.id.split("/")[0]}/${siguiente.id.split("/")[1]}/${siguiente.id.split("/")[2]}`}>
              {r?.unidades ? "Continuar" : "Empezar"} →
            </Link>
            {pend.vencidas > 0 && (
              <Link className="btn" href="/repaso">Repasar {pend.vencidas}</Link>
            )}
          </div>
        </section>
      )}

    </>
  );
}
