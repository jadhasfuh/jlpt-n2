"use client";
import { useEffect, useState } from "react";
import { guardarTope, leerProgreso, resumen, topeDiario, type Progreso, type TopeRepaso } from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { ACCESO_ABIERTO } from "@/lib/acceso";

export function Perfil({ totalPalabras }: { totalPalabras: number }) {
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
      <h1 style={{ fontSize: 24, margin: "20px 0 12px" }}>Tu avance</h1>

      <section className="tarjeta">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            [`${r.xp}`, "XP acumulado"],
            [r.racha ? `${r.racha} 🔥` : "0", "días seguidos"],
            [`${r.dominadas}`, "palabras dominadas"],
            [`${r.vistas}`, "palabras vistas"],
            [`${r.unidades}`, "unidades practicadas"],
          ].map(([v, t]) => (
            <div key={t} style={{ minWidth: 92 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
              <div className="tenue">{t}</div>
            </div>
          ))}
        </div>
        <div className="barra" style={{ marginTop: 16 }}><i style={{ width: `${pct}%` }} /></div>
        <p className="tenue" style={{ marginBottom: 0 }}>
          {pct}% del vocabulario de los cinco niveles ({totalPalabras.toLocaleString("es")} palabras)
        </p>
      </section>

      <h2 style={{ fontSize: 17, margin: "24px 0 10px" }}>Ajustes</h2>
      <section className="tarjeta" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <BotonesRapidos />
        <button className="btn" onClick={cambiarTema}>
          Tema: {tema === "auto" ? "automático" : tema}
        </button>
      </section>

      <h2 style={{ fontSize: 17, margin: "24px 0 10px" }}>Repasos por día</h2>
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

      <h2 style={{ fontSize: 17, margin: "24px 0 10px" }}>Cuenta</h2>
      <section className="tarjeta">
        <p style={{ marginTop: 0 }}>
          Todavía no hay cuentas: tu avance se guarda en este dispositivo
          {ACCESO_ABIERTO ? " y todo el contenido está abierto" : ""}.
        </p>
        <p className="tenue" style={{ marginBottom: 0 }}>
          Cuando lleguen, servirán para sincronizar entre el móvil y el navegador. La
          sección 人と体 de cada nivel seguirá siendo libre sin registrarse.
        </p>
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
