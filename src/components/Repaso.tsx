"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Nivel, Palabra } from "@/lib/tipos";
import { NIVELES } from "@/lib/tipos";
import {
  anotar, contarPendientes, cuandoToca, hechosHoy, leerProgreso, masFlojas,
  paraRepasar, prevision7dias, topeDiario, vivas, type Progreso,
} from "@/lib/progreso";
import { ConmutadoresJp, useAjustes } from "./Ajustes";
import { Avisos } from "./Avisos";
import { Jp, BotonVoz } from "./Jp";
import { Reportar } from "./Reportar";
import { IcBien, IcDerecha } from "./Iconos";
import { significado as sig, significadoSecundario as sigSec } from "@/lib/idioma";

/** Alto de la zona de barras de la previsión, en píxeles. */
const ALTO_GRAFICA = 56;

export function Repaso() {
  const [cargando, setCargando] = useState(true);
  const [todas, setTodas] = useState<Palabra[]>([]);
  const [flojas, setFlojas] = useState<{ palabra: Palabra; fallos: number }[]>([]);
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [empezado, setEmpezado] = useState(false);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [prog, setProg] = useState<Progreso | null>(null);
  const [proxima, setProxima] = useState("");
  const { significado, idioma, t } = useAjustes();

  useEffect(() => {
    const p = leerProgreso();
    setProg(p);
    const ids = paraRepasar(p).slice(0, 200);
    const debiles = masFlojas(p, 3);
    // Una sola petición para la cola y para «lo más flojo»: las flojas casi
    // siempre están ya en la cola, pero no tiene por qué ser así.
    const pedir = [...new Set([...ids, ...debiles.map((d) => d.id)])];

    if (!pedir.length) {
      const futuros = Object.values(p.palabras)
        .filter((m) => m.proximo && m.a + m.f > 0)
        .sort((a, b) => (a.proximo ?? 0) - (b.proximo ?? 0));
      setProxima(futuros[0] ? cuandoToca(futuros[0]) : "");
      setCargando(false);
      return;
    }
    fetch(`/api/palabras?ids=${pedir.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        const porId = new Map((d.palabras as Palabra[]).map((w) => [w.id, w]));
        // El API devuelve en su propio orden; recuperamos el de la cola.
        setTodas(ids.map((x) => porId.get(x)).filter(Boolean) as Palabra[]);
        setFlojas(debiles
          .map((x) => ({ palabra: porId.get(x.id)!, fallos: x.fallos }))
          .filter((x) => x.palabra));
      })
      .finally(() => setCargando(false));
  }, []);

  const tope = prog ? topeDiario(prog) : 40;
  const cola = useMemo(() => {
    const filtradas = nivel === "todos" ? todas : todas.filter((w) => w.jlpt === nivel);
    return filtradas.slice(0, tope);
  }, [todas, nivel, tope]);

  useEffect(() => { setI(0); setVisible(false); }, [nivel]);

  if (cargando) return <p className="silencio" style={{ marginTop: 48 }}>{t("com.cargando")}</p>;

  if (!todas.length) {
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <span className="jp" style={{ fontSize: 30, fontWeight: 500, color: "var(--acento)" }}>休</span>
        <p style={{ fontSize: 16 }}>{t("rep.nadaVencido")}</p>
        <p className="silencio">
          {proxima ? t("rep.proxima", { t: proxima }) : t("rep.sinNada")}
        </p>
        <Link className="btn primario" href="/">{t("rep.irAlCurso")}</Link>
      </div>
    );
  }

  const pend = prog ? contarPendientes(prog) : { vencidas: 0, hoy: 0 };
  const hechas = prog ? hechosHoy(prog) : 0;

  // ---------------------------------------------------------- portada
  if (!empezado) {
    const prevision = prog ? prevision7dias(prog) : [];
    const nombresDia = t("rep.dias").split(",");
    const alto = Math.max(1, ...prevision.map((d) => d.n));
    const pctVencidas = cola.length ? (Math.min(pend.vencidas, cola.length) / cola.length) * 100 : 0;

    return (
      <>
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 4px" }}>{t("rep.titulo")}</h1>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--tinta-2)" }}>
          {t("rep.hoyTocan", { n: cola.length, vivas: prog ? vivas(prog) : 0 })}
          {hechas > 0 && t("rep.yaLlevas", { n: hechas })}
        </p>

        <div className="tarjeta" style={{
          border: "1px solid var(--acento)", borderRadius: "var(--radio-lg)",
          background: "color-mix(in srgb, var(--acento) 8%, transparent)",
          position: "relative", overflow: "hidden", padding: 18,
        }}>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 200, height: 200,
            borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, color-mix(in srgb, var(--acento) 22%, transparent) 0%, transparent 70%)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            {/* La porción roja del aro son las que ya venían vencidas. */}
            <div className="anillo" style={{
              ["--tam" as string]: "74px",
              background: `conic-gradient(var(--rojo) 0 ${pctVencidas}%, var(--acento) ${pctVencidas}% 100%)`,
            }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: "var(--tinta)" }}>{cola.length}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 4 }}>{t("rep.tuCola")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--tinta-2)" }}>
                <i className="punto vencida" /> {t("rep.nVencidas", { n: pend.vencidas })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--tinta-2)" }}>
                <i className="punto dominada" /> {t("rep.nHoy", { n: pend.hoy })}
              </div>
            </div>
          </div>
          <button className="btn primario" style={{ width: "100%", marginTop: 16, minHeight: 46 }}
                  onClick={() => setEmpezado(true)}>
            {t(cola.length === 1 ? "rep.empezar_1" : "rep.empezar_n", { n: cola.length })}
          </button>
        </div>

        {/* Los niveles siguen filtrando la cola desde aquí. */}
        <div className="filtros" style={{ marginTop: 16 }}>
          <button className={`btn chico ${nivel === "todos" ? "encendido" : ""}`}
                  onClick={() => setNivel("todos")}>{t("rep.todos")}</button>
          {NIVELES.map((n) => {
            const cuantas = todas.filter((w) => w.jlpt === n).length;
            if (!cuantas) return null;
            return (
              <button key={n} className={`btn chico ${nivel === n ? "encendido" : ""}`}
                      onClick={() => setNivel(n)}>
                {n} · {cuantas}
              </button>
            );
          })}
        </div>

        <h2 className="enc-seccion" style={{ marginTop: 22 }}>{t("rep.sieteDias")}</h2>
        {/* La zona de barras tiene alto propio y las barras crecen dentro de
            ella. Antes la columna entera medía barra + dos rótulos y se salía
            por arriba del contenedor, encima del título. */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          {prevision.map((d, k) => (
            <div key={k} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
              <div style={{ height: ALTO_GRAFICA, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%",
                  height: Math.max(3, Math.round((d.n / alto) * ALTO_GRAFICA)),
                  borderRadius: 5,
                  background: k === 0 ? "var(--acento)" : k <= 3 ? "var(--acento-700)" : "var(--acento-800)",
                }} />
              </div>
              <div style={{ fontSize: 10, color: "var(--tinta-3)", marginTop: 5 }}>
                {k === 0 ? t("rep.hoy") : nombresDia[d.diaSemana]}
              </div>
              <div style={{ fontSize: 10, color: "var(--tinta-4)", minHeight: 13 }}>{d.n || ""}</div>
            </div>
          ))}
        </div>

        {flojas.length > 0 && (
          <>
            <h2 className="enc-seccion" style={{ marginTop: 22 }}>{t("rep.masFlojo")}</h2>
            <div className="lista-vocab">
              {flojas.map(({ palabra, fallos }) => (
                <div key={palabra.id}
                     style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px" }}>
                  <div style={{ width: 96, flex: "0 0 auto" }}>
                    <Jp escritura={palabra.escritura} lectura={palabra.lectura} clase="jp-medio" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{sig(palabra, idioma)}</div>
                  <span style={{ fontSize: 11.5, color: fallos >= 3 ? "var(--rojo)" : "var(--tinta-3)" }}>
                    {t(fallos === 1 ? "rep.fallos_1" : "rep.fallos_n", { n: fallos })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    );
  }

  // ---------------------------------------------------------- sesión
  if (i >= cola.length) {
    const quedan = todas.length - cola.length;
    return (
      <>
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <IcBien size={30} style={{ color: "var(--acento)" }} />
        <p style={{ fontSize: 16 }}>{t("rep.terminado", { n: cola.length })}</p>
        {quedan > 0 && (
          <p className="silencio">
            {t("rep.quedan", { n: quedan, tope })}
          </p>
        )}
        <Link className="btn primario" href="/">{t("com.volver")}</Link>
      </div>
      {/* El único momento decente para pedir el permiso de avisos: acaba de
          terminar un repaso, ya sabe para qué sirve, y el navegador sólo deja
          preguntar una vez en la vida. */}
      <Avisos />
      </>
    );
  }

  const p = cola[i];
  const responder = (acierto: boolean) => {
    anotar("palabras", p.id, acierto);
    setProg(leerProgreso());
    setVisible(false);
    setI(i + 1);
  };

  return (
    <>
      {/* Misma fila que la sesión de cinco minutos y que la cabecera de un
          test: progreso, interruptores y el contador. En una pantalla de
          estudio los interruptores van arriba, siempre en el mismo sitio. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 10px" }}>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(i / cola.length) * 100}%` }} />
        </div>
        <ConmutadoresJp conSignificado={false} />
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>
          {i + 1} / {cola.length}
        </span>
      </div>

      <div className="tarjeta" style={{ textAlign: "center", padding: "44px 20px", position: "relative", overflow: "hidden" }}>
        <div className="halo" />
        <div style={{ position: "relative" }}>
          <Jp escritura={p.escritura} lectura={p.lectura} tam="grande" revelar={visible} />
          <div style={{ marginTop: 6 }}><BotonVoz texto={p.escritura} /></div>

          {significado || visible ? (
            <>
              <p style={{ fontSize: 17, marginBottom: 2 }}>{sig(p, idioma)}</p>
              <p className="tenue" style={{ marginTop: 0 }}>
                {sigSec(p, idioma)}
                <Reportar tipo="vocabulario" ref_={p.id}
                          visto={`${p.escritura} — ${sig(p, idioma)}`} />
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
                <button className="btn" onClick={() => responder(false)}>{t("pra.noSabia")}</button>
                <button className="btn primario" onClick={() => responder(true)}>{t("pra.siSabia")}</button>
              </div>
            </>
          ) : (
            <button className="btn primario" style={{ marginTop: 22 }} onClick={() => setVisible(true)}>
              {t("pra.verSig")}
            </button>
          )}
        </div>
      </div>

      <Link href="/" className="btn fantasma" style={{ marginTop: 12 }}>
        {t("rep.dejarlo")} <IcDerecha size={14} />
      </Link>
    </>
  );
}
