"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { COLOR_NIVEL, type Nivel } from "@/lib/tipos";
import { leerProgreso } from "@/lib/progreso";
import { Anillo } from "./Anillo";
import { esLibre } from "@/lib/acceso";
import { IcCandado, IcDerecha } from "./Iconos";
import { useAjustes } from "./Ajustes";

type S = { id: string; ja: string; es: string; en: string; palabras: number; gramatica: number; unidades: number };

export function ListaSecciones({ nivel, secciones }: { nivel: string; secciones: S[] }) {
  const { idioma, tieneAcceso } = useAjustes();
  const [avance, setAvance] = useState<Record<string, number>>({});
  useEffect(() => {
    const recalcular = () => {
      const p = leerProgreso();
      const a: Record<string, number> = {};
      for (const s of secciones) {
        const hechas = Object.entries(p.unidades)
          .filter(([id, u]) => u.practicada && id.startsWith(`${nivel}/${s.id}/`)).length;
        a[s.id] = s.unidades ? hechas / s.unidades : 0;
      }
      setAvance(a);
    };
    recalcular();
    window.addEventListener("progreso", recalcular);
    return () => window.removeEventListener("progreso", recalcular);
  }, [nivel, secciones]);

  return (
    <div className="lista">
      {secciones.map((s) => {
        // Mira si ESTA persona tiene acceso, no si está abierto para todos.
        // Con `accesoAbierto` a secas, quien pagaba seguía viendo candados.
        const bloqueada = !tieneAcceso && !esLibre(s.id);
        const contenido = (
          <>
            <Anillo pct={avance[s.id] ?? 0} tono={COLOR_NIVEL[nivel as Nivel]}
                    texto={`${Math.round((avance[s.id] ?? 0) * 100)}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="jp" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.4 }}>{s.ja}</div>
              {/* El nombre del tema en el idioma de la interfaz: en inglés
                  salía en español, que es de lo primero que se ve al entrar. */}
              <div className="tenue">
                {idioma === "en" ? s.en : s.es} · {s.palabras} · {s.unidades}
              </div>
            </div>
            {bloqueada ? <span className="flecha"><IcCandado size={15} /></span>
                       : !tieneAcceso && esLibre(s.id) ? <span className="pastilla gratis">gratis</span>
                       : <span className="flecha"><IcDerecha size={14} /></span>}
          </>
        );
        return bloqueada ? (
          <div key={s.id} className="fila" style={{ opacity: .55 }}>{contenido}</div>
        ) : (
          <Link key={s.id} href={`/n/${nivel}/${s.id}`} className="fila">{contenido}</Link>
        );
      })}
    </div>
  );
}
