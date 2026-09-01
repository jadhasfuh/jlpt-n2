"use client";
import { useState } from "react";
import { useAjustes } from "./Ajustes";
import { Globo } from "./Globo";
import { IcBien, IcAviso } from "./Iconos";

type Tipo = "vocabulario" | "gramatica" | "lectura" | "item";
type Motivo = "traduccion" | "lectura" | "ejemplo" | "otro";

/**
 * Avisar de que algo está mal.
 *
 * Va donde se lee un significado, que es donde se descubre el error. El botón
 * es diminuto y sin color a propósito: tiene que estar disponible sin competir
 * con el contenido ni invitar a tocarlo por curiosidad.
 */
export function Reportar({ tipo, ref_, visto, compacto = false }: {
  tipo: Tipo; ref_: string | number; visto?: string; compacto?: boolean;
}) {
  const { t, idioma } = useAjustes();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<Motivo>("traduccion");
  const [sugerencia, setSugerencia] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "hecho" | "error">("");

  const enviar = async () => {
    setEstado("enviando");
    try {
      const r = await fetch("/api/reportes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, ref: String(ref_), visto, idioma, motivo, sugerencia }),
      });
      if (!r.ok) throw new Error();
      setEstado("hecho");
      setTimeout(() => { setAbierto(false); setEstado(""); setSugerencia(""); }, 1400);
    } catch {
      setEstado("error");
    }
  };

  return (
    <>
      <button
        className="reportar-btn"
        onClick={(e) => { e.stopPropagation(); setAbierto(true); }}
        aria-label={t("rep2.aria")}
        title={t("rep2.aria")}
      >
        <IcAviso size={compacto ? 11 : 12} />
      </button>

      {abierto && (
        <Globo cerrar={() => setAbierto(false)}>
          <div style={{ maxWidth: 340 }}>
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px" }}>{t("rep2.titulo")}</h2>
            <p className="tenue" style={{ marginTop: 0 }}>{t("rep2.sub")}</p>

            {visto && (
              <p style={{
                fontSize: 13, background: "var(--papel-2)", borderRadius: "var(--radio)",
                padding: "8px 10px", margin: "0 0 12px", color: "var(--tinta-2)",
              }}>{visto}</p>
            )}

            <div className="filtros" style={{ marginBottom: 12 }}>
              {(["traduccion", "lectura", "ejemplo", "otro"] as Motivo[]).map((m) => (
                <button key={m} className={`btn chico ${motivo === m ? "encendido" : ""}`}
                        onClick={() => setMotivo(m)}>{t(`rep2.m.${m}` as never)}</button>
              ))}
            </div>

            <textarea
              value={sugerencia} onChange={(e) => setSugerencia(e.target.value)}
              placeholder={t("rep2.marcador")} rows={3} maxLength={300}
              aria-label={t("rep2.marcador")}
              style={{
                width: "100%", background: "var(--papel-2)", color: "var(--tinta)",
                border: "1px solid var(--linea)", borderRadius: "var(--radio)",
                padding: "9px 11px", fontSize: 14, fontFamily: "inherit", resize: "vertical",
              }}
            />

            <button className="btn primario" style={{ width: "100%", marginTop: 10, minHeight: 44 }}
                    disabled={estado === "enviando" || estado === "hecho"} onClick={enviar}>
              {estado === "hecho" ? <><IcBien size={14} /> {t("rep2.gracias")}</>
               : estado === "enviando" ? t("rep2.enviando") : t("rep2.enviar")}
            </button>
            {estado === "error" && (
              <p style={{ color: "var(--rojo)", fontSize: 13 }}>{t("rep2.error")}</p>
            )}
          </div>
        </Globo>
      )}
    </>
  );
}
