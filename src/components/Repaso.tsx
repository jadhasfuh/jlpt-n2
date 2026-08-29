"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Nivel, Palabra } from "@/lib/tipos";
import { NIVELES } from "@/lib/tipos";
import {
  anotar, contarPendientes, cuandoToca, hechosHoy, leerProgreso,
  paraRepasar, topeDiario, type Progreso,
} from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";

export function Repaso() {
  const [cargando, setCargando] = useState(true);
  const [todas, setTodas] = useState<Palabra[]>([]);
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [prog, setProg] = useState<Progreso | null>(null);
  const [proxima, setProxima] = useState("");
  const { significado } = useAjustes();

  useEffect(() => {
    const p = leerProgreso();
    setProg(p);
    const ids = paraRepasar(p).slice(0, 200);
    if (!ids.length) {
      const futuros = Object.values(p.palabras)
        .filter((m) => m.proximo && m.a + m.f > 0)
        .sort((a, b) => (a.proximo ?? 0) - (b.proximo ?? 0));
      setProxima(futuros[0] ? cuandoToca(futuros[0]) : "");
      setCargando(false);
      return;
    }
    fetch(`/api/palabras?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        // El API devuelve en su propio orden; recuperamos el de la cola.
        const porId = new Map((d.palabras as Palabra[]).map((w) => [w.id, w]));
        setTodas(ids.map((x) => porId.get(x)).filter(Boolean) as Palabra[]);
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
        <div style={{ fontSize: 34 }}>🍵</div>
        <p style={{ fontSize: 17 }}>Nada vencido ahora mismo.</p>
        <p className="silencio">
          {proxima
            ? `La próxima palabra vuelve en ${proxima}. Cada acierto la manda más lejos.`
            : "Haz una sesión y las palabras irán entrando aquí solas."}
        </p>
        <Link className="btn primario" href="/">Ir al curso</Link>
      </div>
    );
  }

  const atrasadas = prog ? contarPendientes(prog).vencidas : 0;
  const hechas = prog ? hechosHoy(prog) : 0;

  if (i >= cola.length) {
    const quedan = todas.length - cola.length;
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 34 }}>✓</div>
        <p style={{ fontSize: 17 }}>Repaso del día terminado: {cola.length} palabras.</p>
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
      <div style={{ margin: "28px 0 10px" }}>
        <p className="etiqueta" style={{ margin: 0 }}>Repaso · vencidas</p>
        <p className="tenue" style={{ margin: 0 }}>
          {i + 1} / {cola.length}
          {atrasadas > cola.length && ` · ${atrasadas} en total`}
          {hechas > 0 && ` · ${hechas} hoy`}
        </p>
      </div>

      {/* Una sola fila que se desliza: antes los botones se apretaban unos
          contra otros y el texto acababa en vertical. */}
      <div className="tira">
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
        <span style={{ width: 1, background: "var(--linea)", flex: "0 0 1px", margin: "0 2px" }} />
        <BotonesRapidos compacto />
      </div>

      <div className="tarjeta" style={{ textAlign: "center", padding: "44px 20px" }}>
        <Jp escritura={p.escritura} lectura={p.lectura} tam="grande" revelar={visible} />
        <div style={{ marginTop: 6 }}><BotonVoz texto={p.escritura} /></div>

        {significado || visible ? (
          <>
            <p style={{ fontSize: 17, marginBottom: 2 }}>{p.es || p.en}</p>
            <p className="tenue" style={{ marginTop: 0 }}>{p.en}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
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
    </>
  );
}
