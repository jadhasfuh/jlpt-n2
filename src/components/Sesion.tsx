"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Gramatica, Lectura, Nivel, Palabra } from "@/lib/tipos";
import { CATEGORIAS_GRAMATICA } from "@/lib/tipos";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, JpHtml, JpEnLinea, BotonVoz } from "./Jp";
import { anotar, completarNivel } from "@/lib/progreso";

type Props = {
  nivel: Nivel;
  palabras: Palabra[];
  gramatica: Gramatica[];
  siguiente: string | null;
};

export function Sesion({ nivel, palabras, gramatica, siguiente }: Props) {
  const pasos = useMemo(() => {
    const p: { clave: string; titulo: string }[] = [];
    if (gramatica.length) p.push({ clave: "gramatica", titulo: "文法 · Gramática" });
    p.push({ clave: "vocabulario", titulo: "語彙 · Vocabulario" });
    p.push({ clave: "quiz", titulo: "練習 · Práctica" });
    p.push({ clave: "lectura", titulo: "読解 · Lectura" });
    return p;
  }, [gramatica.length]);

  const [i, setI] = useState(0);
  const paso = pasos[i];
  const ultimo = i === pasos.length - 1;

  const avanzar = () => {
    if (ultimo) { completarNivel(nivel.id); return; }
    setI(i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, margin: "32px 0 0", flexWrap: "wrap" }}>
        <div>
          <p className="etiqueta" style={{ margin: 0 }}>Sesión {nivel.numero} · {paso.titulo}</p>
          <h1 className="jp" style={{ fontSize: 30, margin: "4px 0 2px" }}>{nivel.titulo_ja}</h1>
          <p className="silencio" style={{ margin: 0 }}>{nivel.titulo_es}</p>
        </div>
        <div style={{ flex: 1 }} />
        <BotonesRapidos />
      </div>

      <div className="pasos">
        {pasos.map((p, n) => <i key={p.clave} className={n <= i ? "hecho" : ""} />)}
      </div>

      {paso.clave === "gramatica" && <PasoGramatica items={gramatica} />}
      {paso.clave === "vocabulario" && <PasoVocabulario palabras={palabras} />}
      {paso.clave === "quiz" && <PasoQuiz palabras={palabras} />}
      {paso.clave === "lectura" && <PasoLectura nivel={nivel} />}

      <div style={{ display: "flex", gap: 10, marginTop: 32, alignItems: "center" }}>
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          Atrás
        </button>
        <div style={{ flex: 1 }} />
        {ultimo && siguiente ? (
          <Link className="btn primario" href={`/nivel/${siguiente}`} onClick={() => completarNivel(nivel.id)}>
            Terminar y seguir
          </Link>
        ) : ultimo ? (
          <Link className="btn primario" href="/" onClick={() => completarNivel(nivel.id)}>
            Terminar
          </Link>
        ) : (
          <button className="btn primario" onClick={avanzar}>Siguiente</button>
        )}
      </div>
    </>
  );
}

/* ---------------------------------- gramática --------------------------------- */

function PasoGramatica({ items }: { items: Gramatica[] }) {
  const { significado } = useAjustes();
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});

  return (
    <>
      {items.map((g) => {
        const visible = significado || abierto[g.id];
        return (
          <article key={g.id} className="tarjeta" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Jp escritura={g.forma} lectura={g.lectura} tam="medio" />
              <BotonVoz texto={g.forma} />
              <div style={{ flex: 1 }} />
              <span className="pastilla">{CATEGORIAS_GRAMATICA[g.cat] ?? g.cat}</span>
              <span className="tenue">nivel {g.tier}/4</span>
            </div>

            <div style={{ marginTop: 14 }}>
              {visible ? (
                <>
                  <p style={{ margin: "0 0 4px", fontSize: 16 }}>{g.es}</p>
                  <p className="tenue" style={{ margin: 0 }}>{g.en}</p>
                </>
              ) : (
                <button className="btn" onClick={() => setAbierto({ ...abierto, [g.id]: true })}>
                  Ver significado
                </button>
              )}
            </div>
          </article>
        );
      })}
      <p className="tenue">
        Consejo: intenta deducir el sentido por la forma antes de abrir el significado.
      </p>
    </>
  );
}

/* -------------------------------- vocabulario -------------------------------- */

