"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Palabra } from "@/lib/tipos";
import { leerProgreso, paraRepasar, anotar, cuandoToca, contarPendientes } from "@/lib/progreso";
import { BotonesRapidos, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";

export function Repaso() {
  const [cargando, setCargando] = useState(true);
  const [cola, setCola] = useState<Palabra[]>([]);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const { significado } = useAjustes();

  const [proxima, setProxima] = useState<string>("");

  useEffect(() => {
    const p = leerProgreso();
    const ids = paraRepasar(p).slice(0, 60);
    if (!ids.length) {
      // Si no vence nada, decir cuándo vuelve a haber algo.
      const futuros = Object.values(p.palabras)
        .filter((m) => m.proximo && m.a + m.f > 0)
        .sort((a, b) => (a.proximo ?? 0) - (b.proximo ?? 0));
      setProxima(futuros[0] ? cuandoToca(futuros[0]) : "");
      setCargando(false);
      return;
    }
    fetch(`/api/palabras?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setCola(d.palabras as Palabra[]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="silencio" style={{ marginTop: 48 }}>Cargando…</p>;

  if (!cola.length) {
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

  if (i >= cola.length) {
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 34 }}>✓</div>
        <p style={{ fontSize: 17 }}>Repaso terminado: {cola.length} palabras.</p>
        <Link className="btn primario" href="/">Volver</Link>
      </div>
    );
  }

  const p = cola[i];
  const responder = (acierto: boolean) => {
    anotar("palabras", p.id, acierto);
    setVisible(false);
    setI(i + 1);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", margin: "36px 0 18px" }}>
        <div>
          <p className="etiqueta" style={{ margin: 0 }}>Repaso · vencidas</p>
          <p className="tenue" style={{ margin: 0 }}>{i + 1} / {cola.length}</p>
        </div>
        <div style={{ flex: 1 }} />
        <BotonesRapidos compacto />
      </div>

      <div className="tarjeta" style={{ textAlign: "center", padding: "44px 20px" }}>
        <Jp escritura={p.escritura} lectura={p.lectura} tam="grande" />
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
