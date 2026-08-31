"use client";

/** ¿Hay alguna voz japonesa instalada en este dispositivo? */
export function hayVozJaponesa(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang?.toLowerCase().startsWith("ja"));
}

/** Las voces tardan en cargar en algunos navegadores: hay que esperarlas. */
export function alCargarVoces(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  const s = window.speechSynthesis;
  if (s.getVoices().length) cb();
  s.addEventListener("voiceschanged", cb);
  return () => s.removeEventListener("voiceschanged", cb);
}

/**
 * Trocea el texto por su puntuación y devuelve cada trozo con la pausa que le
 * toca después. El sintetizador del navegador se come las comas y lo lee todo
 * de carrerilla; separando en frases y esperando entre ellas suena como alguien
 * hablando, que es lo que hace falta para entrenar el oído.
 */
function trocear(texto: string): { texto: string; pausa: number }[] {
  const trozos: { texto: string; pausa: number }[] = [];
  // Se corta DESPUÉS del signo para que el trozo lo conserve.
  for (const bruto of texto.split(/(?<=[。．.！!？?、，,・\n])/)) {
    const t = bruto.trim();
    if (!t) continue;
    const fin = /[。．.！!？?\n]$/.test(t) ? 420      // final de frase
              : /[、，,・]$/.test(t) ? 190             // coma: respiro corto
              : 0;
    trozos.push({ texto: t, pausa: fin });
  }
  return trozos.length ? trozos : [{ texto, pausa: 0 }];
}

/** Cancela también la cadena de trozos pendientes, no sólo lo que suena. */
let cadena = 0;

export function decir(texto: string, opciones: { rate?: number; alTerminar?: () => void } = {}) {
  const s = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!s) return;
  s.cancel();
  const mia = ++cadena;
  const ja = s.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ja"));
  const trozos = trocear(texto);

  const siguiente = (i: number) => {
    if (mia !== cadena) return;                 // llegó otro decir(): este muere
    if (i >= trozos.length) { opciones.alTerminar?.(); return; }
    const { texto: t, pausa } = trozos[i];
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "ja-JP";
    u.rate = opciones.rate ?? 0.85;
    if (ja) u.voice = ja;
    const seguir = () => {
      if (mia !== cadena) return;
      if (pausa) setTimeout(() => siguiente(i + 1), pausa);
      else siguiente(i + 1);
    };
    u.onend = seguir;
    u.onerror = seguir;
    s.speak(u);
  };
  siguiente(0);
}

export const callar = () => { cadena++; window.speechSynthesis?.cancel(); };
export const pausar = () => window.speechSynthesis?.pause();
export const reanudar = () => window.speechSynthesis?.resume();
export const hablando = () => !!window.speechSynthesis?.speaking;

/** Quita el marcado y el furigana: si no, el lector dice la lectura dos veces. */
export const soloTexto = (html: string) =>
  html.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");

/** Parte un texto japonés en frases, para poder reproducirlas de una en una. */
export const enFrases = (texto: string) =>
  texto.split(/(?<=[。！？])/).map((f) => f.trim()).filter(Boolean);
