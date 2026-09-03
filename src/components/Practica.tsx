"use client";
import { useMemo, useState } from "react";
import type { Gramatica, Palabra, Unidad } from "@/lib/tipos";
import { Jp, JpEnLinea, BotonVoz } from "./Jp";
import { ConmutadoresJp } from "./Ajustes";
import { anotar, terminarPractica, XP_NUEVA, XP_UNIDAD } from "@/lib/progreso";
import { ejemploDe, useFrases } from "@/lib/frases";
import { IcBien, IcCerrar, IcRepaso } from "./Iconos";
import { useAjustes } from "./Ajustes";
import { significado as sig, significadoSecundario as sigSec } from "@/lib/idioma";

type Carta =
  | { tipo: "palabra"; id: number; frente: string; lectura: string; reverso: string; extra: string }
  | { tipo: "gramatica"; id: string; frente: string; lectura: string; reverso: string; extra: string };

/** Práctica: tarjetas con autoevaluación. Entra vocabulario y, si la unidad la
 *  trae, también la gramática — que es donde de verdad se afianza. */
export function Practica({ unidad, palabras, gramatica, cerrar }: {
  unidad: Unidad; palabras: Palabra[]; gramatica: Gramatica[]; cerrar: () => void;
}) {
  const { idioma, t } = useAjustes();
  const cartas = useMemo<Carta[]>(() => [
    ...palabras.map((p) => ({
      tipo: "palabra" as const, id: p.id, frente: p.escritura, lectura: p.lectura,
      reverso: sig(p, idioma), extra: sigSec(p, idioma),
    })),
    ...gramatica.map((g) => ({
      tipo: "gramatica" as const, id: g.id, frente: g.forma, lectura: g.lectura,
      reverso: sig(g, idioma), extra: sigSec(g, idioma),
    })),
  ], [palabras, gramatica, idioma]);

  const frases = useFrases(unidad.id, idioma);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const [ganado, setGanado] = useState(0);
  // Lo que fallas vuelve a salir antes de terminar: es lo que más fija.
  const [cola, setCola] = useState<Carta[]>([]);
  const [segundaVuelta, setSegundaVuelta] = useState(false);
  const [marcas, setMarcas] = useState<Record<number, boolean>>({});

  const mazo = segundaVuelta ? cola : cartas;

  // Al acabar la primera pasada, si quedaron fallos se repasan.
  if (!segundaVuelta && i >= cartas.length && cola.length > 0) {
    return (
      <div className="escena">
        <div className="escena-cabeza">
          <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        </div>
        <div className="escena-centro">
          <span className="disco" style={{ width: 56, height: 56 }}><IcRepaso size={24} /></span>
          <h2 style={{ margin: 0, fontSize: 19 }}>{t("pra.porAfianzar", { n: cola.length })}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
            {t("pra.vuelvenAhora")}
          </p>
          <button className="btn primario" style={{ marginTop: 12 }}
                  onClick={() => { setSegundaVuelta(true); setI(0); setVisible(false); }}>
            {t("pra.repasarlas")}
          </button>
        </div>
      </div>
    );
  }

  if (i >= mazo.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza">
          <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        </div>
        <div className="escena-centro">
          <div className="halo" />
          <span className="jp" style={{ fontSize: 40, fontWeight: 500 }}>語彙</span>
          <h2 style={{ margin: 0, fontSize: 19 }}>{t("pra.terminada")}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
            {t("pra.resumen", { n: cartas.length, xp: ganado + XP_UNIDAD })}
            {cola.length > 0 && t("pra.paraProxima", { n: cola.length })}
          </p>
          <button className="btn primario" style={{ marginTop: 12 }}
                  onClick={() => { terminarPractica(unidad.id); cerrar(); }}>
            {t("pra.volverUnidad")}
          </button>
        </div>
      </div>
    );
  }

  const c = mazo[i];
  const ejemplo = c.tipo === "palabra" ? ejemploDe(frases, c.frente) : null;

  const responder = (acierto: boolean) => {
    anotar(c.tipo === "palabra" ? "palabras" : "gramatica", c.id, acierto);
    setMarcas((m) => ({ ...m, [i]: acierto }));
    if (acierto) {
      setGanado((g) => g + XP_NUEVA);
      if (segundaVuelta) setCola((q) => q.filter((x) => x.id !== c.id));
    } else if (!segundaVuelta && !cola.some((x) => x.id === c.id)) {
      setCola((q) => [...q, c]);
    }
    setVisible(false);
    setI(i + 1);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        {/* Una barrita por tarjeta: se ve de un vistazo cuántas has fallado. */}
        <div className="segmentos">
          {mazo.map((_, n) => (
            <i key={n} className={marcas[n] === true ? "bien" : marcas[n] === false ? "mal" : ""} />
          ))}
        </div>
        <ConmutadoresJp />
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>
          {i + 1}/{mazo.length}
        </span>
      </div>

      <div className="escena-centro">
        <div className="halo" />
        <span className={`pastilla ${c.tipo === "gramatica" ? "acento" : unidad.nivel.toLowerCase()}`}>
          <span className="jp">{c.tipo === "gramatica" ? "文法" : "語彙"}</span> · {unidad.nivel}
        </span>
        <Jp escritura={c.frente} lectura={c.lectura} clase="jp-grande" revelar={visible} />
        <BotonVoz texto={c.frente} />
        {visible && (
          <>
            <p style={{ fontSize: 19, margin: "6px 0 0" }}>{c.reverso}</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-3)" }}>{c.extra}</p>
            {ejemplo && (
              // La frase sale de la lectura de esta misma unidad, así que no
              // trae kanji ni gramática por encima de su nivel.
              <div style={{
                border: "1px solid var(--linea)", borderRadius: 10, padding: "10px 12px",
                marginTop: 8, textAlign: "left", maxWidth: 460,
              }}>
                <JpEnLinea html={ejemplo.html} />
                {ejemplo.es && (
                  <div style={{ fontSize: 11.5, color: "var(--tinta-3)", marginTop: 4 }}>{ejemplo.es}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="opciones" style={{ margin: "0 auto", flexDirection: "row" }}>
        {visible ? (
          <>
            <button className="btn" style={{ flex: 1, padding: 13 }} onClick={() => responder(false)}>
              <IcCerrar size={15} /> {t("pra.noSabia")}
            </button>
            <button className="btn primario" style={{ flex: 1, padding: 13 }} onClick={() => responder(true)}>
              <IcBien size={15} /> {t("pra.siSabia")}
            </button>
          </>
        ) : (
          <button className="btn primario" style={{ flex: 1, padding: 13 }} onClick={() => setVisible(true)}>
            {t("pra.verSig")}
          </button>
        )}
      </div>
      <p className="tenue" style={{ textAlign: "center", margin: "8px 0 0", fontSize: 10.5 }}>
        {t("pra.vuelven")}
      </p>
    </div>
  );
}
