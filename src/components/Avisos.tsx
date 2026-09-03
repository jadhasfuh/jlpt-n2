"use client";
import { useEffect, useState } from "react";
import { useAjustes } from "./Ajustes";
import { activar, cambiarHora, desactivar, estado, soporta, type EstadoAvisos } from "@/lib/avisos";
import { leerProgreso } from "@/lib/progreso";

/**
 * El interruptor de los avisos.
 *
 * El permiso del navegador se pide UNA vez y no hay vuelta atrás: si el
 * usuario dice que no, ni recargando se vuelve a preguntar. Por eso el botón
 * explica antes qué va a llegar y cuándo, en vez de disparar el diálogo del
 * navegador a bocajarro.
 *
 * Y por eso mismo, cuando ya está denegado, esto no insiste: dice cómo
 * volver a permitirlo desde los ajustes del navegador y se calla.
 */
export function Avisos() {
  const { t, idioma } = useAjustes();
  const [est, setEst] = useState<EstadoAvisos | null>(null);
  const [hora, setHora] = useState(20);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!soporta()) { setEst("no-soportado"); return; }
    void estado().then(setEst);
    try {
      const h = Number(localStorage.getItem("jlpt.avisos.hora"));
      if (Number.isInteger(h) && h >= 0 && h <= 23) setHora(h);
    } catch {}
  }, []);

  const alternar = async () => {
    setOcupado(true);
    try {
      if (est === "activo") setEst(await desactivar());
      else setEst(await activar(leerProgreso().perfil, hora, idioma));
    } finally { setOcupado(false); }
  };

  const ponerHora = (h: number) => {
    setHora(h);
    try { localStorage.setItem("jlpt.avisos.hora", String(h)); } catch {}
    if (est === "activo") void cambiarHora(h);
  };

  if (est === null || est === "no-soportado") return null;

  return (
    <section className="tarjeta" style={{ marginTop: 14 }}>
      <p className="etiqueta" style={{ marginTop: 0 }}>{t("avi.titulo")}</p>

      {est === "denegado" ? (
        <p className="silencio" style={{ margin: 0 }}>{t("avi.denegado")}</p>
      ) : (
        <>
          <p className="silencio" style={{ margin: "0 0 12px" }}>{t("avi.que")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button className={`btn ${est === "activo" ? "encendido" : "primario"}`}
                    onClick={alternar} disabled={ocupado}>
              {est === "activo" ? t("avi.quitar") : t("avi.activar")}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              {t("avi.hora")}
              <select className="btn chico" value={hora} aria-label={t("avi.hora")}
                      onChange={(e) => ponerHora(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
          {est === "activo" && (
            <p className="tenue" style={{ margin: "10px 0 0", fontSize: 12.5 }}>
              {t("avi.activo", { h: `${String(hora).padStart(2, "0")}:00` })}
            </p>
          )}
        </>
      )}
      <p className="tenue" style={{ margin: "10px 0 0", fontSize: 12 }}>
        {idioma === "en" ? "" : ""}{t("avi.aparato")}
      </p>
    </section>
  );
}
