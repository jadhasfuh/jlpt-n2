"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_NIVEL, DESC_NIVEL, NUMERAL_NIVEL, type Nivel } from "@/lib/tipos";
import { contarPendientes, leerProgreso, resumen } from "@/lib/progreso";
import { Anillo } from "./Anillo";
import { ACCESO_ABIERTO } from "@/lib/acceso";
import { IcCronometro, IcDerecha, IcRacha } from "./Iconos";

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
      <section style={{ padding: "6px 0 12px" }}>
        <h1 className="jp" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.25, margin: "0 0 6px" }}>
          日本語能力試験
        </h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--tinta-2)", maxWidth: "33ch" }}>
          {totales.palabras.toLocaleString("es")} palabras y {totales.gramatica} puntos de
          gramática, en unidades de 20. Elige por dónde empezar.
        </p>
      </section>

      {r && (
        <div className="tira-stats">
          <div>
            <b>{r.xp}</b>
            <i>XP</i>
          </div>
          <div>
            <b style={{ color: r.racha ? "var(--rojo)" : undefined }}>
              {r.racha}
              {r.racha > 0 && <IcRacha size={14} weight="fill" />}
            </b>
            <i>días</i>
          </div>
          <div>
            <b>{r.dominadas}</b>
            <i>dominadas</i>
          </div>
          <div>
            <b>{r.unidades}</b>
            <i>unidades</i>
          </div>
        </div>
      )}

      {pend.vencidas > 0 && (
        <Link href="/repaso" className="fila acento" style={{ marginBottom: 8 }}>
          <Anillo pct={1} tono="var(--acento)" texto={`${pend.vencidas}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fila-titulo">Te toca repasar</div>
            <div className="fila-sub">
              {pend.vencidas} {pend.vencidas === 1 ? "palabra vencida" : "palabras vencidas"}
              {pend.hoy > 0 && ` · ${pend.hoy} más hoy`}
            </div>
          </div>
          <span className="flecha"><IcDerecha size={15} /></span>
        </Link>
      )}

      <Link href="/rapido" className="fila" style={{ marginBottom: 12, padding: "11px 14px" }}>
        <span className="disco"><IcCronometro size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fila-titulo">Cinco minutos</div>
          <div className="fila-sub">Repaso corto de lo que tienes más flojo</div>
        </div>
        <span className="flecha"><IcDerecha size={15} /></span>
      </Link>

      <h2 className="enc-seccion">Niveles</h2>

      <div className="lista rejilla-niveles">
        {niveles.map((n) => (
          <Link key={n.id} href={`/n/${n.id}`} className="fila">
            <span className="numeral jp">{NUMERAL_NIVEL[n.id]}</span>
            <Anillo pct={avance[n.id] ?? 0} tono={COLOR_NIVEL[n.id]} texto={n.id} tam={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{DESC_NIVEL[n.id]}</div>
              {/* Una sola línea: con el recuento de gramática envuelve y la lista
                  deja de caber en una pantalla de móvil. */}
              <div className="tenue" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {n.palabras.toLocaleString("es")} palabras · {n.secciones} secciones
              </div>
            </div>
            <span className="flecha"><IcDerecha size={14} /></span>
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
