import { notFound } from "next/navigation";
import { Cabecera } from "@/components/Cabecera";
import { TestLibre } from "@/components/TestLibre";
import { supabaseServidor } from "@/lib/supabase-servidor";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";
import type { Item } from "@/lib/examen";
import { sitio } from "@/lib/sitio";

/**
 * El test de prueba: gratis, sin cuenta y sin pasar por el muro.
 *
 * Es la única puerta por la que alguien que no nos conoce puede ver de qué va
 * esto. Por eso vive fuera de /examen y no toca /api/examen: aquel camino
 * comprueba la suscripción, y mezclarlos era la forma más fácil de abrir un
 * agujero sin enterarse.
 *
 * Lo que se regala está acotado a propósito a 文字・語彙 y 文法, que es lo que
 * alguien quiere para medirse. La lectura y la escucha —lo que más cuesta
 * escribir— siguen siendo de la suscripción.
 */
export const revalidate = 0;

const ABIERTOS = ["N5", "N4"] as const;
type Abierto = (typeof ABIERTOS)[number];

/**
 * Sin pasajes ni audio: preguntas sueltas que se responden y se corrigen.
 *
 * La cuota es fija y las preguntas se toman siempre por id, de menor a mayor,
 * así que **el test es siempre el mismo**. No se barajan ni se rotan: si cada
 * visita sacara preguntas distintas, el banco entero de 文字・語彙 y 文法
 * quedaría abierto a base de recargar, y esto dejaría de ser una muestra para
 * convertirse en la versión gratis del producto.
 *
 * El reparto imita la proporción del examen real: pesa el vocabulario, y la
 * gramática va detrás.
 */
const CUOTA: Record<Abierto, Record<string, number>> = {
  // N5 no tiene 用法 en el banco, así que su cuota se reparte en el resto.
  N5: { kanji_yomi: 6, hyouki: 4, bunmyaku: 5, iikae: 3, bunpou1: 5, bunpou2: 2 },
  N4: { kanji_yomi: 5, hyouki: 4, bunmyaku: 5, iikae: 3, youhou: 3, bunpou1: 3, bunpou2: 2 },
};
/** El orden en que se presentan, como en el examen: primero léxico. */
const ORDEN = ["kanji_yomi", "hyouki", "bunmyaku", "iikae", "youhou", "bunpou1", "bunpou2"];
const CUANTAS = 25;

function esAbierto(n: string): n is Abierto {
  return (ABIERTOS as readonly string[]).includes(n);
}

export async function generateStaticParams() {
  return ABIERTOS.map((nivel) => ({ nivel: nivel.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivel.toUpperCase();
  if (!esAbierto(n)) return {};
  const idioma = await idiomaActual();
  const es = idioma === "es";
  const titulo = es
    ? `Test JLPT ${n} gratis — ${CUANTAS} preguntas con corrección`
    : `Free JLPT ${n} practice test — ${CUANTAS} questions with answers`;
  const desc = es
    ? `Mide tu nivel de japonés ${n} con ${CUANTAS} preguntas de vocabulario, kanji y gramática. Gratis, sin cuenta, con la explicación de cada respuesta.`
    : `Check your ${n} Japanese with ${CUANTAS} vocabulary, kanji and grammar questions. Free, no account, with an explanation for every answer.`;
  return {
    title: `${titulo} — jlptest`,
    description: desc,
    alternates: { canonical: `${sitio()}/test/${nivel.toLowerCase()}` },
    openGraph: { title: titulo, description: desc, url: `${sitio()}/test/${nivel.toLowerCase()}` },
  };
}

export default async function Pagina({ params }: { params: Promise<{ nivel: string }> }) {
  const { nivel } = await params;
  const n = nivel.toUpperCase();
  if (!esAbierto(n)) notFound();

  const idioma = await idiomaActual();
  const sb = supabaseServidor();
  const { data } = sb
    ? await sb.from("items")
        .select("id, tipo, instruccion_ja, enunciado, opciones, respuesta, explicacion, logica_distractores")
        .eq("nivel", n).in("tipo", ORDEN).order("id")
    : { data: null };

  const todos = (data ?? []) as Item[];
  const cuota = CUOTA[n];
  const items = ORDEN.flatMap((tipo) =>
    todos.filter((it) => it.tipo === tipo).slice(0, cuota[tipo] ?? 0),
  );

  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <TestLibre nivel={n} items={items} />
        {/* Texto para quien llega de un buscador y aún no ha empezado. Va
            debajo del test, no encima: quien viene a medirse quiere el botón,
            no un párrafo. */}
        <section style={{ marginTop: 34, paddingTop: 22, borderTop: "1px solid var(--linea)" }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 8px" }}>
            {trad("lib.queEs", idioma, { n })}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--tinta-2)", margin: 0, maxWidth: "62ch" }}>
            {trad(n === "N5" ? "lib.sobreN5" : "lib.sobreN4", idioma)}
          </p>
        </section>
      </main>
    </>
  );
}
