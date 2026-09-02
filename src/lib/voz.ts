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

/** Un turno de diálogo: quién habla y qué dice. */
export type Tramo = { texto: string; quien?: "M" | "F" };

/**
 * Elige una voz japonesa para cada personaje.
 *
 * En el examen de escucha hay dos personas hablando, y hasta ahora sonaban
 * exactamente igual: el guion se juntaba en una sola cadena y se leía del
 * tirón. Muchas preguntas dependen de distinguirlas —«女の人はこの後まず何を
 * しますか» no se puede contestar si no se oye quién habla—, así que eso hacía
 * esas preguntas más difíciles que en el examen de verdad, y a veces
 * imposibles.
 *
 * Si el aparato tiene dos voces japonesas, una para cada uno. Los nombres son
 * la mejor pista disponible: macOS trae Kyoko (mujer) y Otoya (hombre), y
 * varios sistemas rotulan la voz con «male» o «female». Cuando no hay pista se
 * reparten por orden, que al menos las hace distintas entre sí.
 */
/**
 * Qué voz pone a cada personaje.
 *
 * La regla es no adivinar nunca el sexo de una voz. Antes, si no se
 * reconocía ninguna por el nombre, se repartían las dos primeras de la lista
 * como hombre y mujer — y en macOS la primera es Kyoko, que es voz de mujer.
 * Resultado: los papeles salían cambiados, y encima sólo a veces, porque la
 * lista de voces del navegador llega vacía en la primera llamada y llena en
 * la segunda. La misma escucha sonaba distinta al darle otra vez a reproducir.
 *
 * Ahora, si no hay una pareja identificada, se usa una sola voz y se
 * distinguen por tono. Suena peor, pero nunca al revés.
 */
function vocesJaponesas(s: SpeechSynthesis) {
  const ja = s.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ja"));
  if (!ja.length) return { M: null, F: null, unaSola: true };

  const nombre = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  const esMujer = (v: SpeechSynthesisVoice) =>
    /female|#female|kyoko|o-ren|haruka|ayumi|nanami|mizuki|sayaka|tomoko/.test(nombre(v));
  const esHombre = (v: SpeechSynthesisVoice) =>
    !esMujer(v) && /male|#male|otoya|ichiro|hattori|keita|daichi|takumi/.test(nombre(v));

  const mujer = ja.find(esMujer) ?? null;
  const hombre = ja.find(esHombre) ?? null;
  if (hombre && mujer) return { M: hombre, F: mujer, unaSola: false };

  // Con una sola identificada, la pareja es cualquier otra: no sabremos su
  // sexo, pero sabemos que no es la que ya tenemos.
  if (mujer) {
    const otra = ja.find((v) => v !== mujer);
    if (otra) return { M: otra, F: mujer, unaSola: false };
  }
  if (hombre) {
    const otra = ja.find((v) => v !== hombre);
    if (otra) return { M: hombre, F: otra, unaSola: false };
  }
  // Ninguna identificada: una voz y dos tonos, que es honesto y estable.
  return { M: ja[0], F: ja[0], unaSola: true };
}

/**
 * Espera a que el navegador cargue la lista de voces.
 *
 * `getVoices()` devuelve una lista vacía hasta que el motor termina de
 * cargarlas y avisa por `voiceschanged`. Sin esperar, la primera
 * reproducción de la página sonaba con el reparto de emergencia y la
 * siguiente con otro distinto.
 */
function conVoces(s: SpeechSynthesis, seguir: () => void) {
  if (s.getVoices().length) return seguir();
  let hecho = false;
  const una = () => { if (!hecho) { hecho = true; seguir(); } };
  s.addEventListener("voiceschanged", una, { once: true });
  // Hay navegadores que nunca lanzan el evento: no dejarlo colgado.
  setTimeout(una, 500);
}

/**
 * Lee una secuencia de tramos, cada uno con su voz.
 *
 * Cuando sólo hay una voz japonesa instalada —lo normal en Android— se
 * distinguen bajando el tono para él y subiéndolo para ella. No es lo mismo
 * que dos voces, pero se nota; y es mejor que dos personas idénticas.
 */
export function decirTramos(
  tramos: Tramo[],
  opciones: { rate?: number; alTerminar?: () => void } = {},
) {
  const s = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!s) return;
  s.cancel();
  const mia = ++cadena;
  conVoces(s, () => {
  if (mia !== cadena) return;
  const voces = vocesJaponesas(s);

  // Se aplana a trozos sueltos, arrastrando quién habla en cada uno, para que
  // las pausas por puntuación sigan funcionando dentro de cada turno.
  const cola = tramos.flatMap((tr) =>
    trocear(tr.texto).map((t, i, todos) => ({
      ...t,
      quien: tr.quien,
      // Entre un turno y el siguiente, un silencio más largo: es lo que hace
      // que se oiga como una conversación y no como un párrafo.
      pausa: i === todos.length - 1 ? Math.max(t.pausa, 520) : t.pausa,
    })),
  );

  const siguiente = (i: number) => {
    if (mia !== cadena) return;                 // llegó otro: este muere
    if (i >= cola.length) { opciones.alTerminar?.(); return; }
    const { texto: t, pausa, quien } = cola[i];
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "ja-JP";
    u.rate = opciones.rate ?? 0.85;
    const voz = quien === "M" ? voces.M : quien === "F" ? voces.F : voces.M;
    if (voz) u.voice = voz;
    if (quien && voces.unaSola) u.pitch = quien === "M" ? 0.8 : 1.2;
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
  });
}

/** Un texto suelto, sin personajes. */
export function decir(texto: string, opciones: { rate?: number; alTerminar?: () => void } = {}) {
  decirTramos([{ texto }], opciones);
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
