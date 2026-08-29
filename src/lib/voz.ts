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

export function decir(texto: string, opciones: { rate?: number; alTerminar?: () => void } = {}) {
  const s = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!s) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = "ja-JP";
  u.rate = opciones.rate ?? 0.85;
  const ja = s.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ja"));
  if (ja) u.voice = ja;
  if (opciones.alTerminar) { u.onend = opciones.alTerminar; u.onerror = opciones.alTerminar; }
  s.speak(u);
}

export const callar = () => window.speechSynthesis?.cancel();
export const pausar = () => window.speechSynthesis?.pause();
export const reanudar = () => window.speechSynthesis?.resume();
export const hablando = () => !!window.speechSynthesis?.speaking;

/** Quita el marcado y el furigana: si no, el lector dice la lectura dos veces. */
export const soloTexto = (html: string) =>
  html.replace(/<rt>.*?<\/rt>/g, "").replace(/<[^>]+>/g, "");

/** Parte un texto japonés en frases, para poder reproducirlas de una en una. */
export const enFrases = (texto: string) =>
  texto.split(/(?<=[。！？])/).map((f) => f.trim()).filter(Boolean);
