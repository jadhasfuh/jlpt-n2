"use client";
import { supabaseNavegador } from "./supabase";

export type MemoriaItem = {
  a: number; f: number;      // aciertos y fallos acumulados
  visto: number;             // última vez que salió
  etapa?: number;            // 0 nuevo … 8 quemado
  proximo?: number;          // cuándo vuelve a tocar
};
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

/**
 * Repetición espaciada al estilo WaniKani. Aciertas y la palabra se va lejos;
 * fallas y retrocede dos etapas. Lo importante no es el algoritmo, es que
 * «Repaso» deje de ser una lista y pase a ser una cola que vence sola.
 */
export const ETAPAS_MS = [
  0,                 // 0 · nueva, aún no vista
  4 * 36e5,          // 1 · 4 horas
  8 * 36e5,          // 2 · 8 horas
  24 * 36e5,         // 3 · 1 día
  3 * 24 * 36e5,     // 4 · 3 días
  7 * 24 * 36e5,     // 5 · 1 semana
  14 * 24 * 36e5,    // 6 · 2 semanas
  30 * 24 * 36e5,    // 7 · 1 mes
  120 * 24 * 36e5,   // 8 · 4 meses (quemada)
];
export const ULTIMA_ETAPA = ETAPAS_MS.length - 1;
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
  const e: MemoriaItem = antes ?? { a: 0, f: 0, visto: 0, etapa: 0, proximo: 0 };
  const etapa = e.etapa ?? 0;

  if (acierto) {
    e.a++;
    e.etapa = Math.min(ULTIMA_ETAPA, etapa + 1);
  } else {
    e.f++;
    // Retroceder dos etapas duele, y por eso funciona.
    e.etapa = Math.max(1, etapa - 2);
  }
  e.visto = Date.now();
  e.proximo = Date.now() + ETAPAS_MS[e.etapa ?? 1];
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

export type EstadoItem = "nueva" | "aprendiendo" | "dominada" | "quemada";

export function estadoItem(m?: MemoriaItem): EstadoItem {
  if (!m || m.a + m.f === 0) return "nueva";
  const etapa = m.etapa ?? (m.a >= 3 && m.a > m.f ? 5 : 2);   // datos viejos, sin etapa
  if (etapa >= ULTIMA_ETAPA) return "quemada";
  if (etapa >= 5) return "dominada";
  return "aprendiendo";
}

/** Cuándo vuelve a tocar, en texto corto. */
export function cuandoToca(m?: MemoriaItem): string {
  if (!m?.proximo) return "ahora";
  const falta = m.proximo - Date.now();
  if (falta <= 0) return "ahora";
  const h = falta / 36e5;
  if (h < 1) return `${Math.ceil(falta / 6e4)} min`;
  if (h < 24) return `${Math.ceil(h)} h`;
  const d = h / 24;
  return d < 30 ? `${Math.ceil(d)} días` : `${Math.round(d / 30)} meses`;
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
    dominadas: vals.filter((m) => ["dominada", "quemada"].includes(estadoItem(m))).length,
    unidades: Object.values(p.unidades).filter((u) => u.practicada).length,
  };
}

/** Lo que vence ahora: la cola de repaso, de lo más atrasado a lo más reciente. */
export function paraRepasar(p: Progreso): number[] {
  const ahora = Date.now();
  return Object.entries(p.palabras)
    .filter(([, m]) => (m.proximo ?? 0) <= ahora && m.a + m.f > 0)
    .sort((a, b) => (a[1].proximo ?? 0) - (b[1].proximo ?? 0))
    .map(([id]) => Number(id))
    .filter((n) => Number.isFinite(n));
}

/** Cuántas vencen ahora y cuántas vencen hoy: es lo que se enseña en la portada. */
export function contarPendientes(p: Progreso) {
  const ahora = Date.now();
  const finDia = ahora + 864e5;
  let vencidas = 0, hoy = 0;
  for (const tabla of [p.palabras, p.gramatica]) {
    for (const m of Object.values(tabla)) {
      if (m.a + m.f === 0) continue;
      const t = m.proximo ?? 0;
      if (t <= ahora) vencidas++;
      else if (t <= finDia) hoy++;
    }
  }
  return { vencidas, hoy };
}
