"use client";
import { useEffect, useState } from "react";
import { guardarTope, leerProgreso, resumen, topeDiario, type Progreso, type TopeRepaso } from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Avisos } from "./Avisos";
import type { Perfil as Cuenta } from "@/lib/sesion";
import { IcDerecha } from "./Iconos";
import Link from "next/link";
import { SelectorIdioma } from "./SelectorIdioma";

export function Perfil({ totalPalabras, cuenta, alDia }: {
  totalPalabras: number; cuenta: Cuenta | null; alDia: boolean;
}) {
  const [borrando, setBorrando] = useState(false);
  const [borrandoAvance, setBorrandoAvance] = useState(false);
  const [p, setP] = useState<Progreso | null>(null);
  const { tema, cambiarTema, idioma, t, accesoAbierto, enApp } = useAjustes();

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
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 12px" }}>{t("per.tuAvance")}</h1>

      <section className="tarjeta">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            [`${r.xp}`, t("per.xpAcum")],
            [`${r.racha}`, t("per.diasSeguidos")],
            [`${r.dominadas}`, t("per.palDominadas")],
            [`${r.vistas}`, t("per.palVistas")],
            [`${r.unidades}`, t("per.uniPracticadas")],
          ].map(([v, t]) => (
            <div key={t} style={{ minWidth: 92 }}>
              <div style={{ fontSize: 21, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div className="tenue">{t}</div>
            </div>
          ))}
        </div>
        <div className="barra" style={{ marginTop: 16 }}><i style={{ width: `${pct}%` }} /></div>
        <p className="tenue" style={{ marginBottom: 0 }}>
          {t("per.pctVocab", { pct, total: totalPalabras.toLocaleString() })}
        </p>
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>{t("per.ajustes")}</h2>
      <section className="tarjeta" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <BotonesRapidos />
        <button className="btn" onClick={cambiarTema}>
          {t("com.tema", { v: t(tema === "claro" ? "tema.claro" : tema === "oscuro" ? "tema.oscuro" : "tema.auto") })}
        </button>
      </section>

      {/* Los avisos van justo debajo de los ajustes de pantalla: es un ajuste
          más, no una campaña. Si el navegador no los soporta, no se pinta. */}
      <Avisos />

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>{t("per.idioma")}</h2>
      <section className="tarjeta">
        <SelectorIdioma />
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>{t("per.repasosDia")}</h2>
      <section className="tarjeta">
        <p style={{ marginTop: 0 }}>
          {t("per.topeHoy", { n: topeDiario(p) })}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["auto", 30, 60, 100, 9999] as TopeRepaso[]).map((v) => (
            <button key={String(v)}
                    className={`btn chico ${p.tope === v ? "encendido" : ""}`}
                    onClick={() => setP(guardarTope(v))}>
              {v === "auto" ? t("per.automatico") : v === 9999 ? t("per.sinTope") : v}
            </button>
          ))}
        </div>
        <p className="tenue" style={{ marginBottom: 0 }}>
          {t("per.topeAuto")}
        </p>
      </section>

      <h2 className="enc-seccion" style={{ marginTop: 24 }}>{t("per.cuenta")}</h2>
      <section className="tarjeta">
        {cuenta ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{cuenta.nombre || t("per.tuCuenta")}</div>
                <div className="tenue">{cuenta.email}</div>
              </div>
              <span className={`pastilla ${alDia ? "acento" : ""}`}>
                {alDia ? t("per.accesoCompleto") : t("per.gratuita")}
              </span>
            </div>
            {alDia && cuenta.vence_en && (
              <p className="tenue" style={{ marginBottom: 0, marginTop: 10 }}>
                {t(cuenta.membresia === "cancelada" ? "per.cancelada" : "per.renueva",
                    { fecha: fecha(cuenta.vence_en, idioma) })}
              </p>
            )}
            {/* En la app de Play, ni enlace ni botón: su política de pagos
                prohíbe llevar a pagar fuera de su facturación, y aquí se cobra
                en la web. Se dice dónde se gestiona, sin nombrar precios. */}
            {enApp ? (
              <p className="tenue" style={{ marginTop: 14, marginBottom: 0 }}>
                {t("app.gestionFuera")}
              </p>
            ) : (
              <Link href="/suscripcion" className="btn primario"
                    style={{ width: "100%", marginTop: 14 }}>
                {alDia ? t("sus.gestionar") : t("sus.suscribirse")} <IcDerecha size={15} />
              </Link>
            )}
            {/* Al salir hay que borrar la copia LOCAL del avance.
                Antes no se borraba, y eso daba dos problemas: quien cogiera
                el aparato después veía el avance de otro sin sesión ninguna,
                y —peor— al entrar la siguiente cuenta, adoptarCuenta() funde
                lo que hay en el navegador con lo suyo de la nube, así que se
                quedaba con los XP, la racha y las medallas del anterior.
                La copia de la nube no se toca: vuelve entera al volver a
                entrar, y sincronizar() corre en cada guardado, así que no
                queda nada sin subir. */}
            <form action="/auth/salir" method="post" style={{ marginTop: 8 }}
                  onSubmit={() => {
                    try {
                      localStorage.removeItem("jlpt.progreso");
                      localStorage.removeItem("jlpt.examen.vistos");
                    } catch { /* navegador sin almacenamiento */ }
                  }}>
              <button className="btn" style={{ width: "100%" }}>{t("per.salir")}</button>
              <p className="tenue" style={{ marginTop: 8, marginBottom: 0 }}>
                {t("per.salirAviso")}
              </p>
            </form>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              {t("per.sinCuenta", { abierto: accesoAbierto ? t("per.todoAbierto") : "" })}
            </p>
            <Link href="/entrar" className="btn primario" style={{ width: "100%" }}>
              {t("per.entrar")} <IcDerecha size={15} />
            </Link>
          </>
        )}
      </section>

      {/* Con sesión hay dos copias del avance, la del aparato y la de la nube.
          Borrar sólo la primera hacía que volviera entera al sincronizar. */}
      <button className="btn" style={{ width: "100%", marginTop: 24 }}
              disabled={borrandoAvance}
              onClick={async () => {
                if (!confirm(t(cuenta ? "per.borrarConfCuenta" : "per.borrarConf"))) return;
                if (cuenta) {
                  setBorrandoAvance(true);
                  const r = await fetch("/api/cuenta/progreso", { method: "POST" });
                  if (!r.ok) { setBorrandoAvance(false); return alert(t("sus.errorPortal")); }
                }
                localStorage.removeItem("jlpt.progreso");
                location.reload();
              }}>
        {borrandoAvance ? t("per.borrando") : t("per.borrar")}
      </button>

      {cuenta && (
        <button className="btn fantasma" style={{ width: "100%", marginTop: 8, color: "var(--rojo)" }}
                disabled={borrando}
                onClick={async () => {
                  if (!confirm(t("per.borrarAviso"))) return;
                  setBorrando(true);
                  const r = await fetch("/api/cuenta/borrar", { method: "POST" });
                  if (!r.ok) { setBorrando(false); return alert(t("sus.errorPortal")); }
                  localStorage.removeItem("jlpt.progreso");
                  location.href = "/";
                }}>
          {borrando ? t("per.borrando") : t("per.borrarCuenta")}
        </button>
      )}

      {/* Quien quiere un reembolso viene aquí, no a las páginas legales. Que
          encuentre a quién escribir sin tener que buscarlo. */}
      <section style={{ marginTop: 26 }}>
        <h2 className="enc-seccion">{t("per.ayuda")}</h2>
        <p className="tenue" style={{ marginTop: 0, marginBottom: 8 }}>{t("per.ayudaSub")}</p>
        <a href="mailto:adriancar75@hotmail.com" className="btn fantasma chico">
          adriancar75@hotmail.com
        </a>
      </section>

      <div className="filtros" style={{ justifyContent: "center", margin: "22px 0 8px" }}>
        <Link href="/legal/terminos" className="btn fantasma chico">{t("per.terminos")}</Link>
        <Link href="/legal/privacidad" className="btn fantasma chico">{t("per.privacidad")}</Link>
        <Link href="/legal/reembolsos" className="btn fantasma chico">{t("per.reembolsos")}</Link>
      </div>
    </>
  );
}

const fecha = (iso: string, idioma: string) =>
  new Date(iso).toLocaleDateString(idioma, { day: "numeric", month: "long", year: "numeric" });
