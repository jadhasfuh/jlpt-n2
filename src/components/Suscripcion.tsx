"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAjustes } from "./Ajustes";
import { IcBien, IcDerecha } from "./Iconos";

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
export function Suscripcion({ ajustes, cuenta }: {
  ajustes: { token: string; precio: string; entorno: string; listo: boolean };
  cuenta: { correo: string | null; id: string; alDia: boolean; membresia: string;
            vence: string | null; tienePago: boolean } | null;
}) {
  const { t } = useAjustes();
  const [cargado, setCargado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const arrancado = useRef(false);

  useEffect(() => {
    if (!ajustes.listo || arrancado.current) return;
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
  }, [ajustes, t]);

  const suscribirse = () => {
    if (!window.Paddle || !cuenta) return;
    window.Paddle.Checkout.open({
      items: [{ priceId: ajustes.precio, quantity: 1 }],
      ...(cuenta.correo ? { customer: { email: cuenta.correo } } : {}),
      // El id del perfil viaja con la compra: es lo que ata el pago a la cuenta
      // cuando el webhook llega, sin depender de que el correo coincida.
      customData: { perfil: cuenta.id },
      settings: { displayMode: "overlay", theme: "dark", locale: "es" },
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

  // ------------------------------------------------------------ sin cuenta
  if (!cuenta) {
    return (
      <div className="tarjeta" style={{ marginTop: 32, textAlign: "center", padding: 32 }}>
        <p style={{ fontSize: 16 }}>{t("sus.entraPrimero")}</p>
        <Link className="btn primario" href="/entrar?next=/suscripcion">
          {t("per.entrar")} <IcDerecha size={15} />
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------ ya está suscrito
  if (cuenta.alDia) {
    const cancelada = cuenta.membresia === "cancelada";
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
      </>
    );
  }

  // --------------------------------------------------------- aún no paga
  return (
    <>
      <div className="tarjeta" style={{ marginTop: 26, padding: 22 }}>
        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 10px" }}>{t("sus.queIncluye")}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.9, color: "var(--tinta-2)" }}>
          <li>{t("sus.p1")}</li>
          <li>{t("sus.p2")}</li>
          <li>{t("sus.p3")}</li>
          <li>{t("sus.p4")}</li>
        </ul>
      </div>

      {ajustes.listo ? (
        <button className="btn primario" style={{ width: "100%", minHeight: 48, marginTop: 14 }}
                disabled={!cargado} onClick={suscribirse}>
          {cargado ? <>{t("sus.suscribirse")} <IcDerecha size={15} /></> : t("com.cargando")}
        </button>
      ) : (
        <p className="tenue" style={{ marginTop: 14 }}>{t("sus.aunNo")}</p>
      )}

      <p className="tenue" style={{ marginTop: 10 }}>{t("sus.letraPequena")}</p>
      {error && <p style={{ color: "var(--rojo)", fontSize: 13 }}>{error}</p>}
    </>
  );
}