function PasoVocabulario({ palabras }: { palabras: Palabra[] }) {
  const { significado } = useAjustes();
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});

  return (
    <div className="tarjeta" style={{ padding: "4px 20px" }}>
      <table className="tabla-vocab">
        <tbody>
          {palabras.map((p) => {
            const visible = significado || abierto[p.id];
            return (
              <tr key={p.id}>
                <td style={{ width: "42%" }}>
                  <Jp escritura={p.escritura} lectura={p.lectura} tam="medio" />
                </td>
                <td style={{ width: 46 }}>
                  <span className={`pastilla ${p.jlpt.toLowerCase()}`}>{p.jlpt}</span>
                </td>
                <td>
                  {visible ? (
                    <>
                      <div>{p.es || p.en}</div>
                      <div className="tenue">
                        {p.registro.length > 0 && <em>{p.registro.join(" · ")} — </em>}
                        {p.es && p.en ? p.en : null}
                      </div>
                    </>
                  ) : (
                    <button className="btn fantasma" style={{ paddingLeft: 0 }}
                            onClick={() => setAbierto({ ...abierto, [p.id]: true })}>
                      ver significado
                    </button>
                  )}
                </td>
                <td style={{ width: 44, textAlign: "right" }}>
                  <BotonVoz texto={p.escritura} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------- quiz ------------------------------------ */

function mezclar<T>(a: T[]): T[] {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function PasoQuiz({ palabras }: { palabras: Palabra[] }) {
  const preguntas = useMemo(() => {
    const utiles = palabras.filter((p) => (p.es || p.en).trim());
    return mezclar(utiles).map((correcta) => {
      const señuelos = mezclar(utiles.filter((o) => o.id !== correcta.id)).slice(0, 3);
      return { palabra: correcta, opciones: mezclar([correcta, ...señuelos]) };
    });
  }, [palabras]);

  const [n, setN] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);

  if (!preguntas.length) return <p className="silencio">No hay palabras con definición en esta sesión.</p>;

  if (n >= preguntas.length) {
    return (
      <div className="tarjeta" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40 }}>{aciertos === preguntas.length ? "🎌" : "✓"}</div>
        <p style={{ fontSize: 18, marginBottom: 4 }}>
          {aciertos} de {preguntas.length}
        </p>
        <p className="silencio" style={{ margin: 0 }}>
          Las que fallaste vuelven a salirte en el repaso.
        </p>
      </div>
    );
  }

  const q = preguntas[n];
  const responder = (op: Palabra) => {
    if (elegida !== null) return;
    setElegida(op.id);
    const bien = op.id === q.palabra.id;
    if (bien) setAciertos((a) => a + 1);
    anotar("palabras", q.palabra.id, bien);
    setTimeout(() => { setElegida(null); setN((v) => v + 1); }, bien ? 550 : 1400);
  };

  return (
    <div className="tarjeta">
      <div className="tenue">{n + 1} / {preguntas.length}</div>
      <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
        <Jp escritura={q.palabra.escritura} lectura={q.palabra.lectura} tam="grande" />
      </div>
      <div className="rejilla dos">
        {q.opciones.map((op) => {
          const esta = elegida === op.id;
          const correcta = op.id === q.palabra.id;
          const color = elegida === null ? undefined
            : correcta ? "var(--verde-suave)" : esta ? "var(--acento-suave)" : undefined;
          return (
            <button key={op.id} className="btn"
                    style={{ textAlign: "left", padding: "12px 14px", background: color, borderRadius: 10 }}
                    onClick={() => responder(op)}>
              {op.es || op.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- lectura ---------------------------------- */

/** Para la voz: quita el marcado y también la lectura, que si no se oye doble. */
const quitarRuby = (html: string) =>
  html.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");

function PasoLectura({ nivel }: { nivel: Nivel }) {
  const [traducir, setTraducir] = useState(false);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/lectura/${nivel.id}`)
      .then((r) => r.json())
      .then((d) => { if (vivo) setLectura(d.lectura as Lectura | null); })
      .catch(() => {})
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [nivel.id]);

  if (cargando) return <div className="tarjeta" style={{ height: 150 }} />;

  if (!lectura) {
    return (
      <div className="tarjeta">
        <p style={{ marginTop: 0 }}>
          La lectura de esta sesión todavía no está generada.
        </p>
        <p className="tenue" style={{ marginBottom: 0 }}>
          Se generan por lotes con <code>npm run lecturas</code>: cada texto usa
          únicamente el vocabulario y la gramática de las sesiones 1–{nivel.numero},
          y queda guardado en la base.
        </p>
      </div>
    );
  }

  return (
    <>
      <article className="tarjeta">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 22, margin: 0 }}><JpEnLinea html={lectura.titulo} /></h2>
          <BotonVoz texto={quitarRuby(lectura.cuerpo)} />
        </div>
        <JpHtml html={lectura.cuerpo} clase="jp-medio" />
        <button className="btn" onClick={() => setTraducir(!traducir)} style={{ marginTop: 12 }}>
          {traducir ? "Ocultar" : "Ver"} traducción
        </button>
        {traducir && <p className="silencio" style={{ marginBottom: 0 }}>{lectura.traduccion}</p>}
      </article>

      {lectura.preguntas?.length ? <PreguntasLectura preguntas={lectura.preguntas} /> : null}
    </>
  );
}

function PreguntasLectura({ preguntas }: { preguntas: NonNullable<Lectura["preguntas"]> }) {
  const [resp, setResp] = useState<Record<number, number>>({});
  return (
    <div className="tarjeta" style={{ marginTop: 14 }}>
      <p className="etiqueta">Comprensión</p>
      {preguntas.map((q, i) => (
        <div key={i} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 18 }}><JpEnLinea html={q.p} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {q.opciones.map((o, j) => {
              const dada = resp[i];
              const color = dada === undefined ? undefined
                : j === q.correcta ? "var(--verde-suave)"
                : dada === j ? "var(--acento-suave)" : undefined;
              return (
                <button key={j} className="btn"
                        style={{ textAlign: "left", background: color, borderRadius: 10 }}
                        onClick={() => setResp({ ...resp, [i]: j })}>
                  <JpEnLinea html={o} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
