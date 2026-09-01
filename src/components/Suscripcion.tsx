"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAjustes } from "./Ajustes";
import { IcBien, IcCurso, IcDerecha, IcExamen, IcRepaso } from "./Iconos";

/** «auto» sigue lo que tenga puesto el sistema, igual que el resto de la app. */
function temaDePaddle(tema: "auto" | "claro" | "oscuro"): "light" | "dark" {
  if (tema === "claro") return "light";
  if (tema === "oscuro") return "dark";
  return typeof window !== "undefined"
      && window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light" : "dark";
}

type Paddle = {
  Environment: { set: (e: string) => void };
  Initialize: (o: { token: string; eventCallback?: (e: { name?: string }) => void }) => void;
  Checkout: { open: (o: unknown) => void };
};
declare global { interface Window { Paddle?: Paddle } }

/**
 * Suscribirse y gestionar la suscripción.
 *
 * El pago ocurre aquí, en la web, y nunca dentro de la app de las tiendas.
 * La ventana de Paddle se abre encima; al terminar no redirige sola porque el
 * webhook tarda un par de segundos en llegar: se recarga cuando Paddle avisa
 * de que la compra se completó.
 */
type Tarifa = { texto: string; intervalo: string | null; porMes?: string;
                ahorro?: number; doceMeses?: string };

const NIVELES = ["N5", "N4", "N3", "N2", "N1"] as const;

/** Cada ventaja con su icono: una lista de puntos no dice nada de un vistazo. */
const VENTAJAS = [
  { k: "sus.p1", Ic: IcCurso },
  { k: "sus.p2", Ic: IcExamen },
  { k: "sus.p3", Ic: IcRepaso },
  { k: "sus.p4", Ic: IcBien },
] as const;

