"use client";
import Link from "next/link";
import { useAjustes } from "./Ajustes";
import { IcBien, IcCandado, IcDerecha } from "./Iconos";

/**
 * Lo que se ve al topar con algo que necesita suscripción.
 *
 * No es un error, así que no se parece a uno. Antes decía «Los exámenes están
 * en la suscripción» sobre fondo vacío, y quien lo leía pensaba que la app se
 * había roto. Aquí hay un icono, se explica qué se abre al suscribirse y se
 * deja bien visible la salida: seguir estudiando con lo que ya es gratis.
 */
export function MuroDePago({ que, cerrar, nivel }: {
  /** Qué intentaba abrir, para nombrarlo en el texto. */
  que: "examen" | "contenido";
  /** Si viene, se ofrece volver en vez de ir a la portada. */
  cerrar?: () => void;
  /** En qué nivel estaba, para ofrecerle el test abierto que le toca. */
  nivel?: string;
}) {
  const { t, enApp } = useAjustes();

  return (
    <div style={{ textAlign: "center", maxWidth: 380, margin: "0 auto", position: "relative" }}>
      <div className="halo" />

      <div style={{
        position: "relative", width: 76, height: 76, margin: "0 auto 20px",
        borderRadius: "50%", display: "grid", placeItems: "center",
        background: "color-mix(in srgb, var(--acento) 14%, transparent)",
        border: "1px solid color-mix(in srgb, var(--acento) 30%, transparent)",
      }}>
        <IcCandado size={30} weight="light" style={{ color: "var(--acento)" }} />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 8px", lineHeight: 1.35 }}>
        {t(que === "examen" ? "muro.tituloExamen" : "muro.tituloContenido")}
      </h2>
      <p style={{ fontSize: 14, color: "var(--tinta-2)", lineHeight: 1.65, margin: "0 0 20px" }}>
        {t("muro.cuerpo")}
      </p>

      <ul style={{
        listStyle: "none", padding: 0, margin: "0 0 22px", textAlign: "left",
        display: "inline-block",
      }}>
        {(["muro.v1", "muro.v2", "muro.v3"] as const).map((k) => (
          <li key={k} style={{
            display: "flex", alignItems: "flex-start", gap: 9,
            fontSize: 13.5, color: "var(--tinta-2)", lineHeight: 1.6, marginBottom: 7,
          }}>
            <IcBien size={15} style={{ color: "var(--acento)", flex: "0 0 auto", marginTop: 2 }} />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>

      {/* Dentro de la app no hay botón ni enlace: la política de pagos de Play
          prohíbe llevar al usuario a pagar fuera de su facturación, y aquí se
          cobra en la web. Se dice qué hace falta, no dónde conseguirlo. */}
      {enApp ? (
        <p style={{ fontSize: 13.5, color: "var(--tinta-2)", lineHeight: 1.6, margin: "0 0 14px" }}>
          {t("app.soloCuenta")}
        </p>
      ) : (
        <Link href="/suscripcion" className="btn primario"
              style={{ width: "100%", minHeight: 48 }}>
          {t("muro.ver")} <IcDerecha size={15} />
        </Link>
      )}

      {cerrar ? (
        <button className="btn fantasma" style={{ width: "100%", marginTop: 8 }} onClick={cerrar}>
          {t("muro.seguirGratis")}
        </button>
      ) : (
        <Link href="/" className="btn fantasma" style={{ width: "100%", marginTop: 8 }}>
          {t("muro.seguirGratis")}
        </Link>
      )}

      {/* A quien topa con el muro y no se suscribe hay que darle algo que
          hacer, o se va. El test abierto es lo único entero que puede usar sin
          pagar, así que es la salida honesta. Sólo existe para N5 y N4; en los
          demás niveles se ofrece el de N5, que es por donde se empieza. */}
      <Link href={`/test/${(nivel === "N4" ? "n4" : "n5")}`} className="btn fantasma chico"
            style={{ marginTop: 14 }}>
        {t("lib.enlaceMuro", { n: nivel === "N4" ? "N4" : "N5" })}
      </Link>

      <p className="tenue" style={{ marginTop: 14, fontSize: 12 }}>{t("muro.pie")}</p>
    </div>
  );
}
