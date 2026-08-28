"use client";
import { supabaseNavegador } from "./supabase";

export type EstadoPalabra = { aciertos: number; fallos: number; visto: number };
export type Progreso = {
  perfil: string;
  niveles: string[];                       // niveles completados
  palabras: Record<number, EstadoPalabra>; // memoria por palabra
  gramatica: Record<string, EstadoPalabra>;
};

const CLAVE = "jlpt.progreso";

const vacio = (): Progreso => ({
  perfil: (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
  niveles: [], palabras: {}, gramatica: {},
});

export function leerProgreso(): Progreso {
  if (typeof window === "undefined") return vacio();
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) { const p = vacio(); guardar(p); return p; }
    return { ...vacio(), ...(JSON.parse(bruto) as Progreso) };
  } catch { return vacio(); }
}

function guardar(p: Progreso) {
  try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch {}
  sincronizar(p);
}

/** Espejo en Supabase. Si no está configurado, no hace nada y no falla. */
async function sincronizar(p: Progreso) {
  const sb = supabaseNavegador();
  if (!sb) return;
  try {
    await sb.from("progreso").upsert(
      { perfil: p.perfil, datos: p, actualizado: new Date().toISOString() },
      { onConflict: "perfil" },
    );
  } catch { /* el progreso local ya quedó guardado */ }
}

export function completarNivel(id: string): Progreso {
  const p = leerProgreso();
  if (!p.niveles.includes(id)) p.niveles.push(id);
  guardar(p);
  return p;
}

export function anotar(tipo: "palabras" | "gramatica", clave: string | number, acierto: boolean): Progreso {
  const p = leerProgreso();
  const tabla = p[tipo] as Record<string | number, EstadoPalabra>;
  const e = tabla[clave] ?? { aciertos: 0, fallos: 0, visto: 0 };
  if (acierto) e.aciertos++; else e.fallos++;
  e.visto = Date.now();
  tabla[clave] = e;
  guardar(p);
  return p;
}

/** Palabras que conviene repasar: falladas, o vistas hace más de dos días. */
export function paraRepasar(p: Progreso, dias = 2): number[] {
  const limite = Date.now() - dias * 864e5;
  return Object.entries(p.palabras)
    .filter(([, e]) => e.fallos > e.aciertos || e.visto < limite)
    .sort((a, b) => a[1].visto - b[1].visto)
    .map(([id]) => Number(id));
}
