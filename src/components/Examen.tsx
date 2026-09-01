"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NOMBRE_SECCION, NOMBRE_TIPO, SECCION_DE,
  type Ajuste, type Item, type Seccion,
} from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { JpEnLinea } from "./Jp";
import { AyudaInstruccion } from "./AyudaInstruccion";
import { MuroDePago } from "./MuroDePago";
import { callar, decir } from "@/lib/voz";
import { IcBien, IcCerrar, IcDerecha, IcReproducir } from "./Iconos";

const LETRAS = ["1", "2", "3", "4"];
const CLAVE_VISTOS = "jlpt.examen.vistos";

/** Los tres bloques que puntúa el JLPT: 60 puntos cada uno, 180 en total. */
const BLOQUES: { id: string; secciones: Seccion[] }[] = [
  { id: "lengua", secciones: ["moji_goi", "bunpou"] },
  { id: "lectura", secciones: ["dokkai"] },
  { id: "escucha", secciones: ["choukai"] },
];

const leerVistos = (): string[] => {
  try { return JSON.parse(localStorage.getItem(CLAVE_VISTOS) || "[]"); } catch { return []; }
};
const anotarVistos = (ids: string[]) => {
  try {
    const previos = leerVistos().filter((x) => !ids.includes(x));
    // Los más recientes delante; se guardan 800, de sobra para que la rotación
    // no repita nada mientras el banco no sea enorme.
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify([...ids, ...previos].slice(0, 800)));
  } catch { /* modo privado: sin rotación, pero el examen funciona */ }
};

