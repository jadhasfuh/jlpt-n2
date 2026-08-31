"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useAjustes } from "@/components/Ajustes";

/**
 * Frontera de error de toda la app. Sin esto, cualquier excepción durante el
 * render deja una pantalla en blanco sin salida: aquí al menos hay un botón
 * para reintentar y otro para volver al inicio.
 */
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useAjustes();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="tarjeta" style={{ marginTop: 64, textAlign: "center", padding: 40 }}>
      <span className="jp" style={{ fontSize: 34, fontWeight: 500, color: "var(--rojo)" }}>故障</span>
      <p style={{ fontSize: 16, marginBottom: 2 }}>{t("err.roto")}</p>
      <p className="silencio" style={{ marginTop: 0 }}>{t("err.rotoSub")}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn primario" onClick={reset}>{t("err.reintentar")}</button>
        <Link className="btn" href="/">{t("err.inicio")}</Link>
      </div>
    </div>
  );
}
