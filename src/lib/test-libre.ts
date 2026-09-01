import "server-only";
import { supabaseServidor } from "./supabase-servidor";
import type { Item } from "./examen";

/**
 * El test abierto: qué preguntas lo forman y cómo se corrige.
 *
 * Vive aquí, y no en la página, porque el endpoint del marcador tiene que
 * corregir **exactamente** el mismo test que se sirvió. Si cada uno armara su
 * lista por su cuenta, bastaría con que alguien tocara una cuota para que las
 * notas guardadas dejaran de significar lo mismo que las de la semana pasada.
 */

export const ABIERTOS = ["N5", "N4"] as const;
export type Abierto = (typeof ABIERTOS)[number];

export function esAbierto(n: string): n is Abierto {
  return (ABIERTOS as readonly string[]).includes(n);
}

/**
 * Cuota fija por tipo. Las preguntas se toman siempre por id, de menor a
 * mayor, así que **el test es siempre el mismo**. No se barajan ni se rotan:
 * si cada visita sacara preguntas distintas, el banco entero de 文字・語彙 y
 * 文法 quedaría abierto a base de recargar, y esto dejaría de ser una muestra
 * para convertirse en la versión gratis del producto.
 *
 * El reparto imita la proporción del examen real: pesa el vocabulario y la
 * gramática va detrás. N5 no tiene 用法 en el banco, así que su cuota se
 * reparte en el resto.
 */
const CUOTA: Record<Abierto, Record<string, number>> = {
  N5: { kanji_yomi: 6, hyouki: 4, bunmyaku: 5, iikae: 3, bunpou1: 5, bunpou2: 2 },
  N4: { kanji_yomi: 5, hyouki: 4, bunmyaku: 5, iikae: 3, youhou: 3, bunpou1: 3, bunpou2: 2 },
};

/** El orden en que se presentan, como en el examen: primero léxico. */
export const ORDEN = ["kanji_yomi", "hyouki", "bunmyaku", "iikae", "youhou", "bunpou1", "bunpou2"];

/** Sin pasajes ni audio: preguntas sueltas que se responden y se corrigen. */
const CAMPOS = "id, tipo, instruccion_ja, enunciado, opciones, respuesta, explicacion, logica_distractores";

export async function itemsDelTest(nivel: Abierto): Promise<Item[]> {
  const sb = supabaseServidor();
  if (!sb) return [];
  const { data } = await sb.from("items")
    .select(CAMPOS).eq("nivel", nivel).in("tipo", ORDEN).order("id");
  const todos = (data ?? []) as Item[];
  const cuota = CUOTA[nivel];
  return ORDEN.flatMap((tipo) =>
    todos.filter((it) => it.tipo === tipo).slice(0, cuota[tipo] ?? 0),
  );
}

/**
 * Corrige en el servidor.
 *
 * La nota no viaja nunca desde el navegador: llegan las respuestas y aquí se
 * comparan con las de la base. Aceptar el número que mande el cliente sería
 * dejar que cualquiera presida el marcador con un cien por cien inventado.
 */
export async function corregir(nivel: Abierto, respuestas: Record<string, number>) {
  const items = await itemsDelTest(nivel);
  if (!items.length) return null;
  const aciertos = items.filter((it) => respuestas[it.id] === it.respuesta).length;
  return { aciertos, total: items.length };
}