const reloj = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export function Examen({ ajuste, cerrar }: { ajuste: Ajuste; cerrar: () => void }) {
  const { idioma, t } = useAjustes();
  const [items, setItems] = useState<Item[] | null>(null);
  const [n, setN] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [revelada, setRevelada] = useState(false);
  const [fin, setFin] = useState<null | "tiempo" | "terminado">(null);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [queda, setQueda] = useState(ajuste.minutos * 60);
  const pedido = useRef(false);
  const enviado = useRef(false);

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    fetch("/api/examen", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ajuste, vistos: leerVistos() }),
    })
      .then(async (r) => {
        // 402 es «hace falta suscripción», no «no hay preguntas». Sin
        // distinguirlos, quien no ha entrado ve un banco vacío y cree que la
        // app no tiene contenido, que es justo lo contrario de lo que pasa.
        if (r.status === 402) { setSinAcceso(true); setItems([]); return; }
        const d = await r.json();
        const lista = (d.items ?? []) as Item[];
        setItems(lista);
        anotarVistos(lista.map((x) => x.id));
      })
      .catch(() => setItems([]));
  }, [ajuste]);

  useEffect(() => () => { callar(); }, []);

  // Al terminar, mandar lo contestado. Con cuenta se guarda y la rotación
  // sigue funcionando en otro aparato; sin cuenta el servidor responde 204 y
  // aquí no cambia nada. Se hace una sola vez, aunque el examen se re-pinte.
  useEffect(() => {
    if (!fin || !items || enviado.current) return;
    enviado.current = true;
    const lineas = items
      .filter((x) => respuestas[x.id] !== undefined)
      .map((x) => ({ item_id: x.id, acierto: respuestas[x.id] === x.respuesta }));
    if (!lineas.length) return;
    fetch("/api/examen/resultados", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineas }),
    }).catch(() => { /* que no se pierda el examen por no poder guardarlo */ });
  }, [fin, items, respuestas]);

  useEffect(() => {
    if (fin || !items) return;
    const id = setInterval(() => {
      setQueda((s) => {
        if (s <= 1) { clearInterval(id); setFin("tiempo"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [fin, items]);

  const item = items?.[n];

  // El texto largo vive en el primer ítem de su grupo; los siguientes lo heredan.
  const pasaje = useMemo(() => {
    if (!items || !item) return null;
    const g = (item as Item & { grupo?: string }).grupo;
    if (!g) return item.pasaje ?? null;
    return items.find((x) => (x as Item & { grupo?: string }).grupo === g && x.pasaje)?.pasaje ?? null;
  }, [items, item]);

  const guion = useMemo(() => {
    if (!items || !item) return null;
    const g = (item as Item & { grupo?: string }).grupo;
    if (!g) return item.guion ?? null;
    return items.find((x) => (x as Item & { grupo?: string }).grupo === g && x.guion)?.guion ?? null;
  }, [items, item]);

  const reproducir = useCallback(() => {
    if (!guion) return;
    const texto = [guion.intro, ...guion.turnos.map((x) => x.texto), guion.pregunta]
      .filter(Boolean).join("。");
    decir(texto, { rate: 0.95 });
  }, [guion]);

  // La escucha suena sola al entrar, como en el examen de verdad.
  useEffect(() => {
    if (guion && !revelada) reproducir();
    return () => callar();
  }, [guion, n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items) {
    return (
      <div className="escena">
        <div className="escena-centro"><p className="silencio">{t("ex.preparando")}</p></div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="escena">
        <div className="escena-cabeza">
          <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
        </div>
        <div className="escena-centro">
          {sinAcceso ? (
            <MuroDePago que="examen" cerrar={cerrar} />
          ) : (
            <p>{t("ex.sinPreguntas")}</p>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- resultado
  if (fin) {
    const aciertos = items.filter((x) => respuestas[x.id] === x.respuesta).length;
    const bloques = BLOQUES.map((b) => {
      const suyos = items.filter((x) => b.secciones.includes(SECCION_DE[x.tipo]));
      const bien = suyos.filter((x) => respuestas[x.id] === x.respuesta).length;
      return { ...b, n: suyos.length, bien };
    }).filter((b) => b.n > 0);

    // Escala del JLPT: 60 puntos por bloque, sólo sobre los bloques que entraron.
    const tope = bloques.length * 60;
    const puntos = Math.round(bloques.reduce((s, b) => s + (b.bien / b.n) * 60, 0));

    return (
      <div className="escena" style={{ overflowY: "auto" }}>
        <div className="escena-cabeza">
          <button className="icono-btn" onClick={cerrar} aria-label={t("com.cerrar")}><IcCerrar size={16} /></button>
          <div className="crecer" />
          {fin === "tiempo" && <span className="pastilla">{t("ex.seAcabo")}</span>}
        </div>

        <div style={{ textAlign: "center", padding: "10px 0 18px", position: "relative" }}>
          <div className="halo" />
          <span className="etiqueta">{t("ex.resultado")}</span>
          <h2 style={{ margin: "4px 0 0", fontSize: 38, fontWeight: 500 }}>{puntos}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--tinta-2)" }}>
            {t("ex.puntos", { n: puntos, total: tope })} · {t("ex.aciertos", { a: aciertos, n: items.length })}
          </p>
        </div>

        <h2 className="enc-seccion">{t("ex.porSeccion")}</h2>
        <div className="lista-vocab" style={{ marginBottom: 14 }}>
          {bloques.map((b) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px" }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                {b.secciones.map((s) => NOMBRE_SECCION[s][idioma]).join(" · ")}
              </div>
              <div className="barra" style={{ width: 90 }}>
                <i style={{ width: `${(b.bien / b.n) * 100}%` }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--tinta-3)", fontVariantNumeric: "tabular-nums" }}>
                {b.bien}/{b.n}
              </span>
            </div>
          ))}
        </div>
        <p className="tenue" style={{ marginBottom: 18 }}>{t("ex.notaEscala")}</p>

        <h2 className="enc-seccion">{t("ex.repasar")}</h2>
        <div style={{ display: "grid", gap: 8, paddingBottom: 20 }}>
          {items.map((x, i) => {
            const tuya = respuestas[x.id];
            const bien = tuya === x.respuesta;
            return (
              <div key={x.id} className="tarjeta" style={{
                borderColor: bien ? "var(--linea)" : "var(--rojo)",
                background: bien ? undefined : "color-mix(in srgb, var(--rojo) 6%, transparent)",
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}>
                  <span className="etiqueta">{i + 1}</span>
                  <span className="pastilla"><span className="jp">{NOMBRE_TIPO[x.tipo].ja}</span></span>
                  {bien
                    ? <IcBien size={14} style={{ color: "var(--acento)" }} />
                    : <span style={{ fontSize: 11, color: "var(--rojo)" }}>
                        {tuya === undefined ? t("ex.sinResponder") : t("test.tuRespuesta")}
                      </span>}
                </div>
                <div className="jp" style={{ fontSize: 15, marginBottom: 6 }}>
                  <JpEnLinea html={x.enunciado} />
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "var(--acento)" }}>{LETRAS[x.respuesta]}. </span>
                  <span className="jp">{x.opciones[x.respuesta]}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--tinta-2)" }}>
                  {x.explicacion[idioma]}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, paddingBottom: 12 }}>
          <button className="btn" style={{ flex: 1 }} onClick={cerrar}>{t("ex.otroExamen")}</button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- haciendo
  if (!item) return null;
  const elegida = respuestas[item.id];
  const mostrando = ajuste.correccion === "al momento" && revelada;

  const responder = (i: number) => {
    if (mostrando) return;
    setRespuestas((r) => ({ ...r, [item.id]: i }));
    if (ajuste.correccion === "al momento") setRevelada(true);
  };

  const siguiente = () => {
    callar();
    setRevelada(false);
    if (n + 1 >= items.length) setFin("terminado"); else setN(n + 1);
  };

  return (
    <div className="escena">
      <div className="escena-cabeza">
        <button className="icono-btn"
                onClick={() => { if (confirm(t("ex.abandonar"))) { callar(); cerrar(); } }}
                aria-label={t("com.cerrar")}>
          <IcCerrar size={16} />
        </button>
        <div className="barra" style={{ flex: 1 }}>
          <i style={{ width: `${(n / items.length) * 100}%` }} />
        </div>
        <span className="tenue" style={{ fontVariantNumeric: "tabular-nums" }}>
          {n + 1}/{items.length}
        </span>
        <span className="pastilla" style={{ color: queda <= 30 ? "var(--rojo)" : undefined,
                                            borderColor: queda <= 30 ? "var(--rojo)" : undefined }}>
          {reloj(queda)}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "10px 0 8px" }}>
          <span className="pastilla"><span className="jp">{NOMBRE_TIPO[item.tipo].ja}</span></span>
          <span className="tenue">{NOMBRE_TIPO[item.tipo][idioma]}</span>
        </div>

        <AyudaInstruccion tipo={item.tipo} texto={item.instruccion_ja} />

        {pasaje && (
          <div className="tarjeta" style={{ marginBottom: 12 }}>
            <div className="jp" style={{ fontSize: 14.5, lineHeight: 2, whiteSpace: "pre-wrap" }}>
              {pasaje.texto}
            </div>
            {pasaje.notas && pasaje.notas.length > 0 && (
              <div style={{ marginTop: 10, borderTop: "1px solid var(--linea)", paddingTop: 8 }}>
                {pasaje.notas.map((nt, i) => (
                  <div key={i} className="tenue">
                    （注{i + 1}）<span className="jp">{nt.termino}</span>：<span className="jp">{nt.glosa}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {guion && (
          <div style={{ textAlign: "center", margin: "6px 0 14px" }}>
            <button onClick={reproducir} aria-label={t("ex.escuchar")}
                    style={{
                      width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center",
                      border: "1px solid var(--acento)", color: "var(--acento)",
                      background: "color-mix(in srgb, var(--acento) 12%, transparent)",
                    }}>
              <IcReproducir size={30} weight="fill" />
            </button>
            <div className="tenue" style={{ marginTop: 6 }}>{t("ex.escuchar")}</div>
          </div>
        )}

        <div className="jp" style={{ fontSize: 16, lineHeight: 1.9, marginBottom: 12 }}>
          <JpEnLinea html={item.enunciado} />
        </div>

        <div className="opciones">
          {item.opciones.map((op, i) => {
            const correcta = i === item.respuesta;
            const clase = !mostrando ? (elegida === i ? "bien" : "")
                        : correcta ? "bien" : elegida === i ? "mal" : "";
            return (
              <button key={i} className={`opcion ${clase}`} onClick={() => responder(i)}>
                <span className="casilla">
                  {mostrando && correcta ? <IcBien size={12} weight="bold" />
                   : mostrando && elegida === i ? <IcCerrar size={12} weight="bold" />
                   : LETRAS[i]}
                </span>
                <span className="jp">{op}</span>
              </button>
            );
          })}
        </div>

        {mostrando && (
          <div className="explica" style={{ margin: "14px auto 0" }}>
            <div className="etiqueta" style={{ marginBottom: 4 }}>{t("ex.porQue")}</div>
            <div style={{ fontSize: 13 }}>{item.explicacion[idioma]}</div>
            {item.puntos && item.puntos.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--tinta-3)" }}>
                {item.puntos.map((p, i) => <li key={i} className="jp">{p}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      <button className="btn primario" style={{ width: "100%", minHeight: 46 }}
              onClick={siguiente}>
        {n + 1 >= items.length ? t("ex.terminar")
         : elegida === undefined ? t("ex.saltar") : t("com.siguiente")}
        <IcDerecha size={15} />
      </button>
    </div>
  );
}
