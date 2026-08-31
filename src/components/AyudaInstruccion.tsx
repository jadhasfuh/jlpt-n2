"use client";
import { useState } from "react";
import { AYUDA_INSTRUCCION, type TipoItem } from "@/lib/examen";
import { useAjustes } from "./Ajustes";
import { Globo } from "./Globo";
import { JpHtml } from "./Jp";

/**
 * La instrucción del examen, con un botón «?» al lado.
 *
 * Las instrucciones van en japonés, como en el examen de verdad. Pero quedarse
 * atascado en la instrucción en vez de en la pregunta no enseña nada: el globo
 * la repite con furigana y traducida, y se cierra sin perder el sitio.
 */
export function AyudaInstruccion({ tipo, texto }: { tipo: TipoItem; texto: string }) {
  const { idioma, t } = useAjustes();
  const [abierta, setAbierta] = useState(false);
  const ayuda = AYUDA_INSTRUCCION[tipo];

  return (
    <>
      <p className="jp" style={{
        fontSize: 11.5, color: "var(--tinta-3)", margin: "0 0 10px", lineHeight: 1.6,
        display: "flex", alignItems: "flex-start", gap: 6,
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>{texto}</span>
        {ayuda && (
          <button onClick={() => setAbierta(true)} className="ayuda-btn"
                  aria-label={t("ex.queDice")} title={t("ex.queDice")}>?</button>
        )}
      </p>

      {abierta && ayuda && (
        <Globo cerrar={() => setAbierta(false)}>
          <div className="etiqueta" style={{ marginBottom: 8 }}>{t("ex.queDice")}</div>
          <JpHtml html={ayuda.ja} clase="jp-medio" />
          <p style={{
            marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--linea)",
            fontSize: 13.5, lineHeight: 1.6,
          }}>
            {ayuda[idioma]}
          </p>
        </Globo>
      )}
    </>
  );
}
