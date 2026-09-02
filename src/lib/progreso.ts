"use client";
import { supabaseNavegador } from "./supabase";

export type MemoriaItem = {
  a: number; f: number;      // aciertos y fallos acumulados
  visto: number;             // última vez que salió
  etapa?: number;            // 0 nuevo … 8 quemado
  proximo?: number;          // cuándo vuelve a tocar
};
export type MemoriaUnidad = { practicada: boolean; mejor: number; tests: number };

export type TopeRepaso = "auto" | number;

export type Progreso = {
  perfil: string;
  xp: number;
  racha: { dias: number; ultimo: string };   // ultimo = YYYY-MM-DD
  palabras: Record<string, MemoriaItem>;
  gramatica: Record<string, MemoriaItem>;
  unidades: Record<string, MemoriaUnidad>;
  hechosPorDia: Record<string, number>;      // YYYY-MM-DD -> repasos ese día
  tope: TopeRepaso;
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
  hechosPorDia: {}, tope: "auto",
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

  const d = hoy();
  p.hechosPorDia[d] = (p.hechosPorDia[d] ?? 0) + 1;

  if (acierto) premiar(p, !antes || antes.a === 0 ? XP_NUEVA : XP_REPASO);
  guardar(p);
  return p;
}

/**
 * Cuántos repasos enseñar hoy.
 *
 * Un tope fijo no sirve: para quien hace 20 al día, 100 es una montaña; para
 * quien hace 120, es quedarse corto. Así que sale de tu propio ritmo de la
 * última semana, con un suelo para que siempre haya algo que hacer.
 */
export const TOPE_MINIMO = 40;

export function topeDiario(p: Progreso): number {
  if (typeof p.tope === "number") return p.tope;
  const dias: number[] = [];
  for (let i = 1; i <= 7; i++) {
    const f = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    if (p.hechosPorDia[f]) dias.push(p.hechosPorDia[f]);
  }
  if (!dias.length) return TOPE_MINIMO;
  const media = dias.reduce((a, b) => a + b, 0) / dias.length;
  return Math.max(TOPE_MINIMO, Math.round((media * 1.5) / 10) * 10);
}

export function guardarTope(t: TopeRepaso): Progreso {
  const p = leerProgreso();
  p.tope = t;
  guardar(p);
  return p;
}

