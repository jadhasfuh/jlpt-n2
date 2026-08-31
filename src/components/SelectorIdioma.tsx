"use client";
import { IDIOMAS } from "@/lib/idioma";
import { useAjustes } from "./Ajustes";

/** Elegir idioma de la interfaz. El contenido japonés no cambia, claro. */
export function SelectorIdioma() {
  const { idioma, cambiarIdioma } = useAjustes();
  return (
    <div className="filtros" style={{ marginBottom: 0 }}>
      {IDIOMAS.map((i) => (
        <button key={i.id} className={`btn chico ${idioma === i.id ? "encendido" : ""}`}
                onClick={() => cambiarIdioma(i.id)} lang={i.id}>
          {i.nombre}
        </button>
      ))}
    </div>
  );
}
