"use client";
import { useEffect, useState } from "react";
import { NIVELES, type Nivel } from "@/lib/tipos";
import {
  armarReparto, cuantosItems, NOMBRE_SECCION, preguntasEn, SECCION_DE,
  type Ajuste, type Seccion, type TipoItem,
} from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { Examen } from "./Examen";
import { IcDerecha } from "./Iconos";
import Link from "next/link";

const SECCIONES: Seccion[] = ["moji_goi", "bunpou", "dokkai", "choukai"];
const MINUTOS = [5, 10, 15, 30] as const;
/** Tamaños redondos para elegir a mano cuando no hay reloj. */
const PREGUNTAS = [10, 20, 30, 45, 60] as const;

/** Elegir qué examen se quiere antes de empezar. */
export function ExamenAjustes({ nivelInicial = "N2", alDia = true }:
  { nivelInicial?: Nivel;
    /** Si la suscripción está al día. Sin ella se ofrece el test abierto, que
        es lo único entero que esta persona puede hacer sin pagar. */
    alDia?: boolean }) {
  const { idioma, t } = useAjustes();
  const [nivel, setNivel] = useState<Nivel>(nivelInicial);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [minutos, setMinutos] = useState<Ajuste["minutos"]>(10);
  const [correccion, setCorreccion] = useState<Ajuste["correccion"]>("al final");
  const [cronometro, setCronometro] = useState(true);
  const [preguntas, setPreguntas] = useState(20);
  const [inventario, setInventario] = useState<Record<string, Record<string, number>>>({});
  const [corriendo, setCorriendo] = useState(false);

  // Con reloj, el número de preguntas lo manda la duración: si cambias de
  // nivel o de secciones, lo que cabe en esos minutos cambia con ellas.
  useEffect(() => {
    if (cronometro) setPreguntas(preguntasEn({ nivel, secciones, minutos }));
  }, [cronometro, nivel, secciones, minutos]);

  useEffect(() => {
    fetch("/api/examen/inventario")
      .then((r) => r.json())
      .then((d) => setInventario(d.inventario ?? {}))
      .catch(() => {});
  }, []);

  const ajuste: Ajuste = { nivel, secciones, minutos, correccion, cronometro, preguntas };
  if (corriendo) return <Examen ajuste={ajuste} cerrar={() => setCorriendo(false)} />;

  // Elegir una duración rellena solo el número de preguntas: es lo que cabe
  // en ese tiempo al ritmo del examen real.
  const elegirMinutos = (m: Ajuste["minutos"]) => {
    setMinutos(m);
    setPreguntas(preguntasEn({ nivel, secciones, minutos: m }));
  };
  // Los tamaños redondos, más el que salga de la duración elegida, para que
  // el botón que se marca solo exista siempre.
  const bloques = [...new Set([...PREGUNTAS, preguntas])].sort((x, y) => x - y);

  const reparto = armarReparto(ajuste);
  const pedidas = cuantosItems(reparto);

  // Cuántas hay de verdad en el banco: pedir 45 de vocabulario cuando sólo hay
  // 27 escritas daría un examen más corto sin explicar por qué.
  const hay = inventario[nivel] ?? {};
  const disponibles = (Object.keys(reparto) as TipoItem[])
    .reduce((s, tipo) => s + Math.min(reparto[tipo] ?? 0, hay[tipo] ?? 0), 0);
  const enBanco = (Object.entries(hay) as [TipoItem, number][])
    .filter(([tipo]) => !secciones.length || secciones.includes(SECCION_DE[tipo]))
    .reduce((s, [, n]) => s + n, 0);

  const alternar = (s: Seccion) =>
    setSecciones((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: "26px 0 4px" }}>{t("ex.titulo")}</h1>
      <p className="entradilla" style={{ margin: "0 0 18px", fontSize: 13, color: "var(--tinta-2)" }}>
        {t("ex.sub")}
      </p>

      <h2 className="enc-seccion">{t("ex.nivel")}</h2>
      <div className="filtros" style={{ marginBottom: 18 }}>
        {NIVELES.map((n) => (
          <button key={n} className={`btn chico ${nivel === n ? "encendido" : ""}`}
                  onClick={() => setNivel(n)}>{n}</button>
        ))}
      </div>

      <h2 className="enc-seccion">{t("ex.queEntra")}</h2>
      <div className="filtros" style={{ marginBottom: 18 }}>
        <button className={`btn chico ${secciones.length === 0 ? "encendido" : ""}`}
                onClick={() => setSecciones([])}>{t("ex.todo")}</button>
        {SECCIONES.map((s) => (
          <button key={s} className={`btn chico ${secciones.includes(s) ? "encendido" : ""}`}
                  onClick={() => alternar(s)}>
            <span className="jp">{NOMBRE_SECCION[s].ja}</span>
            <span style={{ opacity: .7 }}>{NOMBRE_SECCION[s][idioma]}</span>
          </button>
        ))}
      </div>

      <h2 className="enc-seccion">{t("ex.reloj")}</h2>
      <div className="filtros" style={{ marginBottom: 6 }}>
        <button className={`btn chico ${cronometro ? "encendido" : ""}`}
                onClick={() => { setCronometro(true); elegirMinutos(minutos); }}>
          {t("ex.conReloj")}
        </button>
        <button className={`btn chico ${!cronometro ? "encendido" : ""}`}
                onClick={() => setCronometro(false)}>{t("ex.sinReloj")}</button>
      </div>
      <p className="tenue" style={{ marginTop: 0, marginBottom: 18 }}>
        {t(cronometro ? "ex.conRelojAyuda" : "ex.sinRelojAyuda")}
      </p>

      {/* La duración sólo pinta si hay reloj: sin él no significa nada. */}
      {cronometro && (
        <>
          <h2 className="enc-seccion">{t("ex.duracion")}</h2>
          <div className="filtros" style={{ marginBottom: 18 }}>
            {MINUTOS.map((m) => (
              <button key={m} className={`btn chico ${minutos === m ? "encendido" : ""}`}
                      onClick={() => elegirMinutos(m)}>{t("ex.min", { n: m })}</button>
            ))}
            <button className={`btn chico ${minutos === 105 ? "encendido" : ""}`}
                    onClick={() => elegirMinutos(105)}>{t("ex.completo")}</button>
          </div>
        </>
      )}

      <h2 className="enc-seccion">{t("ex.preguntas")}</h2>
      <div className="filtros" style={{ marginBottom: 6 }}>
        {bloques.map((n) => (
          <button key={n} className={`btn chico ${preguntas === n ? "encendido" : ""}`}
                  onClick={() => setPreguntas(n)}>{n}</button>
        ))}
      </div>
      <p className="tenue" style={{ marginTop: 0, marginBottom: 18 }}>
        {t("ex.preguntasAyuda")}
      </p>

      <h2 className="enc-seccion">{t("ex.correccion")}</h2>
      <div className="filtros" style={{ marginBottom: 6 }}>
        <button className={`btn chico ${correccion === "al momento" ? "encendido" : ""}`}
                onClick={() => setCorreccion("al momento")}>{t("ex.alMomento")}</button>
        <button className={`btn chico ${correccion === "al final" ? "encendido" : ""}`}
                onClick={() => setCorreccion("al final")}>{t("ex.alFinal")}</button>
      </div>
      <p className="tenue" style={{ marginTop: 0, marginBottom: 22 }}>
        {t(correccion === "al momento" ? "ex.alMomentoAyuda" : "ex.alFinalAyuda")}
      </p>

      <button className="btn primario" style={{ width: "100%", minHeight: 48 }}
              disabled={disponibles === 0} onClick={() => setCorriendo(true)}>
        {disponibles === 0
          ? t("ex.sinPreguntas")
          : <>{t(disponibles === 1 ? "ex.empezar_1" : "ex.empezar", { n: disponibles })} <IcDerecha size={15} /></>}
      </button>
      {disponibles > 0 && disponibles < pedidas && (
        <p className="tenue" style={{ marginTop: 8 }}>{t("ex.bancoCorto", { n: enBanco })}</p>
      )}
      {/* Sin suscripción, el botón de arriba acaba en el muro. Mejor decirlo
          antes y ofrecer lo que sí puede hacer entero. */}
      {!alDia && (
        <Link href={`/test/${nivel === "N4" ? "n4" : "n5"}`} className="btn fantasma"
              style={{ width: "100%", minHeight: 44, marginTop: 10 }}>
          {t("lib.enlaceMuro", { n: nivel === "N4" ? "N4" : "N5" })}
        </Link>
      )}
    </>
  );
}
