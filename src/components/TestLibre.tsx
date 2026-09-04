"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NOMBRE_TIPO, marcarHuecos, type Item } from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { JpEnLinea } from "./Jp";
import OPCIONES_ILUSTRADAS from "@/lib/opciones-ilustradas.json";
import { AyudaInstruccion } from "./AyudaInstruccion";
import { IcBien, IcCerrar, IcDerecha, IcReproducir } from "./Iconos";
import { callar, decirTramos } from "@/lib/voz";

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
  const { t, idioma, enApp } = useAjustes();
  const router = useRouter();
  const [empezado, setEmpezado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [envio, setEnvio] = useState<"no" | "yendo" | "hecho" | "saltado" | "fallo">("no");
  const [n, setN] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  // Cuál se ha oído ya, para que el botón diga «otra vez» y no mienta.
  const [sonado, setSonado] = useState<Record<string, boolean>>({});
  const [fin, setFin] = useState(false);

  const aciertos = useMemo(
    () => items.filter((it) => respuestas[it.id] === it.respuesta).length,
    [items, respuestas],
  );

  // Los hooks van antes de cualquier return, así que la pregunta actual se
  // resuelve aquí aunque la lista venga vacía.
  const actual = items[n] as Item | undefined;
  const reproducir = useCallback(() => {
    const g = actual?.guion;
    if (!g || !actual) return;
    setSonado((s) => ({ ...s, [actual.id]: true }));
    // La intro y la pregunta las dice el narrador; cada turno, su personaje.
    decirTramos([
      ...(g.intro ? [{ texto: g.intro }] : []),
      ...g.turnos.map((x) => ({ texto: x.texto, quien: x.quien })),
      ...(g.pregunta ? [{ texto: g.pregunta }] : []),
    ], { rate: 0.95 });
  }, [actual]);
  // Al salir de la pregunta o de la página, que no siga hablando sola.
  useEffect(() => callar, [n]);

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
        <p className="entradilla" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "var(--tinta-2)" }}>
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
            {t(enApp ? "app.soloCuenta" : "lib.invitacion")}
          </p>
          {!enApp && (
            <Link className="btn primario" href="/suscripcion"
                  style={{ width: "100%", minHeight: 46 }}>
              {t("lib.verPlanes")} <IcDerecha size={15} />
            </Link>
          )}
          <Link className="btn fantasma" href={`/n/${nivel}`}
                style={{ width: "100%", minHeight: 42, marginTop: 8 }}>
            {t("lib.verNivel", { n: nivel })}
          </Link>
        </div>

        {/* Publicar la nota va después de la invitación y antes de la
            corrección: es el momento en que se sabe el resultado y todavía no
            se ha empezado a leer nada. */}
        {envio !== "hecho" && envio !== "saltado" && (
          <div className="tarjeta" style={{ marginTop: 14, padding: 20 }}>
            <p style={{ margin: "0 0 4px", fontSize: 15 }}>{t("mar.apuntate")}</p>
            <p className="tenue" style={{ margin: "0 0 12px" }}>{t("mar.publico")}</p>
            <input
              value={nombre} onChange={(e) => setNombre(e.target.value)}
              maxLength={20} placeholder={t("mar.nombre")} aria-label={t("mar.nombre")}
              style={{
                width: "100%", padding: "11px 13px", fontSize: 15,
                borderRadius: "var(--radio)", border: "1px solid var(--linea)",
                background: "transparent", color: "var(--tinta)",
              }} />
            <button className="btn primario" style={{ width: "100%", minHeight: 44, marginTop: 10 }}
              disabled={!nombre.trim() || envio === "yendo"}
              onClick={async () => {
                setEnvio("yendo");
                try {
                  const r = await fetch("/api/test/marcador", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nivel, nombre, respuestas }),
                  });
                  if (!r.ok) throw new Error();
                  setEnvio("hecho");
                  // El marcador lo pinta el servidor, así que hay que pedirle
                  // que lo vuelva a leer para que la fila nueva aparezca.
                  router.refresh();
                } catch { setEnvio("fallo"); }
              }}>
              {envio === "yendo" ? t("mar.enviando") : t("mar.enviar")}
            </button>
            <button className="btn fantasma" style={{ width: "100%", minHeight: 40, marginTop: 6 }}
              onClick={() => setEnvio("saltado")}>
              {t("mar.saltar")}
            </button>
            {envio === "fallo" && (
              <p style={{ color: "var(--rojo)", fontSize: 13, marginBottom: 0 }}>{t("mar.fallo")}</p>
            )}
          </div>
        )}
        {envio === "hecho" && (
          <p style={{
            marginTop: 14, padding: "11px 14px", fontSize: 13.5, borderRadius: "var(--radio)",
            color: "var(--tinta-2)",
            background: "color-mix(in srgb, var(--acento) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--acento) 26%, transparent)",
          }}>{t("mar.hecho")}</p>
        )}

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
                <JpEnLinea html={marcarHuecos(it.enunciado)} />
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
  const conViñetas = !!item && (OPCIONES_ILUSTRADAS as string[]).includes(item.id);
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

      {/* Sólo AyudaInstruccion: ya pinta la instrucción y el botón «?».
          Antes se pintaba además con <JpEnLinea> justo encima y salía dos
          veces, en dos columnas —el <p> de dentro cerraba el de fuera. */}
      <div style={{ margin: "12px 0 0" }}>
        <AyudaInstruccion tipo={item.tipo} texto={item.instruccion_ja} />
      </div>

      {/* La de escucha no se lee: se oye. El guion lo dice la voz del sistema,
          con voz distinta para cada personaje. */}
      {item.guion && (
        <div style={{ textAlign: "center", margin: "18px 0 6px" }}>
          <button type="button" onClick={reproducir} aria-label={t("lib.escuchar")}
                  style={{
                    width: 92, height: 92, borderRadius: "50%", display: "grid", placeItems: "center",
                    border: "1px solid var(--acento)", color: "var(--acento)",
                    background: "color-mix(in srgb, var(--acento) 12%, transparent)",
                  }}>
            <IcReproducir size={32} weight="fill" />
          </button>
          <div className="tenue" style={{ marginTop: 6 }}>
            {sonado[item.id] ? t("lib.otraVez") : t("lib.escuchar")}
          </div>
          <p className="tenue" style={{ margin: "8px auto 0", maxWidth: 320 }}>
            {t("lib.escuchaNota")}
          </p>
        </div>
      )}

      <p style={{ margin: "14px 0 16px", fontSize: 18, lineHeight: 1.9 }}>
        <JpEnLinea html={marcarHuecos(item.enunciado)} />
      </p>

      {/* 発話表現: la instrucción manda mirar el dibujo de la flecha. */}
      {item.tipo === "hatsuwa" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/examen/escenas/${item.id}.webp`} alt="" className="escena-examen"
             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      )}

      {/* 課題理解 con viñetas: es la única pregunta de escucha de la muestra, y
          enseñarla con dibujos —como en el examen real— es lo que demuestra de
          qué va el producto. Sin esto salía como texto, igual que las demás. */}
      <div className={conViñetas ? "opciones-vinetas" : undefined}>
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
            {conViñetas ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/examen/opciones/${item.id}-${j + 1}.webp`} alt={o}
                   className="vineta-opcion" />
            ) : (
              <JpEnLinea html={o} />
            )}
          </button>
        );
      })}
      </div>

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
