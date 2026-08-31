"use client";
import { useEffect } from "react";
import { IcCerrar } from "./Iconos";

/** Ventana flotante centrada. Se cierra con Escape o tocando fuera. */
export function Globo({ children, cerrar }: { children: React.ReactNode; cerrar: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", esc);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = previo;
    };
  }, [cerrar]);

  return (
    <div className="velo" onClick={cerrar} role="dialog" aria-modal="true">
      <div className="globo" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button className="globo-cerrar" onClick={cerrar} aria-label="Cerrar"><IcCerrar size={18} /></button>
        {children}
      </div>
    </div>
  );
}
