"use client";
import { supabaseNavegador } from "./supabase";

export type MemoriaItem = { a: number; f: number; visto: number };  // aciertos, fallos
export type MemoriaUnidad = { practicada: boolean; mejor: number; tests: number };

export type Progreso = {
  perfil: string;
  xp: number;
  racha: { dias: number; ultimo: string };   // ultimo = YYYY-MM-DD
  palabras: Record<string, MemoriaItem>;
  gramatica: Record<string, MemoriaItem>;
  unidades: Record<string, MemoriaUnidad>;
};

const CLAVE = "jlpt.progreso";
export const XP_NUEVA = 10;      // primera vez que aciertas una palabra
export const XP_REPASO = 3;
export const XP_UNIDAD = 25;     // terminar la práctica de una unidad
export const XP_TEST = 50;       // aprobar el test (>= 80 %)

const hoy = () => new Date().toISOString().slice(0, 10);

const vacio = (): Progreso => ({
  perfil: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
  xp: 0, racha: { dias: 0, ultimo: "" },
  palabras: {}, gramatica: {}, unidades: {},
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
  window.dispatchEvent(new CustomEvent("progreso"));
  sincronizar(p);
}

async function sincronizar(p: Progreso) {
  const sb = supabaseNavegador();
  if (!sb) return;
  try {
    await sb.from("progreso").upsert(
      { perfil: p.perfil, datos: p, actualizado: new Date().toISOString() },
      { onConflict: "perfil" });
  } catch { /* el local ya quedó guardado */ }
}

/** Suma XP y mantiene la racha de días. */
function premiar(p: Progreso, xp: number) {
  p.xp += xp;
  const d = hoy();
  if (p.racha.ultimo !== d) {
    const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    p.racha.dias = p.racha.ultimo === ayer ? p.racha.dias + 1 : 1;
    p.racha.ultimo = d;
  }
}

export function anotar(
  tipo: "palabras" | "gramatica", clave: string | number, acierto: boolean,
): Progreso {
  const p = leerProgreso();
  const tabla = p[tipo];
  const k = String(clave);
  const antes = tabla[k];
  const e = antes ?? { a: 0, f: 0, visto: 0 };
  if (acierto) e.a++; else e.f++;
  e.visto = Date.now();
  tabla[k] = e;
  if (acierto) premiar(p, !antes || antes.a === 0 ? XP_NUEVA : XP_REPASO);
  guardar(p);
  return p;
}

export function terminarPractica(unidadId: string): Progreso {
  const p = leerProgreso();
  const u = p.unidades[unidadId] ?? { practicada: false, mejor: 0, tests: 0 };
  if (!u.practicada) { u.practicada = true; premiar(p, XP_UNIDAD); }
  p.unidades[unidadId] = u;
  guardar(p);
  return p;
}

export function registrarTest(unidadId: string, porcentaje: number): Progreso {
  const p = leerProgreso();
  const u = p.unidades[unidadId] ?? { practicada: false, mejor: 0, tests: 0 };
  u.tests++;
  const mejoro = porcentaje > u.mejor;
  if (mejoro) u.mejor = porcentaje;
  if (porcentaje >= 80 && mejoro) premiar(p, XP_TEST);
  p.unidades[unidadId] = u;
  guardar(p);
  return p;
}

/* ------------------------------- estados -------------------------------- */

export type EstadoItem = "nueva" | "aprendiendo" | "dominada";

export function estadoItem(m?: MemoriaItem): EstadoItem {
  if (!m || m.a + m.f === 0) return "nueva";
  return m.a >= 3 && m.a > m.f ? "dominada" : "aprendiendo";
}

/** 0 a 1: cuánto de la unidad está dominado. */
export function avanceUnidad(p: Progreso, ids: (string | number)[], tipo: "palabras" | "gramatica"): number {
  if (!ids.length) return 0;
  const n = ids.filter((i) => estadoItem(p[tipo][String(i)]) === "dominada").length;
  return n / ids.length;
}

export function medalla(mejor: number): "" | "🥉" | "🥈" | "🥇" {
  if (mejor >= 95) return "🥇";
  if (mejor >= 85) return "🥈";
  if (mejor >= 70) return "🥉";
  return "";
}

export function resumen(p: Progreso) {
  const vals = Object.values(p.palabras);
  return {
    xp: p.xp,
    racha: p.racha.ultimo === hoy() || p.racha.ultimo === new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      ? p.racha.dias : 0,
    vistas: vals.length,
    dominadas: vals.filter((m) => estadoItem(m) === "dominada").length,
    unidades: Object.values(p.unidades).filter((u) => u.practicada).length,
  };
}

/** Palabras que tocan repaso: falladas, o dominadas hace más de N días. */
export function paraRepasar(p: Progreso, dias = 3): number[] {
  const limite = Date.now() - dias * 864e5;
  return Object.entries(p.palabras)
    .filter(([, m]) => m.f > m.a || m.visto < limite)
    .sort((a, b) => a[1].visto - b[1].visto)
    .map(([id]) => Number(id))
    .filter((n) => Number.isFinite(n));
}