/** Cuántos llevas hechos hoy. */
export function hechosHoy(p: Progreso): number {
  return p.hechosPorDia[hoy()] ?? 0;
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
  // Hacer el test también cuenta como haber pasado por la unidad.
  //
  // Antes sólo la marcaba `terminarPractica`, o sea las tarjetas. Quien
  // terminaba el test veía su nota y los anillos del tema y del nivel seguían
  // clavados, como si no hubiera hecho nada. Y es al revés: contestar el test
  // demuestra más que pasar las tarjetas.
  //
  // La nota no entra aquí: el porcentaje del anillo mide cuánto has recorrido,
  // y lo bien que salió lo guardan `mejor` y la medalla.
  if (!u.practicada) { u.practicada = true; premiar(p, XP_UNIDAD); }
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

/** El grado del mejor test de una unidad. Sin emoji: se pinta como pastilla. */
export function medalla(mejor: number): "" | "bronce" | "plata" | "oro" {
  if (mejor >= 95) return "oro";
  if (mejor >= 85) return "plata";
  if (mejor >= 70) return "bronce";
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

/**
 * Lo que vence ahora. Primero lo más atrasado y, a igualdad, lo que está en
 * etapas bajas: son las frágiles, las que de verdad se pierden si no se ven.
 */
export function paraRepasar(p: Progreso): number[] {
  const ahora = Date.now();
  return Object.entries(p.palabras)
    .filter(([, m]) => (m.proximo ?? 0) <= ahora && m.a + m.f > 0)
    .sort((a, b) =>
      (a[1].proximo ?? 0) - (b[1].proximo ?? 0) || (a[1].etapa ?? 0) - (b[1].etapa ?? 0))
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

/**
 * Cuántas palabras vencen cada uno de los próximos siete días. El primer cubo
 * arrastra todo lo ya vencido: si llevas una semana sin entrar, lo atrasado
 * toca hoy, no el día en que venció.
 */
export function prevision7dias(p: Progreso): { diaSemana: number; n: number }[] {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicio = hoy.getTime();
  const cubos = Array(7).fill(0) as number[];
  for (const m of Object.values(p.palabras)) {
    if (!m.proximo || m.a + m.f === 0) continue;
    const d = Math.floor((m.proximo - inicio) / 864e5);
    if (d < 0) cubos[0]++;
    else if (d < 7) cubos[d]++;
  }
  // Devuelve el día de la semana, no su nombre: traducirlo es cosa de quien pinta.
  return cubos.map((n, i) => ({ diaSemana: (hoy.getDay() + i) % 7, n }));
}

/** Las que más veces has fallado: por dónde conviene empezar a apretar. */
export function masFlojas(p: Progreso, cuantas = 3): { id: number; fallos: number }[] {
  return Object.entries(p.palabras)
    .map(([id, m]) => ({ id: Number(id), fallos: m.f }))
    .filter((x) => x.fallos > 0)
    .sort((a, b) => b.fallos - a.fallos)
    .slice(0, cuantas);
}

/** Cuántas palabras tienes vivas: vistas alguna vez y aún no quemadas. */
export function vivas(p: Progreso): number {
  return Object.values(p.palabras).filter((m) => m.a + m.f > 0).length;
}

// ------------------------------------------------- adoptar una cuenta nueva

const mejorItem = (a?: MemoriaItem, b?: MemoriaItem): MemoriaItem | undefined => {
  if (!a) return b;
  if (!b) return a;
  // Gana quien esté más adelante en el SRS; a igual etapa, quien más veces la vio.
  const ea = a.etapa ?? 0, eb = b.etapa ?? 0;
  if (ea !== eb) return ea > eb ? a : b;
  return (a.a + a.f) >= (b.a + b.f) ? a : b;
};

/** Une dos progresos sin perder nada y sin inflar las cuentas. */
export function fusionar(local: Progreso, nube: Progreso): Progreso {
  const p: Progreso = { ...local };
  // XP y racha: el máximo, no la suma. Sumar duplicaría lo ya sincronizado
  // desde otro aparato, y regalar XP falso hace que el número deje de decir nada.
  p.xp = Math.max(local.xp, nube.xp);
  p.racha = (local.racha.ultimo >= nube.racha.ultimo ? local : nube).racha;
  p.racha = { ...p.racha, dias: Math.max(local.racha.dias, nube.racha.dias) };
  p.tope = local.tope !== "auto" ? local.tope : nube.tope;

  for (const campo of ["palabras", "gramatica"] as const) {
    const salida: Record<string, MemoriaItem> = {};
    for (const k of new Set([...Object.keys(local[campo]), ...Object.keys(nube[campo])])) {
      const m = mejorItem(local[campo][k], nube[campo][k]);
      if (m) salida[k] = m;
    }
    p[campo] = salida;
  }

  p.unidades = {};
  for (const k of new Set([...Object.keys(local.unidades), ...Object.keys(nube.unidades)])) {
    const a = local.unidades[k], b = nube.unidades[k];
    p.unidades[k] = {
      practicada: !!(a?.practicada || b?.practicada),
      mejor: Math.max(a?.mejor ?? 0, b?.mejor ?? 0),
      tests: Math.max(a?.tests ?? 0, b?.tests ?? 0),
    };
  }

  p.hechosPorDia = { ...nube.hechosPorDia };
  for (const [d, n] of Object.entries(local.hechosPorDia)) {
    p.hechosPorDia[d] = Math.max(n, p.hechosPorDia[d] ?? 0);
  }
  return p;
}

/**
 * Al entrar por primera vez con una cuenta, el avance hecho sin ella se lleva
 * consigo. Sin esto, quien estudia un mes y luego se registra vería su progreso
 * en cero, que es la peor bienvenida posible.
 */
export async function adoptarCuenta(usuarioId: string): Promise<Progreso> {
  const local = leerProgreso();
  const sb = supabaseNavegador();
  let unido = { ...local, perfil: usuarioId };

  if (sb) {
    try {
      const { data } = await sb.from("progreso")
        .select("datos").eq("perfil", usuarioId).maybeSingle();
      const nube = (data as { datos?: Progreso } | null)?.datos;
      if (nube) unido = { ...fusionar(local, nube), perfil: usuarioId };
    } catch { /* sin red: se sube lo local, que es mejor que nada */ }
  }

  try { localStorage.setItem(CLAVE, JSON.stringify(unido)); } catch {}
  window.dispatchEvent(new CustomEvent("progreso"));
  await sincronizar(unido);
  return unido;
}
