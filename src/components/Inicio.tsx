"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_NIVEL, NUMERAL_NIVEL, type Nivel } from "@/lib/tipos";
import { contarPendientes, leerProgreso, resumen } from "@/lib/progreso";
import { Anillo } from "./Anillo";
import { IcCronometro, IcDerecha, IcExamen, IcRacha } from "./Iconos";
import { useAjustes } from "./Ajustes";

type Resumen = { id: Nivel; palabras: number; gramatica: number; unidades: number; secciones: number };

export function Inicio({ niveles, totales }: {
  niveles: Resumen[];
  totales: { palabras: number; gramatica: number; unidades: number };
}) {
  const { t, accesoAbierto } = useAjustes();
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
          {t("inicio.sub", {
            palabras: totales.palabras.toLocaleString(),
            gramatica: totales.gramatica,
          })}
        </p>
      </section>

      {r && (
        <div className="tira-stats">
          <div>
            <b>{r.xp}</b>
            <i>{t("inicio.xp")}</i>
          </div>
          <div>
            <b style={{ color: r.racha ? "var(--rojo)" : undefined }}>
              {r.racha}
              {r.racha > 0 && <IcRacha size={14} weight="fill" />}
            </b>
            <i>{t("inicio.dias")}</i>
          </div>
          <div>
            <b>{r.dominadas}</b>
            <i>{t("inicio.dominadas")}</i>
          </div>
          <div>
            <b>{r.unidades}</b>
            <i>{t("inicio.unidades")}</i>
          </div>
        </div>
      )}

      {pend.vencidas > 0 && (
        <Link href="/repaso" className="fila acento" style={{ marginBottom: 8 }}>
          <Anillo pct={1} tono="var(--acento)" texto={`${pend.vencidas}`} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fila-titulo">{t("inicio.tocaRepasar")}</div>
            <div className="fila-sub">
              {t(pend.vencidas === 1 ? "inicio.vencidas_1" : "inicio.vencidas_n", { n: pend.vencidas })}
              {pend.hoy > 0 && t("inicio.masHoy", { n: pend.hoy })}
            </div>
          </div>
          <span className="flecha"><IcDerecha size={15} /></span>
        </Link>
      )}

      <Link href="/examen" className="fila" style={{ marginBottom: 8, padding: "11px 14px" }}>
        <span className="disco"><IcExamen size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fila-titulo">{t("inicio.examen")}</div>
          <div className="fila-sub">{t("inicio.examenSub")}</div>
        </div>
        <span className="flecha"><IcDerecha size={15} /></span>
      </Link>

      <Link href="/rapido" className="fila" style={{ marginBottom: 12, padding: "11px 14px" }}>
        <span className="disco"><IcCronometro size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fila-titulo">{t("inicio.cincoMin")}</div>
          <div className="fila-sub">{t("inicio.cincoMinSub")}</div>
        </div>
        <span className="flecha"><IcDerecha size={15} /></span>
      </Link>

      <h2 className="enc-seccion">{t("inicio.niveles")}</h2>

      <div className="lista rejilla-niveles">
        {niveles.map((n) => (
          <Link key={n.id} href={`/n/${n.id}`} className="fila">
            <span className="numeral jp">{NUMERAL_NIVEL[n.id]}</span>
            <Anillo pct={avance[n.id] ?? 0} tono={COLOR_NIVEL[n.id]} texto={n.id} tam={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t(`nivel.${n.id}`)}</div>
              {/* Una sola línea: con el recuento de gramática envuelve y la lista
                  deja de caber en una pantalla de móvil. */}
              <div className="tenue" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t("inicio.resumenNivel", {
                  palabras: n.palabras.toLocaleString(), secciones: n.secciones,
                })}
              </div>
            </div>
            <span className="flecha"><IcDerecha size={14} /></span>
          </Link>
        ))}
      </div>

      {!accesoAbierto && (
        <p className="tenue" style={{ marginTop: 18 }}>
          {t("inicio.libre")}
        </p>
      )}
    </>
  );
}
