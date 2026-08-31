"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Nivel, Palabra } from "@/lib/tipos";
import { NIVELES } from "@/lib/tipos";
import {
  anotar, contarPendientes, cuandoToca, hechosHoy, leerProgreso, masFlojas,
  paraRepasar, prevision7dias, topeDiario, vivas, type Progreso,
} from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";
import { IcBien, IcDerecha } from "./Iconos";

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
  const { significado } = useAjustes();

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

  if (cargando) return <p className="silencio" style={{ marginTop: 48 }}>Cargando…</p>;

  if (!todas.length) {
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <span className="jp" style={{ fontSize: 30, fontWeight: 500, color: "var(--acento)" }}>休</span>
        <p style={{ fontSize: 16 }}>Nada vencido ahora mismo.</p>
        <p className="silencio">
          {proxima
            ? `La próxima palabra vuelve en ${proxima}. Cada acierto la manda más lejos.`
            : "Haz una sesión y las palabras irán entrando aquí solas."}
        </p>
        <Link className="btn primario" href="/">Ir al curso</Link>
      </div>
    );
  }

  const pend = prog ? contarPendientes(prog) : { vencidas: 0, hoy: 0 };
  const hechas = prog ? hechosHoy(prog) : 0;

  // ---------------------------------------------------------- portada
  if (!empezado) {
    const prevision = prog ? prevision7dias(prog) : [];
    const alto = Math.max(1, ...prevision.map((d) => d.n));
    const pctVencidas = cola.length ? (Math.min(pend.vencidas, cola.length) / cola.length) * 100 : 0;

    return (
      <>
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 4px" }}>Repaso</h1>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--tinta-2)" }}>
          Hoy te tocan {cola.length} de las {prog ? vivas(prog) : 0} que llevas vivas.
          {hechas > 0 && ` Ya llevas ${hechas} hechas.`}
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
              <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 4 }}>Tu cola de hoy</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--tinta-2)" }}>
                <i className="punto vencida" /> {pend.vencidas} vencidas
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--tinta-2)" }}>
                <i className="punto dominada" /> {pend.hoy} tocan hoy
              </div>
            </div>
          </div>
          <button className="btn primario" style={{ width: "100%", marginTop: 16, minHeight: 46 }}
                  onClick={() => setEmpezado(true)}>
            Empezar · {cola.length} {cola.length === 1 ? "tarjeta" : "tarjetas"}
          </button>
        </div>

        {/* Los niveles siguen filtrando la cola desde aquí. */}
        <div className="filtros" style={{ marginTop: 16 }}>
          <button className={`btn chico ${nivel === "todos" ? "encendido" : ""}`}
                  onClick={() => setNivel("todos")}>Todos</button>
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

        <h2 className="enc-seccion" style={{ marginTop: 22 }}>Próximos siete días</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 76 }}>
          {prevision.map((d, k) => (
            <div key={d.dia + k} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: Math.max(4, (d.n / alto) * 54), borderRadius: 5,
                background: k === 0 ? "var(--acento)" : k <= 3 ? "var(--acento-700)" : "var(--acento-800)",
              }} />
              <div style={{ fontSize: 10, color: "var(--tinta-3)", marginTop: 5 }}>{d.dia}</div>
              <div style={{ fontSize: 10, color: "var(--tinta-4)" }}>{d.n || ""}</div>
            </div>
          ))}
        </div>

        {flojas.length > 0 && (
          <>
            <h2 className="enc-seccion" style={{ marginTop: 22 }}>Lo más flojo</h2>
            <div className="lista-vocab">
              {flojas.map(({ palabra, fallos }) => (
                <div key={palabra.id}
                     style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px" }}>
                  <div style={{ width: 96, flex: "0 0 auto" }}>
                    <Jp escritura={palabra.escritura} lectura={palabra.lectura} clase="jp-medio" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>{palabra.es || palabra.en}</div>
                  <span style={{ fontSize: 11.5, color: fallos >= 3 ? "var(--rojo)" : "var(--tinta-3)" }}>
                    {fallos} {fallos === 1 ? "fallo" : "fallos"}
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
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <IcBien size={30} style={{ color: "var(--acento)" }} />
        <p style={{ fontSize: 16 }}>Repaso del día terminado: {cola.length} palabras.</p>
        {quedan > 0 && (
          <p className="silencio">
            Quedan {quedan} vencidas para mañana. El tope de hoy era {tope}, calculado
            sobre tu ritmo de la última semana.
          </p>
        )}
        <Link className="btn primario" href="/">Volver</Link>
      </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 10px" }}>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(i / cola.length) * 100}%` }} />
        </div>
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>
          {i + 1} / {cola.length}
        </span>
      </div>

      <div className="filtros" style={{ marginBottom: 14 }}>
        <BotonesRapidos compacto />
      </div>

      <div className="tarjeta" style={{ textAlign: "center", padding: "44px 20px", position: "relative", overflow: "hidden" }}>
        <div className="halo" />
        <div style={{ position: "relative" }}>
          <Jp escritura={p.escritura} lectura={p.lectura} tam="grande" revelar={visible} />
          <div style={{ marginTop: 6 }}><BotonVoz texto={p.escritura} /></div>

          {significado || visible ? (
            <>
              <p style={{ fontSize: 17, marginBottom: 2 }}>{p.es || p.en}</p>
              <p className="tenue" style={{ marginTop: 0 }}>{p.en}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
                <button className="btn" onClick={() => responder(false)}>No la sabía</button>
                <button className="btn primario" onClick={() => responder(true)}>La sabía</button>
              </div>
            </>
          ) : (
            <button className="btn primario" style={{ marginTop: 22 }} onClick={() => setVisible(true)}>
              Ver significado
            </button>
          )}
        </div>
      </div>

      <Link href="/" className="btn fantasma" style={{ marginTop: 12 }}>
        Dejarlo por hoy <IcDerecha size={14} />
      </Link>
    </>
  );
}
