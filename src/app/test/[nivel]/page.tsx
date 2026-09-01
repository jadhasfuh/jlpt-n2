import { notFound } from "next/navigation";
import { Cabecera } from "@/components/Cabecera";
import { TestLibre } from "@/components/TestLibre";
import { idiomaActual } from "@/lib/idioma-servidor";
import { t as trad } from "@/lib/idioma";
import { sitio } from "@/lib/sitio";
import { ABIERTOS, esAbierto, itemsDelTest } from "@/lib/test-libre";
import { Marcador } from "@/components/Marcador";

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

const CUANTAS = 25;

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
  const items = await itemsDelTest(n);

  return (
    <>
      <Cabecera />
      <main className="envoltorio">
        <TestLibre nivel={n} items={items} />
        <Marcador nivel={n} idioma={idioma} />
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
