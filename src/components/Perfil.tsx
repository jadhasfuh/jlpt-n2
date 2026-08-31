"use client";
import { useEffect, useState } from "react";
import { guardarTope, leerProgreso, resumen, topeDiario, type Progreso, type TopeRepaso } from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { ACCESO_ABIERTO } from "@/lib/acceso";
import type { Perfil as Cuenta } from "@/lib/sesion";
import { IcDerecha } from "./Iconos";
import Link from "next/link";

export function Perfil({ totalPalabras, cuenta, alDia }: {
  totalPalabras: number; cuenta: Cuenta | null; alDia: boolean;
}) {
  const [p, setP] = useState<Progreso | null>(null);
  const { tema, cambiarTema } = useAjustes();

  useEffect(() => {
    const f = () => setP(leerProgreso());
    f();
    window.addEventListener("progreso", f);
    return () => window.removeEventListener("progreso", f);
  }, []);

  if (!p) return <div className="tarjeta" style={{ marginTop: 20, height: 160 }} />;
  const r = resumen(p);
  const pct = Math.round((r.dominadas / totalPalabras) * 1000) / 10;

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 12px" }}>Tu avance</h1>

      <section className="tarjeta">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            [`${r.xp}`, "XP acumulado"],
            [`${r.racha}`, "días seguidos"],
            [`${r.dominadas}`, "palabras dominadas"],
            [`${r.vistas}`, "palabras vistas"],
            [`${r.unidades}`, "unidades practicadas"],
          ].map(([v, t]) => (
            <div key={t} style={{ minWidth: 92 }}>
              <div style={{ fontSize: 21, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div className="tenue">{t}</div>
            </div>
          ))}
        </div>
        <div className="barra" style={{ marginTop: 16 }}><i style={{ width: `${pct}%` }} /></div>
        <p className="tenue" style={{ marginBottom: 0 }}>
          {pct}% del vocabulario de los cinco niveles ({totalPalabras.toLocaleString("es")} palabras)
        </p>
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>Ajustes</h2>
      <section className="tarjeta" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <BotonesRapidos />
        <button className="btn" onClick={cambiarTema}>
          Tema: {tema === "auto" ? "automático" : tema}
        </button>
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>Repasos por día</h2>
      <section className="tarjeta">
        <p style={{ marginTop: 0 }}>
          Hoy te enseñará como máximo <strong>{topeDiario(p)}</strong> repasos.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["auto", 30, 60, 100, 9999] as TopeRepaso[]).map((t) => (
            <button key={String(t)}
                    className={`btn chico ${p.tope === t ? "encendido" : ""}`}
                    onClick={() => setP(guardarTope(t))}>
              {t === "auto" ? "Automático" : t === 9999 ? "Sin tope" : t}
            </button>
          ))}
        </div>
        <p className="tenue" style={{ marginBottom: 0 }}>
          En automático sale de tu propio ritmo de la última semana, con un suelo de 40.
          Así, si dejas la app unos días, no te encuentras un muro de trescientos repasos.
        </p>
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>Cuenta</h2>
      <section className="tarjeta">
        {cuenta ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{cuenta.nombre || "Tu cuenta"}</div>
                <div className="tenue">{cuenta.email}</div>
              </div>
              <span className={`pastilla ${alDia ? "acento" : ""}`}>
                {alDia ? "acceso completo" : "gratuita"}
              </span>
            </div>
            {alDia && cuenta.vence_en && (
              <p className="tenue" style={{ marginBottom: 0, marginTop: 10 }}>
                {cuenta.membresia === "cancelada"
                  ? `Cancelada; te dura hasta el ${fecha(cuenta.vence_en)}.`
                  : `Se renueva el ${fecha(cuenta.vence_en)}.`}
              </p>
            )}
            <form action="/auth/salir" method="post" style={{ marginTop: 14 }}>
              <button className="btn" style={{ width: "100%" }}>Salir de la cuenta</button>
            </form>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              Sin cuenta, tu avance se guarda sólo en este navegador
              {ACCESO_ABIERTO ? " y todo el contenido está abierto" : ""}. Si lo borras
              o cambias de aparato, se pierde.
            </p>
            <Link href="/entrar" className="btn primario" style={{ width: "100%" }}>
              Entrar o crear cuenta <IcDerecha size={15} />
            </Link>
          </>
        )}
      </section>

      <button className="btn" style={{ width: "100%", marginTop: 24 }}
              onClick={() => {
                if (confirm("¿Borrar todo tu avance en este dispositivo?")) {
                  localStorage.removeItem("jlpt.progreso");
                  location.reload();
                }
              }}>
        Borrar mi avance
      </button>
    </>
  );
}

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