export function Suscripcion({ ajustes, cuenta, tarifa }: {
  ajustes: { token: string; precio: string; precioAnual: string;
             entorno: string; listo: boolean };
  cuenta: { correo: string | null; id: string; alDia: boolean; membresia: string;
            vence: string | null; tienePago: boolean; cortesia?: string | null } | null;
  tarifa: { mensual: Tarifa | null; anual: Tarifa | null };
}) {
  const { t, idioma, tema } = useAjustes();
  // El anual sale marcado cuando existe: es el que conviene a los dos, y así
  // el descuento se ve sin tener que buscarlo.
  const hayAnual = Boolean(tarifa.anual && ajustes.precioAnual);
  const [plan, setPlan] = useState<"mes" | "ano">(hayAnual ? "ano" : "mes");
  const elegida = plan === "ano" && hayAnual ? tarifa.anual! : tarifa.mensual;
  const [cargado, setCargado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const arrancado = useRef(false);

  useEffect(() => {
    if (!ajustes.listo || !cuenta || arrancado.current) return;
    arrancado.current = true;
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.onload = () => {
      const P = window.Paddle;
      if (!P) return;
      if (ajustes.entorno !== "production") P.Environment.set("sandbox");
      P.Initialize({
        token: ajustes.token,
        eventCallback: (e) => {
          // Al completarse, el webhook ya viene en camino; recargar hace que la
          // página vuelva a leer la membresía del servidor.
          if (e?.name === "checkout.completed") setTimeout(() => location.reload(), 2500);
        },
      });
      setCargado(true);
    };
    s.onerror = () => setError(t("sus.errorCarga"));
    document.head.appendChild(s);
  }, [ajustes, cuenta, t]);

  const suscribirse = () => {
    if (!window.Paddle || !cuenta) return;
    window.Paddle.Checkout.open({
      items: [{ priceId: plan === "ano" && hayAnual ? ajustes.precioAnual : ajustes.precio,
                quantity: 1 }],
      ...(cuenta.correo ? { customer: { email: cuenta.correo } } : {}),
      // El id del perfil viaja con la compra: es lo que ata el pago a la cuenta
      // cuando el webhook llega, sin depender de que el correo coincida.
      customData: { perfil: cuenta.id },
      settings: {
        displayMode: "overlay",
        // El checkout tenía el idioma y el tema fijos: alguien estudiando en
        // inglés con la app en claro veía una ventana de pago en español y
        // negra. Justo en el paso donde cualquier cosa que desentone hace
        // dudar de si estás en el sitio correcto.
        locale: idioma,
        theme: temaDePaddle(tema),
      },
    });
  };

  const abrirPortal = async (cual: "cancelar" | "general") => {
    setOcupado(true); setError("");
    try {
      const r = await fetch("/api/pago/portal", { method: "POST" });
      const d = await r.json();
      const destino = cual === "cancelar" ? (d.cancelar ?? d.general) : d.general;
      if (!destino) throw new Error("sin enlace");
      location.href = destino;
    } catch {
      setError(t("sus.errorPortal"));
      setOcupado(false);
    }
  };

  // ------------------------------------------------------ ya está suscrito
  if (cuenta?.alDia) {
    const cancelada = cuenta.membresia === "cancelada";
    // Una cuenta regalada no tiene cobro detrás. Decirlo evita que alguien
    // busque una suscripción que no existe, o se asuste pensando que le van a
    // cobrar; y que se lleve una sorpresa el día que se acabe.
    const regalo = cuenta.cortesia && new Date(cuenta.cortesia) > new Date()
                 ? cuenta.cortesia : null;
    if (regalo) {
      return (
        <>
          <div className="tarjeta" style={{ marginTop: 26, padding: 22 }}>
            <span className="pastilla acento"><IcBien size={13} /> {t("sus.cortesia")}</span>
            <p style={{ fontSize: 15, margin: "12px 0 2px" }}>{t("sus.cortesiaTxt")}</p>
            <p className="tenue" style={{ marginTop: 0 }}>
              {t("sus.cortesiaFin", { f: new Date(regalo).toLocaleDateString() })}
            </p>
          </div>
          <Politicas t={t} />
        </>
      );
    }
    return (
      <>
        <div className="tarjeta" style={{ marginTop: 26, padding: 22 }}>
          <span className="pastilla acento">
            <IcBien size={13} /> {cancelada ? t("sus.cancelada") : t("sus.activa")}
          </span>
          <p style={{ fontSize: 15, margin: "12px 0 2px" }}>{t("sus.gracias")}</p>
          {cuenta.vence && (
            <p className="tenue" style={{ marginTop: 0 }}>
              {t(cancelada ? "sus.valeHasta" : "sus.renuevaEl",
                 { f: new Date(cuenta.vence).toLocaleDateString() })}
            </p>
          )}
        </div>
        {cuenta.tienePago && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn" disabled={ocupado} onClick={() => abrirPortal("general")}>
              {t("sus.gestionar")}
            </button>
            {!cancelada && (
              <button className="btn fantasma" disabled={ocupado} onClick={() => abrirPortal("cancelar")}>
                {t("sus.cancelar")}
              </button>
            )}
          </div>
        )}
        <p className="tenue" style={{ marginTop: 10 }}>{t("sus.cancelarNota")}</p>
        {error && <p style={{ color: "var(--rojo)", fontSize: 13 }}>{error}</p>}
        <Politicas t={t} />
      </>
    );
  }

  // --------------------------------------------------------- aún no paga
  return (
    <>
      <div className="tarjeta" style={{ marginTop: 26, padding: 22 }}>
        {/* El precio va antes que la lista: es lo primero que busca quien entra,
            y Paddle exige verlo en la web antes de aprobar la cuenta. */}
        {hayAnual && (
          <div role="group" aria-label={t("sus.queIncluye")}
               style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["mes", "ano"] as const).map((cual) => {
              const act = plan === cual;
              return (
                <button key={cual} type="button" onClick={() => setPlan(cual)}
                  aria-pressed={act}
                  style={{
                    flex: 1, minHeight: 42, borderRadius: "var(--radio)", cursor: "pointer",
                    fontSize: 14, fontWeight: act ? 600 : 400,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    color: act ? "var(--tinta)" : "var(--tinta-2)",
                    background: act
                      ? "color-mix(in srgb, var(--acento) 14%, transparent)" : "transparent",
                    border: `1px solid ${act
                      ? "color-mix(in srgb, var(--acento) 46%, transparent)" : "var(--linea)"}`,
                  }}>
                  {t(cual === "mes" ? "sus.mensual" : "sus.anual")}
                  {cual === "ano" && tarifa.anual?.ahorro && (
                    <span className="pastilla acento" style={{ fontSize: 11, padding: "1px 7px" }}>
                      {t("sus.ahorras", { n: String(tarifa.anual.ahorro) })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {elegida && (
          <>
            <p style={{ margin: "0 0 4px", display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 600, color: "var(--tinta)" }}>{elegida.texto}</span>
              <span style={{ fontSize: 13.5, color: "var(--tinta-2)" }}>
                {t(elegida.intervalo === "year" ? "sus.alAno" : "sus.alMes")}
              </span>
            </p>
            {/* Al año, la cifra grande asusta si no se dice a cuánto sale el
                mes. Sin plan anual no hay nada que aclarar y la línea sobra. */}
            {(elegida.porMes || hayAnual) && (
              <p className="tenue" style={{ margin: "0 0 14px" }}>
                {elegida.porMes ? t("sus.equivale", { p: elegida.porMes }) : t("sus.mismoTodo")}
              </p>
            )}
          </>
        )}
        {/* Comparación en barras. Es la forma más honesta de enseñar el
            descuento: se ve el tamaño de las dos cifras, no sólo el número. */}
        {plan === "ano" && tarifa.anual?.doceMeses && tarifa.anual?.ahorro && (
          <div style={{ margin: "0 0 18px" }}>
            <Barra etiqueta={t("sus.doceSueltos")} valor={tarifa.anual.doceMeses}
                   ancho={100} acento={false} />
            <Barra etiqueta={t("sus.unAno")} valor={tarifa.anual.texto}
                   ancho={100 - tarifa.anual.ahorro} acento />
          </div>
        )}

        {/* Los cinco niveles, que es lo que de verdad se compra. */}
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--tinta-2)" }}>
          {t("sus.cincoNiveles")}
        </p>
        <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
          {NIVELES.map((n, i) => (
            <span key={n} style={{
              flex: 1, textAlign: "center", padding: "7px 0", fontSize: 13, fontWeight: 600,
              borderRadius: "var(--radio)", color: "var(--acento)",
              // Cada nivel un poco más presente que el anterior: sugiere avance
              // sin necesidad de una flecha ni de explicarlo.
              background: `color-mix(in srgb, var(--acento) ${7 + i * 4}%, transparent)`,
              border: `1px solid color-mix(in srgb, var(--acento) ${18 + i * 7}%, transparent)`,
            }}>{n}</span>
          ))}
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 12px" }}>{t("sus.queIncluye")}</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {VENTAJAS.map(({ k, Ic }) => (
            <li key={k} style={{
              display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12,
              fontSize: 14, lineHeight: 1.6, color: "var(--tinta-2)",
            }}>
              <span style={{
                flex: "0 0 auto", width: 30, height: 30, borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: "color-mix(in srgb, var(--acento) 13%, transparent)",
                border: "1px solid color-mix(in srgb, var(--acento) 26%, transparent)",
              }}>
                <Ic size={15} style={{ color: "var(--acento)" }} />
              </span>
              <span style={{ paddingTop: 5 }}>{t(k)}</span>
            </li>
          ))}
        </ul>
      </div>

      {!cuenta ? (
        // Sin sesión el precio y lo que incluye se ven igual: esconderlos
        // detrás de un login sólo consigue que la gente se vaya.
        <>
          <Link className="btn primario" href="/entrar?next=/suscripcion"
                style={{ width: "100%", minHeight: 48, marginTop: 14 }}>
            {t("per.entrar")} <IcDerecha size={15} />
          </Link>
          <p className="tenue" style={{ marginTop: 10 }}>{t("sus.entraPrimero")}</p>
        </>
      ) : ajustes.listo ? (
        <button className="btn primario" style={{ width: "100%", minHeight: 48, marginTop: 14 }}
                disabled={!cargado} onClick={suscribirse}>
          {cargado ? <>{t("sus.suscribirse")} <IcDerecha size={15} /></> : t("com.cargando")}
        </button>
      ) : (
        <p className="tenue" style={{ marginTop: 14 }}>{t("sus.aunNo")}</p>
      )}

      <p className="tenue" style={{ marginTop: 10 }}>{t("sus.letraPequena")}</p>
      {error && <p style={{ color: "var(--rojo)", fontSize: 13 }}>{error}</p>}
      <Politicas t={t} />
    </>
  );
}

/** Una barra de la comparación anual: etiqueta, cifra y longitud proporcional. */
function Barra({ etiqueta, valor, ancho, acento }: {
  etiqueta: string; valor: string; ancho: number; acento: boolean;
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5,
                    color: acento ? "var(--tinta)" : "var(--tinta-2)", marginBottom: 4 }}>
        <span>{etiqueta}</span>
        <span style={{ fontWeight: acento ? 600 : 400,
                       textDecoration: acento ? "none" : "line-through",
                       opacity: acento ? 1 : 0.7 }}>{valor}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--pista)", overflow: "hidden" }}>
        <div style={{
          width: `${Math.max(8, ancho)}%`, height: "100%", borderRadius: 4,
          background: acento
            ? "var(--acento)" : "color-mix(in srgb, var(--tinta-2) 32%, transparent)",
          transition: "width .3s ease-out",
        }} />
      </div>
    </div>
  );
}

/** Las tres políticas, donde las busca quien va a pagar. */
function Politicas({ t }: { t: (c: never) => string }) {
  return (
    <div className="filtros" style={{ justifyContent: "center", margin: "20px 0 4px" }}>
      <Link href="/legal/terminos" className="btn fantasma chico">{t("per.terminos" as never)}</Link>
      <Link href="/legal/privacidad" className="btn fantasma chico">{t("per.privacidad" as never)}</Link>
      <Link href="/legal/reembolsos" className="btn fantasma chico">{t("per.reembolsos" as never)}</Link>
    </div>
  );
}
