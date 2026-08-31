"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Palabra } from "@/lib/tipos";
import { anotar, estadoItem, leerProgreso, paraRepasar } from "@/lib/progreso";
import { BotonFurigana, useAjustes } from "./Ajustes";
import { Jp, BotonVoz } from "./Jp";
import { IcCerrar, IcCronometro, IcDerecha } from "./Iconos";

const MINUTOS = 5;

/**
 * Cinco minutos y para. La idea de Drops: bajar tanto la fricción que en un
 * día flojo abras la app igual. Tira de lo que vence; si no vence nada, de lo
 * que está a medio aprender.
 */
export function SesionRapida() {
  const { t } = useAjustes();
  const [cola, setCola] = useState<Palabra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [restante, setRestante] = useState(MINUTOS * 60);
  const [arrancado, setArrancado] = useState(false);
  const tic = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const p = leerProgreso();
    let ids = paraRepasar(p);
    if (ids.length < 10) {
      // Nada vencido: rellenamos con lo que está a medias, que es lo que más flaquea.
      const aMedias = Object.entries(p.palabras)
        .filter(([, m]) => estadoItem(m) === "aprendiendo")
        .map(([id]) => Number(id));
      ids = [...new Set([...ids, ...aMedias])];
    }
    if (!ids.length) { setCargando(false); return; }
    fetch(`/api/palabras?ids=${ids.slice(0, 120).join(",")}`)
      .then((r) => r.json())
      .then((d) => setCola(d.palabras as Palabra[]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!arrancado) return;
    tic.current = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => { if (tic.current) clearInterval(tic.current); };
  }, [arrancado]);

  const mm = String(Math.floor(restante / 60)).padStart(1, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const terminado = restante === 0 || i >= cola.length;

  if (cargando) return <p className="silencio" style={{ marginTop: 48 }}>{t("com.cargando")}</p>;

  if (!cola.length) {
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 34 }}>🌱</div>
        <p style={{ fontSize: 17 }}>{t("rap.nada")}</p>
        <p className="silencio">{t("rap.seLlena")}</p>
        <Link className="btn primario" href="/">{t("rep.irAlCurso")}</Link>
      </div>
    );
  }

  if (!arrancado) {
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <span className="disco" style={{ width: 56, height: 56 }}><IcCronometro size={24} /></span>
        <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{t("inicio.cincoMin")}</h1>
        <p className="silencio">
          Repaso corto con lo que tienes más flojo. Para solo cuando se acabe el tiempo.
        </p>
        <button className="btn primario" style={{ marginTop: 14 }} onClick={() => setArrancado(true)}>
          Empezar
        </button>
      </div>
    );
  }

  if (terminado) {
    const seg = MINUTOS * 60 - restante;
    return (
      <div className="tarjeta" style={{ marginTop: 48, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40 }}>{aciertos >= i * 0.8 ? "🎯" : "👌"}</div>
        <h2 style={{ margin: 0, fontSize: 26 }}>{aciertos} / {i}</h2>
        <p className="silencio" style={{ margin: 0 }}>
          en {Math.floor(seg / 60)}:{String(seg % 60).padStart(2, "0")}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <Link className="btn" href="/">Volver</Link>
          <Link className="btn primario" href="/repaso">{t("rap.seguir")}</Link>
        </div>
      </div>
    );
  }

  const p = cola[i];
  const responder = (acierto: boolean) => {
    anotar("palabras", p.id, acierto);
    if (acierto) setAciertos((a) => a + 1);
    setVisible(false);
    setI(i + 1);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 12px" }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {mm}:{ss}
        </span>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(restante / (MINUTOS * 60)) * 100}%` }} />
        </div>
        <BotonFurigana />
      </div>

      <div className="tarjeta" style={{ textAlign: "center", padding: "44px 20px" }}>
        <Jp escritura={p.escritura} lectura={p.lectura} tam="grande" revelar={visible} />
        <div style={{ marginTop: 6 }}><BotonVoz texto={p.escritura} /></div>
        {visible ? (
          <>
            <p style={{ fontSize: 17, marginBottom: 2 }}>{p.es || p.en}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <button className="btn" onClick={() => responder(false)}>No</button>
              <button className="btn primario" onClick={() => responder(true)}>Sí</button>
            </div>
          </>
        ) : (
          <button className="btn primario" style={{ marginTop: 22 }} onClick={() => setVisible(true)}>
            Ver
          </button>
        )}
      </div>
      <p className="tenue" style={{ textAlign: "center" }}>{aciertos} aciertos · {i} vistas</p>
    </>
  );
}
