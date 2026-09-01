"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { NOMBRE_TIPO, type Item } from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { JpEnLinea } from "./Jp";
import { AyudaInstruccion } from "./AyudaInstruccion";
import { IcBien, IcCerrar, IcDerecha } from "./Iconos";

const LETRAS = ["1", "2", "3", "4"];

/** El corte de aprobado del JLPT real está en el sesenta por ciento. */
const APRUEBA = 0.6;

/**
 * El test de prueba, sin cuenta y sin reloj.
 *
 * Sin reloj a propósito: quien llega de un buscador viene a medirse, no a
 * ensayar el examen. Un cronómetro en la primera pantalla que ve de nosotros
 * sólo consigue que se vaya.
 *
 * La corrección va al final y de golpe, con la explicación de cada pregunta.
 * Esa explicación es lo que distingue esto de un cuestionario cualquiera, así
 * que se enseña entera, también en las que se han acertado.
 */
export function TestLibre({ nivel, items }: { nivel: string; items: Item[] }) {
  const { t, idioma } = useAjustes();
  const [empezado, setEmpezado] = useState(false);
  const [n, setN] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [fin, setFin] = useState(false);

  const aciertos = useMemo(
    () => items.filter((it) => respuestas[it.id] === it.respuesta).length,
    [items, respuestas],
  );

  if (!items.length) {
    return <p className="tenue" style={{ marginTop: 30 }}>{t("lib.vacio")}</p>;
  }

  // ------------------------------------------------------------ portada
  if (!empezado) {
    return (
      <>
        <span className="pastilla acento" style={{ marginTop: 26 }}>{t("lib.gratis")}</span>
        <h1 style={{ fontSize: 27, fontWeight: 600, margin: "12px 0 6px", lineHeight: 1.25 }}>
          {t("lib.titulo", { n: nivel })}
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "var(--tinta-2)", maxWidth: "48ch" }}>
          {t("lib.entradilla", { c: String(items.length), n: nivel })}
        </p>
        <div className="tarjeta" style={{ marginTop: 22, padding: 20 }}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.95, color: "var(--tinta-2)" }}>
            <li>{t("lib.b1", { c: String(items.length) })}</li>
            <li>{t("lib.b2")}</li>
            <li>{t("lib.b3")}</li>
          </ul>
        </div>
        <button className="btn primario" style={{ width: "100%", minHeight: 50, marginTop: 16 }}
                onClick={() => setEmpezado(true)}>
          {t("lib.empezar")} <IcDerecha size={15} />
        </button>
        <p className="tenue" style={{ marginTop: 10, textAlign: "center" }}>{t("lib.sinCuenta")}</p>
      </>
    );
  }

  // ---------------------------------------------------------- resultado
  if (fin) {
    const pct = Math.round((aciertos / items.length) * 100);
    const bien = pct >= APRUEBA * 100;
    return (
      <>
        <div className="tarjeta" style={{ marginTop: 26, padding: 24, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>{t("lib.tuResultado")}</p>
          <p style={{
            margin: "6px 0 2px", fontSize: 46, fontWeight: 700, lineHeight: 1,
            color: bien ? "var(--acento)" : "var(--tinta)",
          }}>
            {pct}%
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--tinta-2)" }}>
            {t("lib.deTantas", { a: String(aciertos), c: String(items.length) })}
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.7 }}>
            {t(bien ? "lib.vasBien" : "lib.aunNo", { n: nivel })}
          </p>
        </div>

        {/* La invitación va aquí, con el resultado todavía en pantalla, que es
            cuando alguien sabe qué le falta. Debajo, la corrección entera. */}
        <div className="tarjeta" style={{ marginTop: 14, padding: 20 }}>
          <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.7 }}>
            {t("lib.invitacion")}
          </p>
          <Link className="btn primario" href="/suscripcion"
                style={{ width: "100%", minHeight: 46 }}>
            {t("lib.verPlanes")} <IcDerecha size={15} />
          </Link>
          <Link className="btn fantasma" href={`/n/${nivel}`}
                style={{ width: "100%", minHeight: 42, marginTop: 8 }}>
            {t("lib.verNivel", { n: nivel })}
          </Link>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "28px 0 10px" }}>{t("lib.correccion")}</h2>
        {items.map((it, i) => {
          const mia = respuestas[it.id];
          const ok = mia === it.respuesta;
          return (
            <div key={it.id} className="tarjeta" style={{ padding: 18, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className={`pastilla ${ok ? "acento" : ""}`} style={{ fontSize: 11 }}>
                  {ok ? <IcBien size={12} /> : <IcCerrar size={12} />} {i + 1}
                </span>
                <span className="tenue" style={{ fontSize: 12 }}>
                  {NOMBRE_TIPO[it.tipo]?.[idioma] ?? it.tipo}
                </span>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 15.5, lineHeight: 1.8 }}>
                <JpEnLinea html={it.enunciado} />
              </p>
              {it.opciones.map((o, j) => {
                const correcta = j === it.respuesta;
                const suya = j === mia;
                return (
                  <p key={j} style={{
                    margin: "0 0 4px", fontSize: 14, display: "flex", gap: 7, alignItems: "baseline",
                    color: correcta ? "var(--acento)" : suya ? "var(--rojo)" : "var(--tinta-2)",
                    fontWeight: correcta || suya ? 500 : 400,
                  }}>
                    <span style={{ opacity: 0.7 }}>{LETRAS[j]}</span>
                    <JpEnLinea html={o} />
                    {suya && !correcta && <span style={{ fontSize: 12 }}>{t("lib.tuya")}</span>}
                  </p>
                );
              })}
              <p style={{
                margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.7, color: "var(--tinta-2)",
                paddingTop: 10, borderTop: "1px solid var(--linea)",
              }}>
                {it.explicacion?.[idioma] ?? it.explicacion?.es}
              </p>
            </div>
          );
        })}
      </>
    );
  }

  // ----------------------------------------------------------- pregunta
  const item = items[n];
  const elegida = respuestas[item.id];
  const ultima = n === items.length - 1;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 4px" }}>
        <span className="tenue" style={{ fontSize: 13 }}>{n + 1} / {items.length}</span>
        <div style={{ flex: 1, height: 4, borderRadius: 3, background: "var(--pista)" }}>
          <div style={{
            width: `${((n + 1) / items.length) * 100}%`, height: "100%", borderRadius: 3,
            background: "var(--acento)", transition: "width .2s",
          }} />
        </div>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--tinta-2)",
                  display: "flex", alignItems: "center", gap: 6 }}>
        <JpEnLinea html={item.instruccion_ja} />
        <AyudaInstruccion tipo={item.tipo} texto={item.instruccion_ja} />
      </p>

      <p style={{ margin: "14px 0 16px", fontSize: 18, lineHeight: 1.9 }}>
        <JpEnLinea html={item.enunciado} />
      </p>

      {item.opciones.map((o, j) => {
        const act = elegida === j;
        return (
          <button key={j} type="button"
            onClick={() => setRespuestas((r) => ({ ...r, [item.id]: j }))}
            style={{
              width: "100%", textAlign: "left", marginBottom: 8, padding: "13px 15px",
              borderRadius: "var(--radio)", cursor: "pointer", fontSize: 15.5,
              display: "flex", gap: 10, alignItems: "baseline",
              color: "var(--tinta)",
              background: act ? "color-mix(in srgb, var(--acento) 13%, transparent)" : "transparent",
              border: `1px solid ${act
                ? "color-mix(in srgb, var(--acento) 48%, transparent)" : "var(--linea)"}`,
            }}>
            <span style={{ opacity: 0.6, fontSize: 13 }}>{LETRAS[j]}</span>
            <JpEnLinea html={o} />
          </button>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {n > 0 && (
          <button className="btn fantasma" style={{ minHeight: 46 }} onClick={() => setN(n - 1)}>
            {t("lib.atras")}
          </button>
        )}
        <button className="btn primario" style={{ flex: 1, minHeight: 46 }}
          disabled={elegida === undefined}
          onClick={() => (ultima ? setFin(true) : setN(n + 1))}>
          {ultima ? t("lib.corregir") : t("lib.siguiente")} <IcDerecha size={15} />
        </button>
      </div>
      {/* Se puede saltar sin responder, pero contando lo que eso implica. */}
      {elegida === undefined && (
        <p className="tenue" style={{ marginTop: 10, textAlign: "center" }}>{t("lib.elige")}</p>
      )}
    </>
  );
}
